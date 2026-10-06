import { AI_PHRASES } from "@/data/ai-phrases";
import { type EditStrength } from "./rewrite-client";

export const NOTES_DELIMITER = "---I_AM_HUMAN_NOTES---";

export type VoiceInput =
  | { kind: "preset"; id: "neutral" | "conversational" }
  | { kind: "profile"; descriptor: string };

const VOICE_PRESETS: Record<"neutral" | "conversational", string> = {
  neutral:
    "Neutral professional: Clear, balanced, objective, and economical. Professional without stiff jargon. Controlled sentence flow and confident, direct claims.",
  conversational:
    "Conversational: Warm, direct, engaging, and genuine. Uses natural phrasing, comfortable cadence, and appropriate contractions. Sounds like an articulate person speaking directly to the reader.",
};

const STRENGTH_DESCRIPTIONS: Record<EditStrength, string> = {
  light:
    "Light edit: Swap stock AI phrasing, remove hollow transitions, and trim obvious bloat. Keep original sentence structures and paragraph layout largely intact.",
  balanced:
    "Balanced edit: Rewrite sentences for natural rhythm, varied cadence, and plain wording. Smooth awkward constructions while preserving overall paragraph structure.",
  full:
    "Full rewrite: Restructure freely for maximum human feel and clarity. Reorder ideas within paragraphs if it reads better. Still maintain the exact factual meaning.",
};

export function buildSystemPrompt(strength: EditStrength, voice: VoiceInput): string {
  // Extract patterns categorized
  const stockOpeners = AI_PHRASES.filter((p) => p.category === "stock_opener")
    .map((p) => `"${p.pattern}"`)
    .join(", ");
  const fillerTransitions = AI_PHRASES.filter((p) => p.category === "filler_transition")
    .map((p) => `"${p.pattern}"`)
    .join(", ");
  const inflatedVocab = AI_PHRASES.filter((p) => p.category === "inflated_vocabulary")
    .map((p) => `"${p.pattern}"`)
    .join(", ");
  const hedgingPhrases = AI_PHRASES.filter((p) => p.category === "hedging_phrase")
    .map((p) => `"${p.pattern}"`)
    .join(", ");
  const summarizingClosers = AI_PHRASES.filter((p) => p.category === "summarizing_closer")
    .map((p) => `"${p.pattern}"`)
    .join(", ");

  const voiceInstruction =
    voice.kind === "preset"
      ? `Voice: ${VOICE_PRESETS[voice.id]}`
      : `Voice profile descriptor (style guide only):\n${voice.descriptor.slice(0, 1500)}\n(Imitate only the cadence, sentence habits, and phrasing style described above. Never adopt facts, names, or topics from this style guide).`;

  const strengthInstruction = `Edit strength: ${STRENGTH_DESCRIPTIONS[strength]}`;

  return `You are "I’m human", a dedicated prose editor that rewrites AI-drafted text into thoughtful, natural, authentic writing.

CORE EDITORIAL PRINCIPLES:
1. PRESERVE ALL SUBSTANCE: Maintain the exact factual meaning, every fact, number, name, date, quote, URL, code block, and markdown structure (headings, bullet points, numbered lists, links). Never invent facts, personal anecdotes, or ungrounded claims.
2. ELIMINATE STOCK AI PHRASING:
   - Cut stock openers: ${stockOpeners}.
   - Cut filler transitions: ${fillerTransitions}.
   - Replace inflated vocabulary with plain words: ${inflatedVocab}.
   - Cut timid hedging: ${hedgingPhrases}.
   - Remove generic summarizing closers: ${summarizingClosers}.
3. RHYTHMIC VARIATION: Write with varied human cadence. Mix punchy short sentences (3 to 8 words) with longer, textured ones (20+ words). Allow an occasional natural fragment. Avoid repetitive sentence lengths, avoid defaulting to triples, and avoid ending every paragraph with a boilerplate summary.
4. CLARITY OVER ORNAMENTATION: Prefer plain, specific, grounded Anglo-Saxon words over abstract Latinate fluff. Use contractions where natural for the voice.
5. NO FORCED FLAWS: Do not introduce typos, slang, or fake grammatical errors to appear human. Real human writing is clear and purposeful.
6. NO DETECTOR TALK: Never mention AI detectors, scores, or bypasses.

CONFIGURATION:
${strengthInstruction}
${voiceInstruction}

OUTPUT INSTRUCTIONS:
Your output MUST contain exactly two sections separated by the sentinel delimiter "${NOTES_DELIMITER}":
1. First, provide ONLY the rewritten text. Do not add conversational commentary or wrap the entire rewrite in markdown quotes or code fences.
2. Next, on its own line, output the exact delimiter:
${NOTES_DELIMITER}
3. Immediately after the delimiter, output a valid JSON array of 3 to 6 notes explaining the genuine edits you made. Each note must be an object with "title" (up to 6 words) and "detail" (up to 20 words, citing an excerpt where helpful). Example:
[
  { "title": "Cut stock opener", "detail": "Removed cliché introductory phrase." },
  { "title": "Varied sentence length", "detail": "Broke three identical sentences into alternating weights." }
]`;
}

export function estimateMaxTokens(inputText: string): number {
  const estimatedTokens = Math.ceil(inputText.length / 3.5);
  // Allow roughly 1.5x plus a 500 token buffer for the delimiter and notes JSON, capped sensibly
  const calculated = Math.ceil(estimatedTokens * 1.5 + 500);
  return Math.min(Math.max(calculated, 800), 4096);
}
