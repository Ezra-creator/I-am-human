import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createGroq } from "@ai-sdk/groq";
import { streamText } from "ai";
import { checkRateLimit } from "@/lib/rate-limit";
import { buildSystemPrompt, estimateMaxTokens } from "@/lib/prompts";
import { MIN_INPUT_CHARS, MAX_INPUT_CHARS } from "@/lib/limits";
import { validateServerEnv } from "@/lib/env";

export const runtime = "nodejs";

const RequestSchema = z.object({
  text: z
    .string()
    .transform((val) => val.trim())
    .refine(
      (val) => val.length >= MIN_INPUT_CHARS,
      `Text must be at least ${MIN_INPUT_CHARS} characters.`
    )
    .refine(
      (val) => val.length <= MAX_INPUT_CHARS,
      `Text must not exceed ${MAX_INPUT_CHARS} characters.`
    ),
  strength: z.enum(["light", "balanced", "full"]),
  voice: z.discriminatedUnion("kind", [
    z.object({
      kind: z.literal("preset"),
      id: z.enum(["neutral", "conversational"]),
    }),
    z.object({
      kind: z.literal("profile"),
      descriptor: z.string().max(1500, "Descriptor must be under 1500 characters."),
    }),
  ]),
});

interface ApiErrorResponse {
  error: {
    code:
      | "INVALID_INPUT"
      | "RATE_LIMITED"
      | "UPSTREAM_RATE_LIMITED"
      | "UPSTREAM_ERROR"
      | "INTERNAL_ERROR";
    message: string;
  };
}

function jsonError(
  code: ApiErrorResponse["error"]["code"],
  message: string,
  status: number,
  startTime: number,
  headers?: Record<string, string>
) {
  // Log status, error code, and timing only; never log text or keys
  const duration = `${Date.now() - startTime}ms`;
  console.error(`[api/rewrite] status: ${status}, error_code: ${code}, duration: ${duration}`);
  return NextResponse.json<ApiErrorResponse>(
    { error: { code, message } },
    { status, headers }
  );
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  // 1. Content-Type pre-check
  const contentType = req.headers.get("content-type");
  if (!contentType || !contentType.toLowerCase().includes("application/json")) {
    return jsonError(
      "INVALID_INPUT",
      "Invalid Content-Type header. Expected application/json.",
      415,
      startTime
    );
  }

  // 2. Oversized body pre-check (allow reasonable JSON envelope overhead)
  const contentLength = req.headers.get("content-length");
  const maxBodyBytes = MAX_INPUT_CHARS * 4 + 4096;
  if (contentLength && parseInt(contentLength, 10) > maxBodyBytes) {
    return jsonError(
      "INVALID_INPUT",
      "Request payload exceeds maximum allowed size.",
      413,
      startTime
    );
  }

  // 3. Client IP rate limiting
  const forwarded = req.headers.get("x-forwarded-for");
  const clientIp = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";

  const rateResult = checkRateLimit(clientIp);
  if (!rateResult.success) {
    const retryAfter = rateResult.retryAfterSeconds ?? 30;
    return jsonError(
      "RATE_LIMITED",
      `Groq is busy right now. Try again in about ${retryAfter} seconds.`,
      429,
      startTime,
      { "Retry-After": String(retryAfter) }
    );
  }

  // 4. Body validation
  let parsedBody: z.infer<typeof RequestSchema>;
  try {
    const rawBody = await req.json();
    const result = RequestSchema.safeParse(rawBody);
    if (!result.success) {
      const firstIssue = result.error.issues[0]?.message || "Invalid request payload.";
      return jsonError("INVALID_INPUT", firstIssue, 400, startTime);
    }
    parsedBody = result.data;
  } catch {
    return jsonError("INVALID_INPUT", "Malformed JSON request body.", 400, startTime);
  }

  // 5. Environment & API Key resolution (strictly server-side environment variable)
  let apiKey: string;
  let modelId: string;
  try {
    const serverEnv = validateServerEnv();
    apiKey = serverEnv.GROQ_API_KEY;
    modelId = serverEnv.GROQ_MODEL;
  } catch {
    return jsonError(
      "INTERNAL_ERROR",
      "Groq service is not configured on this server.",
      500,
      startTime
    );
  }

  // 6. Groq model invocation
  try {
    const groq = createGroq({ apiKey });
    const model = groq(modelId);

    const systemPrompt = buildSystemPrompt(parsedBody.strength, parsedBody.voice);
    const maxTokens = estimateMaxTokens(parsedBody.text);

    const streamResult = streamText({
      model,
      system: systemPrompt,
      prompt: parsedBody.text,
      temperature: 0.7,
      maxOutputTokens: maxTokens,
      abortSignal: req.signal,
    });

    console.log(`[api/rewrite] status: 200, duration: ${Date.now() - startTime}ms (streaming started)`);
    return streamResult.toTextStreamResponse();
  } catch (err: unknown) {
    const errorObj = err as {
      statusCode?: number;
      responseHeaders?: Record<string, string>;
      message?: string;
    };

    const status = errorObj?.statusCode || 500;
    const msg = errorObj?.message || "";

    if (status === 429 || msg.toLowerCase().includes("rate limit")) {
      const retryAfter = errorObj.responseHeaders?.["retry-after"] || "20";
      return jsonError(
        "UPSTREAM_RATE_LIMITED",
        `Groq is busy right now. Try again in about ${retryAfter} seconds.`,
        429,
        startTime,
        { "Retry-After": retryAfter }
      );
    }

    if (status >= 500 || msg.toLowerCase().includes("fetch failed")) {
      return jsonError(
        "UPSTREAM_ERROR",
        "Could not reach Groq servers. Please try again shortly.",
        502,
        startTime
      );
    }

    return jsonError(
      "INTERNAL_ERROR",
      "An unexpected error occurred while processing your rewrite.",
      500,
      startTime
    );
  }
}
