export type AIPhraseCategory =
  | "stock_opener"
  | "filler_transition"
  | "inflated_vocabulary"
  | "hedging_phrase"
  | "summarizing_closer";

export interface AIPhrase {
  id: string;
  category: AIPhraseCategory;
  pattern: string;
  suggestion?: string;
}

export const AI_PHRASES: readonly AIPhrase[] = [
  // Stock Openers
  { id: "op-1", category: "stock_opener", pattern: "In today's fast-paced digital landscape" },
  { id: "op-2", category: "stock_opener", pattern: "In today's fast-paced world" },
  { id: "op-3", category: "stock_opener", pattern: "In today's world" },
  { id: "op-4", category: "stock_opener", pattern: "It is important to note that" },
  { id: "op-5", category: "stock_opener", pattern: "It is worth noting that" },
  { id: "op-6", category: "stock_opener", pattern: "When it comes to" },
  { id: "op-7", category: "stock_opener", pattern: "In the realm of" },
  { id: "op-8", category: "stock_opener", pattern: "Ever since the dawn of" },

  // Filler Transitions
  { id: "tr-1", category: "filler_transition", pattern: "Moreover" },
  { id: "tr-2", category: "filler_transition", pattern: "Furthermore" },
  { id: "tr-3", category: "filler_transition", pattern: "Additionally" },
  { id: "tr-4", category: "filler_transition", pattern: "In addition to this" },
  { id: "tr-5", category: "filler_transition", pattern: "Not only that, but" },
  { id: "tr-6", category: "filler_transition", pattern: "On the other hand" },
  { id: "tr-7", category: "filler_transition", pattern: "With that being said" },

  // Inflated Vocabulary
  { id: "voc-1", category: "inflated_vocabulary", pattern: "delve" },
  { id: "voc-2", category: "inflated_vocabulary", pattern: "tapestry" },
  { id: "voc-3", category: "inflated_vocabulary", pattern: "testament" },
  { id: "voc-4", category: "inflated_vocabulary", pattern: "landscape" },
  { id: "voc-5", category: "inflated_vocabulary", pattern: "seamless" },
  { id: "voc-6", category: "inflated_vocabulary", pattern: "robust" },
  { id: "voc-7", category: "inflated_vocabulary", pattern: "leverage" },
  { id: "voc-8", category: "inflated_vocabulary", pattern: "foster" },
  { id: "voc-9", category: "inflated_vocabulary", pattern: "beacon" },
  { id: "voc-10", category: "inflated_vocabulary", pattern: "cornerstone" },
  { id: "voc-11", category: "inflated_vocabulary", pattern: "game-changer" },
  { id: "voc-12", category: "inflated_vocabulary", pattern: "pivotal" },
  { id: "voc-13", category: "inflated_vocabulary", pattern: "transformative" },
  { id: "voc-14", category: "inflated_vocabulary", pattern: "paramount" },

  // Hedging Phrases
  { id: "hdg-1", category: "hedging_phrase", pattern: "It could be argued that" },
  { id: "hdg-2", category: "hedging_phrase", pattern: "It goes without saying that" },
  { id: "hdg-3", category: "hedging_phrase", pattern: "Needless to say" },
  { id: "hdg-4", category: "hedging_phrase", pattern: "In many ways" },
  { id: "hdg-5", category: "hedging_phrase", pattern: "To some extent" },
  { id: "hdg-6", category: "hedging_phrase", pattern: "Arguably" },

  // Summarizing Closers
  { id: "cls-1", category: "summarizing_closer", pattern: "In conclusion" },
  { id: "cls-2", category: "summarizing_closer", pattern: "Ultimately" },
  { id: "cls-3", category: "summarizing_closer", pattern: "All in all" },
  { id: "cls-4", category: "summarizing_closer", pattern: "To sum up" },
  { id: "cls-5", category: "summarizing_closer", pattern: "In summary" },
  { id: "cls-6", category: "summarizing_closer", pattern: "At the end of the day" },
  { id: "cls-7", category: "summarizing_closer", pattern: "Looking ahead" },
] as const;
