export interface RhythmRowData {
  lengths: number[];
  mean: number;
  stdDev: number;
  cv: number; // coefficient of variation
  isGrouped: boolean;
  textAlternative: string;
}

export interface ComparisonRhythm {
  before: RhythmRowData;
  after: RhythmRowData;
  sharedMax: number;
  summaryText: string;
}

const sentenceSegmenter = new Intl.Segmenter("en", { granularity: "sentence" });
const wordSegmenter = new Intl.Segmenter("en", { granularity: "word" });

export function extractSentenceWordLengths(text: string): number[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const sentences = Array.from(sentenceSegmenter.segment(trimmed))
    .map((s) => s.segment.trim())
    .filter((s) => s.length > 0);

  const lengths: number[] = [];

  for (const sentence of sentences) {
    let words = 0;
    for (const w of wordSegmenter.segment(sentence)) {
      if (w.isWordLike) {
        words++;
      }
    }
    lengths.push(Math.max(1, words));
  }

  return lengths;
}

export function computeCv(lengths: number[]): { mean: number; stdDev: number; cv: number } {
  if (lengths.length === 0) {
    return { mean: 0, stdDev: 0, cv: 0 };
  }
  const sum = lengths.reduce((acc, val) => acc + val, 0);
  const mean = sum / lengths.length;

  if (lengths.length === 1) {
    return { mean: Math.round(mean * 10) / 10, stdDev: 0, cv: 0 };
  }

  const squaredDiffs = lengths.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0);
  const stdDev = Math.sqrt(squaredDiffs / lengths.length);
  const cv = mean > 0 ? stdDev / mean : 0;

  return {
    mean: Math.round(mean * 10) / 10,
    stdDev: Math.round(stdDev * 100) / 100,
    cv: Math.round(cv * 100) / 100,
  };
}

export function bucketSentenceLengths(
  lengths: number[],
  maxBars = 40
): { bars: number[]; isGrouped: boolean } {
  if (lengths.length <= maxBars) {
    return { bars: lengths, isGrouped: false };
  }

  const bars: number[] = [];
  const bucketSize = lengths.length / maxBars;

  for (let i = 0; i < maxBars; i++) {
    const startIdx = Math.floor(i * bucketSize);
    const endIdx = Math.min(lengths.length, Math.floor((i + 1) * bucketSize));
    const slice = lengths.slice(startIdx, Math.max(startIdx + 1, endIdx));
    const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
    bars.push(Math.round(avg));
  }

  return { bars, isGrouped: true };
}

export function computeRhythmRow(
  text: string,
  label: "Before" | "After",
  maxBars = 40
): RhythmRowData {
  const rawLengths = extractSentenceWordLengths(text);
  const stats = computeCv(rawLengths);
  const { bars, isGrouped } = bucketSentenceLengths(rawLengths, maxBars);

  const textAlternative =
    bars.length > 0
      ? `${label}: ${bars.join(", ")} words${isGrouped ? " (grouped into 40 buckets)" : ""}`
      : `${label}: No sentences`;

  return {
    lengths: bars,
    mean: stats.mean,
    stdDev: stats.stdDev,
    cv: stats.cv,
    isGrouped,
    textAlternative,
  };
}

export function computeComparisonRhythm(
  originalText: string,
  rewriteText: string
): ComparisonRhythm {
  const before = computeRhythmRow(originalText, "Before");
  const after = computeRhythmRow(rewriteText, "After");

  const sharedMax = Math.max(1, ...before.lengths, ...after.lengths);

  const summaryText = `Variation went from ${before.cv.toFixed(2)} to ${after.cv.toFixed(2)}.`;

  return {
    before,
    after,
    sharedMax,
    summaryText,
  };
}
