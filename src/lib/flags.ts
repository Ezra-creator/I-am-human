import { AI_PHRASES, type AIPhraseCategory, type AIPhrase } from "@/data/ai-phrases";

export interface FlagRange {
  start: number;
  end: number;
  id: string;
  category: AIPhraseCategory;
  categoryLabel: string;
  text: string;
}

export const CATEGORY_LABELS: Record<AIPhraseCategory, string> = {
  stock_opener: "Stock opener",
  filler_transition: "Filler transition",
  inflated_vocabulary: "Inflated vocabulary",
  hedging_phrase: "Hedging phrase",
  summarizing_closer: "Summarizing closer",
};

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Finds AI cliché patterns in the text, returning non-overlapping ranges
 * sorted chronologically by start index, preferring the longest match.
 */
export function findFlags(text: string): FlagRange[] {
  if (!text.trim()) return [];

  // Sort candidate phrases by pattern length descending to favor longer matches
  const sortedPhrases = [...AI_PHRASES].sort(
    (a, b) => b.pattern.length - a.pattern.length
  );

  interface RawMatch {
    start: number;
    end: number;
    phrase: AIPhrase;
    matchedText: string;
  }

  const matches: RawMatch[] = [];

  for (const phrase of sortedPhrases) {
    const escaped = escapeRegex(phrase.pattern);
    // Boundary check: word boundary on ascii word characters, punctuation boundary on non-words
    const regex = new RegExp(`(?<=^|[\\s.,!?;:()"\`'“”‘’—–-])${escaped}(?=[\\s.,!?;:()"\`'“”‘’—–-]|$|\n)`, "gi");
    let m: RegExpExecArray | null;

    while ((m = regex.exec(text)) !== null) {
      matches.push({
        start: m.index,
        end: m.index + m[0].length,
        phrase,
        matchedText: m[0],
      });
    }
  }

  // Sort matches by length descending, then start ascending
  matches.sort((a, b) => {
    const lenA = a.end - a.start;
    const lenB = b.end - b.start;
    if (lenB !== lenA) return lenB - lenA;
    return a.start - b.start;
  });

  // Greedily pick non-overlapping matches
  const accepted: FlagRange[] = [];
  const occupied = new Uint8Array(text.length);

  for (const match of matches) {
    let overlap = false;
    for (let i = match.start; i < match.end; i++) {
      if (occupied[i]) {
        overlap = true;
        break;
      }
    }

    if (!overlap) {
      for (let i = match.start; i < match.end; i++) {
        occupied[i] = 1;
      }
      accepted.push({
        start: match.start,
        end: match.end,
        id: match.phrase.id,
        category: match.phrase.category,
        categoryLabel: CATEGORY_LABELS[match.phrase.category] || match.phrase.category,
        text: match.matchedText,
      });
    }
  }

  // Sort final accepted flags by start position
  accepted.sort((a, b) => a.start - b.start);
  return accepted;
}

/**
 * Counts the total number of flagged stock phrases in a given text.
 */
export function countFlags(text: string): number {
  return findFlags(text).length;
}
