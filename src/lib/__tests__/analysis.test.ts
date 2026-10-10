import { describe, it, expect } from "vitest";
import { computeDiff } from "../diff";
import { findFlags, countFlags } from "../flags";
import {
  extractSentenceWordLengths,
  computeCv,
  bucketSentenceLengths,
  computeComparisonRhythm,
} from "../rhythm";
import {
  extractNumbers,
  extractQuotes,
  extractUrlsAndEmails,
  extractCodeSpans,
  extractEntities,
  compareMeaning,
} from "../meaning";

describe("Tracked changes diff (src/lib/diff.ts)", () => {
  it("handles identical texts by returning a single unchanged chunk", () => {
    const res = computeDiff("Same text here.", "Same text here.");
    expect(res).toEqual([{ type: "unchanged", value: "Same text here." }]);
  });

  it("handles additions and deletions", () => {
    const res = computeDiff("The fast dog.", "The lazy dog.");
    expect(res.some((p) => p.type === "removed" && p.value.includes("fast"))).toBe(true);
    expect(res.some((p) => p.type === "added" && p.value.includes("lazy"))).toBe(true);
  });

  it("preserves markdown and code syntax without corruption", () => {
    const original = "Use `console.log('hi')` and **bold** text.";
    const rewrite = "Use `console.log('hi')` and *italic* text.";
    const res = computeDiff(original, rewrite);
    expect(res.some((p) => p.value.includes("console.log('hi')"))).toBe(true);
  });

  it("handles empty strings cleanly", () => {
    expect(computeDiff("", "")).toEqual([]);
    expect(computeDiff("hello", "")).toEqual([{ type: "removed", value: "hello" }]);
    expect(computeDiff("", "world")).toEqual([{ type: "added", value: "world" }]);
  });
});

describe("AI pattern flagging (src/lib/flags.ts)", () => {
  it("detects stock openers and filler transitions", () => {
    const text = "In today's fast-paced world, moreover, we must adapt.";
    const flags = findFlags(text);
    expect(flags.length).toBeGreaterThanOrEqual(2);
    expect(flags.some((f) => f.category === "stock_opener")).toBe(true);
    expect(flags.some((f) => f.category === "filler_transition")).toBe(true);
  });

  it("prefers longest match and guarantees non-overlapping ranges", () => {
    // "In today's fast-paced world" should be preferred over "In today's world"
    const text = "In today's fast-paced world we find success.";
    const flags = findFlags(text);
    expect(flags.length).toBe(1);
    expect(flags[0].text).toBe("In today's fast-paced world");
  });

  it("matches case-insensitively", () => {
    const text = "DELVE into the TAPESTRY of ideas.";
    const flags = findFlags(text);
    expect(flags.length).toBe(2);
    expect(flags[0].category).toBe("inflated_vocabulary");
  });

  it("returns empty array for natural text with no AI phrases", () => {
    const text = "We shipped the release on Tuesday after fixing two broken links.";
    expect(findFlags(text)).toEqual([]);
    expect(countFlags(text)).toBe(0);
  });
});

describe("Sentence rhythm chart (src/lib/rhythm.ts)", () => {
  it("extracts word counts per sentence", () => {
    const text = "Short one. This is a longer sentence with seven words.";
    const lengths = extractSentenceWordLengths(text);
    expect(lengths).toEqual([2, 8]);
  });

  it("computes coefficient of variation correctly", () => {
    const stats = computeCv([10, 10, 10]);
    expect(stats.cv).toBe(0);
    expect(stats.mean).toBe(10);

    const varied = computeCv([2, 20]);
    expect(varied.cv).toBeGreaterThan(0.5);
  });

  it("buckets to 40 bars when there are more than 40 sentences", () => {
    const lengths = Array.from({ length: 80 }, (_, i) => (i % 2 === 0 ? 5 : 25));
    const { bars, isGrouped } = bucketSentenceLengths(lengths, 40);
    expect(bars.length).toBe(40);
    expect(isGrouped).toBe(true);
  });

  it("computes comparative rhythm with shared max and summary sentence", () => {
    const before = "First short. Second longer sentence here today.";
    const after = "Quick rewrite here. Another balanced phrase is now ready for use.";
    const comp = computeComparisonRhythm(before, after);
    expect(comp.sharedMax).toBeGreaterThan(0);
    expect(comp.summaryText).toMatch(/Variation went from/);
  });
});

describe("Meaning check (src/lib/meaning.ts)", () => {
  it("extracts numbers (currencies, percentages, dates, integers)", () => {
    const text = "Revenue grew 14% to $2,500,000 in 2024 at 10:30 am with 42 clients.";
    const items = extractNumbers(text);
    expect(items.some((i) => i.raw === "14%")).toBe(true);
    expect(items.some((i) => i.raw === "$2,500,000")).toBe(true);
    expect(items.some((i) => i.raw === "2024")).toBe(true);
    expect(items.some((i) => i.raw === "10:30 am")).toBe(true);
    expect(items.some((i) => i.raw === "42")).toBe(true);
  });

  it("extracts quoted strings and code spans", () => {
    const text = 'He declared "launch now" and checked `git status`.';
    const quotes = extractQuotes(text);
    const code = extractCodeSpans(text);
    expect(quotes.some((q) => q.value === "launch now")).toBe(true);
    expect(code.some((c) => c.value === "git status")).toBe(true);
  });

  it("extracts URLs and email addresses", () => {
    const text = "Visit https://example.com/docs or email support@example.com.";
    const items = extractUrlsAndEmails(text);
    expect(items.some((i) => i.raw.includes("https://example.com/docs"))).toBe(true);
    expect(items.some((i) => i.raw === "support@example.com")).toBe(true);
  });

  it("extracts mid-sentence capitalized entities", () => {
    const text = "Yesterday Alice visited San Francisco for a conference.";
    const items = extractEntities(text);
    // "Yesterday" is at start so not an entity; "Alice" and "San Francisco" are
    expect(items.some((i) => i.raw === "Alice")).toBe(true);
    expect(items.some((i) => i.raw === "San Francisco")).toBe(true);
  });

  it("identifies missing or added items in comparison", () => {
    const original = "In 2019, revenue was $500,000.";
    const rewrite = "In 2020, revenue was $500,000.";
    const diff = compareMeaning(original, rewrite);
    expect(diff.allKept).toBe(false);
    expect(diff.missing.some((m) => m.raw === "2019")).toBe(true);
    expect(diff.added.some((a) => a.raw === "2020")).toBe(true);
  });

  it("reports 'all kept' when all elements are retained", () => {
    const original = "In 2019, the Google team generated $100,000 in revenue.";
    const rewrite = "During 2019, the Google team produced $100,000 in revenue.";
    const diff = compareMeaning(original, rewrite);
    expect(diff.allKept).toBe(true);
    expect(diff.summaryMessage).toBe("Numbers, names and quotes all kept.");
  });
});
