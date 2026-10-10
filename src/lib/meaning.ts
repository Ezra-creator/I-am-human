export type MeaningItemType =
  | "number"
  | "quote"
  | "url_email"
  | "entity"
  | "code";

export interface MeaningItem {
  type: MeaningItemType;
  value: string;
  raw: string;
}

export interface MeaningDiff {
  missing: MeaningItem[];
  added: MeaningItem[];
  allKept: boolean;
  summaryMessage: string;
}

const sentenceSegmenter = new Intl.Segmenter("en", { granularity: "sentence" });
const wordSegmenter = new Intl.Segmenter("en", { granularity: "word" });

/**
 * Extracts inline code spans: `code`
 */
export function extractCodeSpans(text: string): MeaningItem[] {
  const items: MeaningItem[] = [];
  const regex = /`([^`]+)`/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    const val = m[1].trim();
    if (val) {
      items.push({ type: "code", value: val, raw: m[0] });
    }
  }
  return items;
}

/**
 * Extracts URLs and email addresses
 */
export function extractUrlsAndEmails(text: string): MeaningItem[] {
  const items: MeaningItem[] = [];
  // URLs
  const urlRegex = /\b(?:https?:\/\/[^\s"'<>]+|www\.[^\s"'<>]+)/gi;
  let m: RegExpExecArray | null;
  while ((m = urlRegex.exec(text)) !== null) {
    items.push({ type: "url_email", value: m[0].toLowerCase(), raw: m[0] });
  }

  // Emails
  const emailRegex = /\b[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+\b/g;
  while ((m = emailRegex.exec(text)) !== null) {
    items.push({ type: "url_email", value: m[0].toLowerCase(), raw: m[0] });
  }

  return items;
}

/**
 * Extracts quoted strings ("...", '...', “...”, ‘...’)
 */
export function extractQuotes(text: string): MeaningItem[] {
  const items: MeaningItem[] = [];
  // Double quotes and typographic quotes
  const doubleQuotes = /["“]([^"”\n]+)["”]/g;
  let m: RegExpExecArray | null;
  while ((m = doubleQuotes.exec(text)) !== null) {
    const val = m[1].trim();
    if (val.length > 0) {
      items.push({ type: "quote", value: val.toLowerCase(), raw: m[0] });
    }
  }

  // Single quotes when surrounded by whitespace or punctuation (avoiding contractions like don't)
  const singleQuotes = /(?:^|[\s(])['‘]([^'’\n]+)['’](?=[\s.,!?;:)]|$)/g;
  while ((m = singleQuotes.exec(text)) !== null) {
    const val = m[1].trim();
    if (val.length > 0) {
      items.push({ type: "quote", value: val.toLowerCase(), raw: `'${val}'` });
    }
  }

  return items;
}

/**
 * Extracts numbers: currencies, percentages, dates, times, decimals, integers.
 */
export function extractNumbers(text: string): MeaningItem[] {
  const items: MeaningItem[] = [];
  // Currency
  const currencyRegex = /[$€£¥]\s*\d+(?:,\d{3})*(?:\.\d+)?|\b\d+(?:,\d{3})*(?:\.\d+)?\s*(?:USD|EUR|GBP)\b/gi;
  let m: RegExpExecArray | null;
  while ((m = currencyRegex.exec(text)) !== null) {
    items.push({ type: "number", value: m[0].replace(/\s+/g, "").toLowerCase(), raw: m[0] });
  }

  // Percentage
  const pctRegex = /\b\d+(?:\.\d+)?%/g;
  while ((m = pctRegex.exec(text)) !== null) {
    items.push({ type: "number", value: m[0], raw: m[0] });
  }

  // Times: e.g. 10:30, 4:15 pm
  const timeRegex = /\b\d{1,2}:\d{2}(?::\d{2})?(?:\s*(?:am|pm|AM|PM))?\b/g;
  while ((m = timeRegex.exec(text)) !== null) {
    items.push({ type: "number", value: m[0].toLowerCase(), raw: m[0] });
  }

  // Dates: e.g. 2024, 05/12/2023, Jan 14, 2025
  const dateRegex = /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2}(?:st|nd|rd|th)?,? \d{4}\b|\b\d{1,2}\/\d{1,2}\/\d{2,4}\b|\b(?:19|20)\d{2}\b/g;
  while ((m = dateRegex.exec(text)) !== null) {
    items.push({ type: "number", value: m[0].toLowerCase(), raw: m[0] });
  }

  // General numbers (integers, decimals) not already captured
  const generalNum = /\b\d+(?:,\d{3})*(?:\.\d+)?\b/g;
  while ((m = generalNum.exec(text)) !== null) {
    const rawVal = m[0];
    const normalized = rawVal.replace(/,/g, "");
    items.push({ type: "number", value: normalized, raw: rawVal });
  }

  return items;
}

/**
 * Extracts capitalized entities that are NOT at sentence start.
 * Simple, documented heuristic: proper nouns mid-sentence (e.g. "Paris", "John Doe").
 */
export function extractEntities(text: string): MeaningItem[] {
  const items: MeaningItem[] = [];
  const sentences = Array.from(sentenceSegmenter.segment(text))
    .map((s) => s.segment.trim())
    .filter(Boolean);

  for (const sentence of sentences) {
    const words = Array.from(wordSegmenter.segment(sentence)).filter((w) => w.isWordLike);
    if (words.length <= 1) continue;

    // Skip the first word as it is capitalized simply because it starts the sentence
    for (let i = 1; i < words.length; i++) {
      const seg = words[i].segment;
      // Match capitalized word: starts with capital followed by lowercase letters
      if (/^[A-Z][a-z]+$/.test(seg)) {
        // Lookahead to see if next word is also capitalized (multi-word entity like "New York")
        let multi = seg;
        let j = i + 1;
        while (j < words.length && /^[A-Z][a-z]+$/.test(words[j].segment)) {
          multi += " " + words[j].segment;
          i = j;
          j++;
        }
        items.push({
          type: "entity",
          value: multi.toLowerCase(),
          raw: multi,
        });
      }
    }
  }

  return items;
}

/**
 * Extracts all meaning items from a text.
 */
export function extractAllMeaningItems(text: string): MeaningItem[] {
  return [
    ...extractCodeSpans(text),
    ...extractUrlsAndEmails(text),
    ...extractQuotes(text),
    ...extractNumbers(text),
    ...extractEntities(text),
  ];
}

/**
 * Compares two texts as multisets of meaning elements.
 * Produces { missing: Item[], added: Item[], allKept: boolean, summaryMessage: string }.
 */
export function compareMeaning(original: string, rewrite: string): MeaningDiff {
  const originalItems = extractAllMeaningItems(original);
  const rewriteItems = extractAllMeaningItems(rewrite);

  // Build multiset counts
  const origCount = new Map<string, { count: number; item: MeaningItem }>();
  for (const item of originalItems) {
    const key = `${item.type}:${item.value}`;
    const curr = origCount.get(key);
    if (curr) {
      curr.count++;
    } else {
      origCount.set(key, { count: 1, item });
    }
  }

  const rewCount = new Map<string, { count: number; item: MeaningItem }>();
  for (const item of rewriteItems) {
    const key = `${item.type}:${item.value}`;
    const curr = rewCount.get(key);
    if (curr) {
      curr.count++;
    } else {
      rewCount.set(key, { count: 1, item });
    }
  }

  const missing: MeaningItem[] = [];
  origCount.forEach(({ count, item }, key) => {
    const inRew = rewCount.get(key)?.count || 0;
    if (count > inRew) {
      for (let i = 0; i < count - inRew; i++) {
        missing.push(item);
      }
    }
  });

  const added: MeaningItem[] = [];
  rewCount.forEach(({ count, item }, key) => {
    const inOrig = origCount.get(key)?.count || 0;
    if (count > inOrig) {
      for (let i = 0; i < count - inOrig; i++) {
        added.push(item);
      }
    }
  });

  const allKept = missing.length === 0 && added.length === 0;

  const summaryMessage = allKept
    ? "Numbers, names and quotes all kept."
    : `Check these: ${missing.length > 0 ? `'${missing[0].raw}' is in the original but not in the rewrite.` : `'${added[0].raw}' is newly in the rewrite.`}`;

  return {
    missing,
    added,
    allKept,
    summaryMessage,
  };
}
