import { z } from "zod";

const serverEnvSchema = z.object({
  GROQ_API_KEY: z.string().min(1, "GROQ_API_KEY environment variable is required and cannot be empty"),
  GROQ_MODEL: z.string().min(1).default("llama-3.3-70b-versatile"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cachedEnv: ServerEnv | null = null;

/**
 * Validates required server-side environment variables using Zod.
 * Fails with a clear message naming what is missing without revealing secret values.
 */
export function validateServerEnv(): ServerEnv {
  if (cachedEnv) return cachedEnv;

  const result = serverEnvSchema.safeParse({
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    GROQ_MODEL: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
  });

  if (!result.success) {
    const missing = result.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Required server environment variable missing: ${missing}`);
  }

  cachedEnv = result.data;
  return cachedEnv;
}
