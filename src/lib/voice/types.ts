export interface Sample {
  id: string;
  text: string;
  addedAt: number;
}

export interface SentenceLengthHistogram {
  "1-5": number;
  "6-10": number;
  "11-15": number;
  "16-20": number;
  "21-30": number;
  "31+": number;
}

export type RhythmCategory = "Even" | "Varied" | "Very varied";
export type ContractionFrequency = "Rare" | "Sometimes" | "Often";

export interface PunctuationHabits {
  commas: number; // per 100 sentences
  semicolons: number;
  emDashes: number;
  colons: number;
  parentheses: number;
  questionMarks: number;
  exclamationMarks: number;
}

export interface VoiceMetrics {
  totalWords: number;
  totalSentences: number;
  totalParagraphs: number;

  // Sentence length
  meanSentenceLength: number;
  medianSentenceLength: number;
  stdDevSentenceLength: number;
  shortestSentenceLength: number;
  longestSentenceLength: number;
  histogram: SentenceLengthHistogram;

  // Rhythm
  coefficientOfVariation: number;
  rhythmCategory: RhythmCategory;
  shortSentenceRatio: number; // < 8 words
  longSentenceRatio: number; // > 25 words

  // Word metrics
  avgWordLength: number; // characters
  lexicalVariety: number; // Type-Token Ratio on 100-word window (0-1)

  // Paragraph metrics
  meanSentencesPerParagraph: number;

  // Punctuation per 100 sentences
  punctuation: PunctuationHabits;

  // Voice characteristics
  contractionRate: number; // per 100 words
  contractionUse: ContractionFrequency;
  firstPersonRate: number; // per 100 words
  secondPersonRate: number; // per 100 words

  // Openers and connectors
  topOpeners: { word: string; count: number }[];
  topConnectors: { word: string; count: number }[];

  // Clichés avoided
  avoidedPhrasesCount: number;
}

export interface VoiceProfile {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  samples: Sample[];
  metrics: VoiceMetrics;
  descriptor: string;
}
