import { AI_PHRASES } from "@/data/ai-phrases";
import {
  type VoiceMetrics,
  type SentenceLengthHistogram,
  type PunctuationHabits,
  type RhythmCategory,
  type ContractionFrequency,
} from "./types";

const STOPWORDS = new Set([
  "the", "a", "an", "in", "on", "at", "to", "and", "but", "or", "of",
  "for", "with", "as", "by", "this", "that", "it", "is", "are", "was",
  "were", "be", "been", "have", "has", "had", "do", "does", "did",
]);

const CONNECTORS = [
  "however", "therefore", "although", "though", "furthermore", "moreover",
  "meanwhile", "instead", "yet", "still", "besides", "otherwise", "consequently",
  "nevertheless", "nonetheless", "afterwards", "finally", "specifically",
  "similarly", "conversely", "because", "since", "unless", "while", "whereas",
];

const FIRST_PERSON_PRONOUNS = new Set([
  "i", "me", "my", "mine", "myself", "we", "us", "our", "ours", "ourselves",
]);

const SECOND_PERSON_PRONOUNS = new Set([
  "you", "your", "yours", "yourself", "yourselves",
]);

// Contraction regex matching standard English forms with straight or typographic apostrophes
const CONTRACTION_REGEX = /\b[a-zA-Z]+['’](?:t|re|ve|m|ll|d|s)\b/g;

export function extractMetrics(sampleTexts: string[]): VoiceMetrics {
  const combined = sampleTexts.join("\n\n").trim();
  if (!combined) {
    return createEmptyMetrics();
  }

  // 1. Sentence segmentation via Intl.Segmenter
  const sentenceSegmenter = new Intl.Segmenter("en", { granularity: "sentence" });
  const wordSegmenter = new Intl.Segmenter("en", { granularity: "word" });

  const rawSentenceSegments = [...sentenceSegmenter.segment(combined)].map((s) => s.segment.trim());
  const sentenceWordCounts: number[] = [];
  const sentenceOpeners: string[] = [];

  for (const s of rawSentenceSegments) {
    if (!s) continue;
    const wordsInSentence: string[] = [];
    for (const w of wordSegmenter.segment(s)) {
      if (w.isWordLike) {
        wordsInSentence.push(w.segment.toLowerCase());
      }
    }
    if (wordsInSentence.length > 0) {
      sentenceWordCounts.push(wordsInSentence.length);
      sentenceOpeners.push(wordsInSentence[0]);
    }
  }

  const totalSentences = sentenceWordCounts.length;
  if (totalSentences === 0) {
    return createEmptyMetrics();
  }

  // 2. All words across text
  const allWords: string[] = [];
  let totalWordChars = 0;
  for (const w of wordSegmenter.segment(combined)) {
    if (w.isWordLike) {
      const lower = w.segment.toLowerCase();
      allWords.push(lower);
      totalWordChars += w.segment.length;
    }
  }

  const totalWords = allWords.length;

  // 3. Sentence length statistics
  const sumLengths = sentenceWordCounts.reduce((acc, val) => acc + val, 0);
  const meanSentenceLength = Number((sumLengths / totalSentences).toFixed(1));

  const sortedLengths = [...sentenceWordCounts].sort((a, b) => a - b);
  const mid = Math.floor(sortedLengths.length / 2);
  const medianSentenceLength =
    sortedLengths.length % 2 !== 0
      ? sortedLengths[mid]
      : Number(((sortedLengths[mid - 1] + sortedLengths[mid]) / 2).toFixed(1));

  const shortestSentenceLength = sortedLengths[0];
  const longestSentenceLength = sortedLengths[sortedLengths.length - 1];

  const variance =
    sentenceWordCounts.reduce((acc, len) => acc + Math.pow(len - meanSentenceLength, 2), 0) /
    totalSentences;
  const stdDevSentenceLength = Number(Math.sqrt(variance).toFixed(1));

  // Histogram in 6 buckets
  const histogram: SentenceLengthHistogram = {
    "1-5": 0,
    "6-10": 0,
    "11-15": 0,
    "16-20": 0,
    "21-30": 0,
    "31+": 0,
  };
  for (const len of sentenceWordCounts) {
    if (len <= 5) histogram["1-5"]++;
    else if (len <= 10) histogram["6-10"]++;
    else if (len <= 15) histogram["11-15"]++;
    else if (len <= 20) histogram["16-20"]++;
    else if (len <= 30) histogram["21-30"]++;
    else histogram["31+"]++;
  }

  // 4. Rhythm variation
  const coefficientOfVariation =
    meanSentenceLength > 0 ? Number((stdDevSentenceLength / meanSentenceLength).toFixed(2)) : 0;
  let rhythmCategory: RhythmCategory = "Varied";
  if (coefficientOfVariation < 0.35) {
    rhythmCategory = "Even";
  } else if (coefficientOfVariation >= 0.65) {
    rhythmCategory = "Very varied";
  }

  const shortSentenceCount = sentenceWordCounts.filter((len) => len < 8).length;
  const longSentenceCount = sentenceWordCounts.filter((len) => len > 25).length;
  const shortSentenceRatio = Number((shortSentenceCount / totalSentences).toFixed(2));
  const longSentenceRatio = Number((longSentenceCount / totalSentences).toFixed(2));

  // 5. Word metrics & Lexical variety (Type-Token Ratio on 100-word sliding window)
  const avgWordLength = totalWords > 0 ? Number((totalWordChars / totalWords).toFixed(1)) : 0;
  let lexicalVariety = 0;
  if (totalWords <= 100) {
    const unique = new Set(allWords).size;
    lexicalVariety = totalWords > 0 ? Number((unique / totalWords).toFixed(2)) : 0;
  } else {
    const windowSize = 100;
    let ttrSum = 0;
    const windowCount = totalWords - windowSize + 1;
    for (let i = 0; i < windowCount; i += 10) {
      const windowSlice = allWords.slice(i, i + windowSize);
      const unique = new Set(windowSlice).size;
      ttrSum += unique / windowSize;
    }
    const sampleWindows = Math.ceil(windowCount / 10);
    lexicalVariety = Number((ttrSum / sampleWindows).toFixed(2));
  }

  // 6. Paragraph metrics
  const rawParagraphs = combined.split(/\r?\n\s*\r?\n+/).map((p) => p.trim()).filter(Boolean);
  const totalParagraphs = Math.max(1, rawParagraphs.length);
  const meanSentencesPerParagraph = Number((totalSentences / totalParagraphs).toFixed(1));

  // 7. Punctuation habits per 100 sentences
  const punctuationScale = 100 / totalSentences;
  const commas = (combined.match(/,/g) || []).length;
  const semicolons = (combined.match(/;/g) || []).length;
  const emDashes = (combined.match(/(?:—|--)/g) || []).length;
  const colons = (combined.match(/:/g) || []).length;
  const parentheses = (combined.match(/\(/g) || []).length;
  const questionMarks = (combined.match(/\?/g) || []).length;
  const exclamationMarks = (combined.match(/!/g) || []).length;

  const punctuation: PunctuationHabits = {
    commas: Math.round(commas * punctuationScale),
    semicolons: Math.round(semicolons * punctuationScale),
    emDashes: Math.round(emDashes * punctuationScale),
    colons: Math.round(colons * punctuationScale),
    parentheses: Math.round(parentheses * punctuationScale),
    questionMarks: Math.round(questionMarks * punctuationScale),
    exclamationMarks: Math.round(exclamationMarks * punctuationScale),
  };

  // 8. Contractions and Pronouns (per 100 words)
  const contractionMatches = (combined.match(CONTRACTION_REGEX) || []).length;
  const wordScale = totalWords > 0 ? 100 / totalWords : 0;
  const contractionRate = Number((contractionMatches * wordScale).toFixed(1));

  let contractionUse: ContractionFrequency = "Sometimes";
  if (contractionRate < 0.8) {
    contractionUse = "Rare";
  } else if (contractionRate >= 2.5) {
    contractionUse = "Often";
  }

  const firstPersonCount = allWords.filter((w) => FIRST_PERSON_PRONOUNS.has(w)).length;
  const secondPersonCount = allWords.filter((w) => SECOND_PERSON_PRONOUNS.has(w)).length;
  const firstPersonRate = Number((firstPersonCount * wordScale).toFixed(1));
  const secondPersonRate = Number((secondPersonCount * wordScale).toFixed(1));

  // 9. Top 8 Openers (filtering stopword noise where possible)
  const openerCounts = new Map<string, number>();
  for (const opener of sentenceOpeners) {
    if (!STOPWORDS.has(opener)) {
      openerCounts.set(opener, (openerCounts.get(opener) || 0) + 1);
    }
  }
  // Fall back to all openers if writer exclusively starts sentences with stopwords
  if (openerCounts.size === 0) {
    for (const opener of sentenceOpeners) {
      openerCounts.set(opener, (openerCounts.get(opener) || 0) + 1);
    }
  }
  const topOpeners = [...openerCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([word, count]) => ({ word, count }));

  // 10. Top recurring connectors
  const lowerCombined = combined.toLowerCase();
  const connectorCounts: { word: string; count: number }[] = [];
  for (const conn of CONNECTORS) {
    const reg = new RegExp(`\\b${conn}\\b`, "g");
    const count = (lowerCombined.match(reg) || []).length;
    if (count > 0) {
      connectorCounts.push({ word: conn, count });
    }
  }
  const topConnectors = connectorCounts
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // 11. Clichés avoided
  let avoidedPhrasesCount = 0;
  for (const phrase of AI_PHRASES) {
    const reg = new RegExp(`\\b${escapeRegExp(phrase.pattern)}\\b`, "i");
    if (!reg.test(combined)) {
      avoidedPhrasesCount++;
    }
  }

  return {
    totalWords,
    totalSentences,
    totalParagraphs,
    meanSentenceLength,
    medianSentenceLength,
    stdDevSentenceLength,
    shortestSentenceLength,
    longestSentenceLength,
    histogram,
    coefficientOfVariation,
    rhythmCategory,
    shortSentenceRatio,
    longSentenceRatio,
    avgWordLength,
    lexicalVariety,
    meanSentencesPerParagraph,
    punctuation,
    contractionRate,
    contractionUse,
    firstPersonRate,
    secondPersonRate,
    topOpeners,
    topConnectors,
    avoidedPhrasesCount,
  };
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function createEmptyMetrics(): VoiceMetrics {
  return {
    totalWords: 0,
    totalSentences: 0,
    totalParagraphs: 0,
    meanSentenceLength: 0,
    medianSentenceLength: 0,
    stdDevSentenceLength: 0,
    shortestSentenceLength: 0,
    longestSentenceLength: 0,
    histogram: { "1-5": 0, "6-10": 0, "11-15": 0, "16-20": 0, "21-30": 0, "31+": 0 },
    coefficientOfVariation: 0,
    rhythmCategory: "Even",
    shortSentenceRatio: 0,
    longSentenceRatio: 0,
    avgWordLength: 0,
    lexicalVariety: 0,
    meanSentencesPerParagraph: 0,
    punctuation: {
      commas: 0,
      semicolons: 0,
      emDashes: 0,
      colons: 0,
      parentheses: 0,
      questionMarks: 0,
      exclamationMarks: 0,
    },
    contractionRate: 0,
    contractionUse: "Rare",
    firstPersonRate: 0,
    secondPersonRate: 0,
    topOpeners: [],
    topConnectors: [],
    avoidedPhrasesCount: AI_PHRASES.length,
  };
}
