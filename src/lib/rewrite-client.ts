export class NotConnectedError extends Error {
  constructor(message = "The rewrite engine isn’t connected yet.") {
    super(message);
    this.name = "NotConnectedError";
  }
}

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
}

export interface RewriteStreamState {
  status: "idle" | "running" | "done" | "error";
  progress?: number;
  text?: string;
  error?: string;
}

/**
 * Single integration point for Phase 3.
 * Throws NotConnectedError until the Groq route handler is wired up in Phase 3.
 */
export async function startRewrite(
  request: RewriteRequest
): Promise<RewriteResult> {
  void request;
  throw new NotConnectedError("The rewrite engine isn’t connected yet.");
}
