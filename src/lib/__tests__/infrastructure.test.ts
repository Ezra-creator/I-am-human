import { describe, it, expect } from "vitest";
import { checkRateLimit, RATE_LIMIT_MINUTE } from "../rate-limit";
import { buildSystemPrompt, estimateMaxTokens, NOTES_DELIMITER } from "../prompts";

describe("Rate limiter (src/lib/rate-limit.ts)", () => {
  it("permits initial requests within limit", () => {
    const testIp = `test-ip-${Date.now()}`;
    const res = checkRateLimit(testIp);
    expect(res.success).toBe(true);
    expect(res.remainingMinute).toBe(RATE_LIMIT_MINUTE - 1);
  });

  it("blocks requests once per-minute limit is exceeded", () => {
    const testIp = `test-flood-${Date.now()}`;
    for (let i = 0; i < RATE_LIMIT_MINUTE; i++) {
      checkRateLimit(testIp);
    }
    const blocked = checkRateLimit(testIp);
    expect(blocked.success).toBe(false);
    expect(blocked.remainingMinute).toBe(0);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });
});

describe("Prompt builder (src/lib/prompts.ts)", () => {
  it("builds structured system prompt for preset neutral voice", () => {
    const prompt = buildSystemPrompt("balanced", { kind: "preset", id: "neutral" });
    expect(typeof prompt).toBe("string");
    expect(prompt).toContain(NOTES_DELIMITER);
    expect(prompt).toContain("Neutral professional");
  });

  it("builds structured system prompt for conversational preset", () => {
    const prompt = buildSystemPrompt("full", { kind: "preset", id: "conversational" });
    expect(prompt).toContain("Conversational:");
    expect(prompt).toContain(NOTES_DELIMITER);
  });

  it("builds structured system prompt incorporating custom voice descriptor", () => {
    const descriptor = "Sentence length averages 14 words with varied cadence.";
    const prompt = buildSystemPrompt("light", { kind: "profile", descriptor });
    expect(prompt).toContain(descriptor);
    expect(prompt).toContain("Voice profile descriptor");
  });

  it("estimates sensible token allocations", () => {
    const tokens = estimateMaxTokens("Short sentence here.");
    expect(tokens).toBeGreaterThan(100);
    expect(tokens).toBeLessThan(4000);
  });
});

describe("Sentinel stream parser contract", () => {
  it("validates notes delimiter presence and extraction", () => {
    const streamOutput = `Here is the rewritten text.${NOTES_DELIMITER}[{"title":"Tone adjustment","detail":"Removed stock transition phrase."}]`;
    const parts = streamOutput.split(NOTES_DELIMITER);
    expect(parts.length).toBe(2);
    expect(parts[0].trim()).toBe("Here is the rewritten text.");

    const parsedNotes = JSON.parse(parts[1]);
    expect(parsedNotes).toHaveLength(1);
    expect(parsedNotes[0].title).toBe("Tone adjustment");
  });
});
