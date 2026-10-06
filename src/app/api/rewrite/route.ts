import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createGroq } from "@ai-sdk/groq";
import { streamText } from "ai";
import { checkRateLimit } from "@/lib/rate-limit";
import { buildSystemPrompt, estimateMaxTokens } from "@/lib/prompts";
import { MIN_INPUT_CHARS, MAX_INPUT_CHARS } from "@/lib/limits";

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
      | "INVALID_KEY"
      | "UPSTREAM_ERROR"
      | "INTERNAL_ERROR";
    message: string;
  };
}

function jsonError(
  code: ApiErrorResponse["error"]["code"],
  message: string,
  status: number,
  headers?: Record<string, string>
) {
  // Log status and error code only; never request text or keys
  console.error(`[api/rewrite] status: ${status}, error_code: ${code}`);
  return NextResponse.json<ApiErrorResponse>(
    { error: { code, message } },
    { status, headers }
  );
}

export async function POST(req: NextRequest) {
  // 1. Read optional user Groq key from header (never logged or persisted)
  const userGroqKey = req.headers.get("x-user-groq-key")?.trim() || null;
  const hasUserKey = Boolean(userGroqKey);

  // 2. Client IP rate limiting (exempt if user provided their own key)
  if (!hasUserKey) {
    const forwarded = req.headers.get("x-forwarded-for");
    const clientIp = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";

    const rateResult = checkRateLimit(clientIp);
    if (!rateResult.success) {
      const retryAfter = rateResult.retryAfterSeconds ?? 30;
      return jsonError(
        "RATE_LIMITED",
        `You’ve reached the free request limit. Try again in about ${retryAfter} seconds, or add your own Groq key in Settings.`,
        429,
        { "Retry-After": String(retryAfter) }
      );
    }
  }

  // 3. Body validation
  let parsedBody: z.infer<typeof RequestSchema>;
  try {
    const rawBody = await req.json();
    const result = RequestSchema.safeParse(rawBody);
    if (!result.success) {
      const firstIssue = result.error.issues[0]?.message || "Invalid request payload.";
      return jsonError("INVALID_INPUT", firstIssue, 400);
    }
    parsedBody = result.data;
  } catch {
    return jsonError("INVALID_INPUT", "Malformed JSON request body.", 400);
  }

  // 4. API Key resolution
  const apiKey = userGroqKey || process.env.GROQ_API_KEY;
  if (!apiKey) {
    return jsonError(
      "INVALID_KEY",
      "No Groq API key configured. Please set your key in Settings or add GROQ_API_KEY on the server.",
      401
    );
  }

  // 5. Groq model invocation
  try {
    const groq = createGroq({ apiKey });
    const modelId = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
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

    console.log("[api/rewrite] status: 200 (streaming started)");
    return streamResult.toTextStreamResponse();
  } catch (err: unknown) {
    const errorObj = err as {
      statusCode?: number;
      responseHeaders?: Record<string, string>;
      message?: string;
    };

    const status = errorObj?.statusCode || 500;
    const msg = errorObj?.message || "";

    if (status === 401 || msg.toLowerCase().includes("invalid api key")) {
      return jsonError(
        "INVALID_KEY",
        "The Groq API key is invalid. Please verify your key.",
        401
      );
    }

    if (status === 429 || msg.toLowerCase().includes("rate limit")) {
      const retryAfter = errorObj.responseHeaders?.["retry-after"] || "20";
      return jsonError(
        "UPSTREAM_RATE_LIMITED",
        `Groq is busy right now. Try again in about ${retryAfter} seconds.`,
        429,
        { "Retry-After": retryAfter }
      );
    }

    if (status >= 500 || msg.toLowerCase().includes("fetch failed")) {
      return jsonError(
        "UPSTREAM_ERROR",
        "Could not reach Groq servers. Please try again shortly.",
        502
      );
    }

    return jsonError(
      "INTERNAL_ERROR",
      "An unexpected error occurred while processing your rewrite.",
      500
    );
  }
}
