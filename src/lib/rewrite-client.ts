import { NOTES_DELIMITER } from "./prompts";

export type EditStrength = "light" | "balanced" | "full";

export interface RewriteNote {
  title: string;
  detail: string;
}

export interface RewriteResult {
  rewrite: string;
  notes: RewriteNote[];
}

export interface RewriteRequest {
  original: string;
  voiceId: string;
  strength: EditStrength;
  signal?: AbortSignal;
  onPartial?: (partialRewrite: string) => void;
}

export interface RewriteStreamState {
  status: "idle" | "running" | "done" | "error";
  progress?: number;
  text?: string;
  error?: string;
}

export class RewriteError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.name = "RewriteError";
    this.code = code;
  }
}

function parseNotesJson(rawJson: string): RewriteNote[] {
  const trimmed = rawJson.trim();
  if (!trimmed) return [];

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((item) => item && typeof item.title === "string" && typeof item.detail === "string")
        .map((item) => ({
          title: String(item.title).slice(0, 100),
          detail: String(item.detail).slice(0, 300),
        }));
    }
  } catch {
    // Attempt relaxed regex extraction for notes if model produced slightly malformed JSON
    const noteMatches = [
      ...trimmed.matchAll(/\{\s*"title"\s*:\s*"([^"]+)"\s*,\s*"detail"\s*:\s*"([^"]+)"\s*\}/g),
    ];
    if (noteMatches.length > 0) {
      return noteMatches.map((m) => ({
        title: m[1],
        detail: m[2],
      }));
    }
  }
  return [];
}

/**
 * Real streaming client connecting to /api/rewrite
 */
export async function startRewrite(
  request: RewriteRequest
): Promise<RewriteResult> {
  if (typeof window !== "undefined" && !navigator.onLine) {
    throw new RewriteError("You appear to be offline. Check your network connection.", "OFFLINE");
  }

  // 1. Read optional user Groq key from localStorage
  let userKey: string | null = null;
  if (typeof window !== "undefined") {
    try {
      userKey = localStorage.getItem("imhuman-groq-key")?.trim() || null;
    } catch {
      // Ignore localStorage read failures
    }
  }

  // 2. Prepare headers & payload
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (userKey) {
    headers["x-user-groq-key"] = userKey;
  }

  const voicePayload =
    request.voiceId === "conversational"
      ? ({ kind: "preset", id: "conversational" } as const)
      : ({ kind: "preset", id: "neutral" } as const);

  let response: Response;
  try {
    response = await fetch("/api/rewrite", {
      method: "POST",
      headers,
      body: JSON.stringify({
        text: request.original,
        strength: request.strength,
        voice: voicePayload,
      }),
      signal: request.signal,
    });
  } catch (err: unknown) {
    if (request.signal?.aborted || (err as { name?: string })?.name === "AbortError") {
      throw err;
    }
    throw new RewriteError(
      "You appear to be offline. Check your network connection.",
      "NETWORK_ERROR"
    );
  }

  // 3. Handle non-200 JSON errors
  if (!response.ok) {
    let errorMessage = "An error occurred while processing the rewrite.";
    let errorCode = "UNKNOWN";

    try {
      const errorData = await response.json();
      if (errorData?.error?.message) {
        errorMessage = errorData.error.message;
        errorCode = errorData.error.code || "API_ERROR";
      }
    } catch {
      if (response.status === 429) {
        errorMessage = "Groq is busy right now. Try again in about 20 seconds.";
        errorCode = "RATE_LIMITED";
      } else if (response.status === 401) {
        errorMessage = "Invalid Groq API key. Please check your key in Settings.";
        errorCode = "INVALID_KEY";
      }
    }

    throw new RewriteError(errorMessage, errorCode);
  }

  // 4. Stream response body
  if (!response.body) {
    throw new RewriteError("Server returned empty response stream.", "EMPTY_STREAM");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullStreamText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    fullStreamText += chunk;

    // Check if delimiter has appeared yet
    const delimiterIndex = fullStreamText.indexOf(NOTES_DELIMITER);
    if (delimiterIndex === -1) {
      // Entire text so far is rewrite text
      request.onPartial?.(fullStreamText);
    } else {
      // Delimiter reached: send only the rewrite portion
      const rewritePortion = fullStreamText.slice(0, delimiterIndex).trim();
      request.onPartial?.(rewritePortion);
    }
  }

  // 5. Final output splitting & notes parsing
  const delimiterIndex = fullStreamText.indexOf(NOTES_DELIMITER);
  if (delimiterIndex === -1) {
    return {
      rewrite: fullStreamText.trim(),
      notes: [],
    };
  }

  const finalRewrite = fullStreamText.slice(0, delimiterIndex).trim();
  const rawNotes = fullStreamText.slice(delimiterIndex + NOTES_DELIMITER.length);
  const parsedNotes = parseNotesJson(rawNotes);

  return {
    rewrite: finalRewrite,
    notes: parsedNotes,
  };
}
