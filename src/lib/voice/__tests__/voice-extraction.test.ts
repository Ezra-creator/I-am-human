import { describe, it, expect } from "vitest";
import { extractMetrics } from "../extractor";
import { generateDescriptor, MAX_DESCRIPTOR_LENGTH } from "../descriptor";

const RICH_SAMPLE_1 = `
I write because thinking without a keyboard feels like wandering without a compass. It is not that thoughts do not exist in the shower or on a walk, but they lack edges. They drift. A sentence forces an opinion into the light.

When I first started writing online, I thought more words meant more wisdom. I was wrong. The best paragraphs hit like a clean right hook: fast, balanced, and impossible to misunderstand. If you can say something in five words, never stretch it to twenty just to sound important.
`;

const RICH_SAMPLE_2 = `
Look at the way good essays move. They do not maintain a single relentless tempo. They speed up, they slow down, and they occasionally ask you a question. Why do so many writers forget that rhythm is meaning?

We build tools not to replace our voice, but to amplify our intent. Technology should work for us—quietly, efficiently, and without fuss. Don't let algorithmic noise dilute your perspective.
`;

describe("Voice Metrics Extraction", () => {
  it("computes accurate sentence length and rhythm metrics on multi-paragraph samples", () => {
    const metrics = extractMetrics([RICH_SAMPLE_1, RICH_SAMPLE_2]);

    expect(metrics.totalWords).toBeGreaterThan(100);
    expect(metrics.totalSentences).toBeGreaterThan(8);
    expect(metrics.meanSentenceLength).toBeGreaterThan(5);
    expect(metrics.medianSentenceLength).toBeGreaterThan(5);
    expect(metrics.shortestSentenceLength).toBeGreaterThan(0);
    expect(metrics.longestSentenceLength).toBeGreaterThan(metrics.shortestSentenceLength);
    expect(metrics.coefficientOfVariation).toBeGreaterThan(0);
    expect(["Even", "Varied", "Very varied"]).toContain(metrics.rhythmCategory);

    // Histogram should total the number of sentences
    const histTotal = Object.values(metrics.histogram).reduce((a, b) => a + b, 0);
    expect(histTotal).toBe(metrics.totalSentences);
  });

  it("calculates punctuation frequencies correctly per 100 sentences", () => {
    const textWithPunctuation = "Why? Who knows! I think, however, that this—right here—is great; indeed, it is (or was): quite true.";
    const metrics = extractMetrics([textWithPunctuation]);

    expect(metrics.punctuation.questionMarks).toBeGreaterThan(0);
    expect(metrics.punctuation.exclamationMarks).toBeGreaterThan(0);
    expect(metrics.punctuation.commas).toBeGreaterThan(0);
    expect(metrics.punctuation.emDashes).toBeGreaterThan(0);
    expect(metrics.punctuation.semicolons).toBeGreaterThan(0);
    expect(metrics.punctuation.parentheses).toBeGreaterThan(0);
  });

  it("computes contraction rates and categorizes frequency", () => {
    const textWithContractions = "I don't think we're ready. It's late, and they've gone home. We'll see what's next.";
    const metrics = extractMetrics([textWithContractions]);

    expect(metrics.contractionRate).toBeGreaterThan(0);
    expect(["Rare", "Sometimes", "Often"]).toContain(metrics.contractionUse);
  });

  it("identifies first-person and second-person pronoun rates", () => {
    const personalText = "I believe we should improve our writing. You will see your work transform.";
    const metrics = extractMetrics([personalText]);

    expect(metrics.firstPersonRate).toBeGreaterThan(0);
    expect(metrics.secondPersonRate).toBeGreaterThan(0);
  });

  it("extracts non-stopword sentence openers and connectors", () => {
    const text = "Technology moves rapidly. However, humans adapt slowly. Furthermore, tools shape thinking.";
    const metrics = extractMetrics([text]);

    expect(metrics.topConnectors.some((c) => c.word === "however")).toBe(true);
    expect(metrics.topOpeners.length).toBeGreaterThan(0);
  });

  it("handles edge case: very short input (single word)", () => {
    const metrics = extractMetrics(["Hello."]);
    expect(metrics.totalWords).toBe(1);
    expect(metrics.totalSentences).toBe(1);
    expect(metrics.meanSentenceLength).toBe(1);
    expect(metrics.shortestSentenceLength).toBe(1);
    expect(metrics.longestSentenceLength).toBe(1);
  });

  it("handles edge case: single sentence without terminal punctuation", () => {
    const metrics = extractMetrics(["This is a clean sentence without any final dot"]);
    expect(metrics.totalWords).toBe(9);
    expect(metrics.totalSentences).toBe(1);
    expect(metrics.punctuation.questionMarks).toBe(0);
    expect(metrics.punctuation.exclamationMarks).toBe(0);
  });

  it("handles edge case: completely empty samples", () => {
    const metrics = extractMetrics(["", "   "]);
    expect(metrics.totalWords).toBe(0);
    expect(metrics.totalSentences).toBe(0);
    expect(metrics.meanSentenceLength).toBe(0);
  });

  it("handles edge case: non-Latin Unicode text", () => {
    const nonLatin = "Bonjour le monde. C'est magnifique, n'est-ce pas? Oui, absolument!";
    const metrics = extractMetrics([nonLatin]);
    expect(metrics.totalWords).toBeGreaterThan(5);
    expect(metrics.totalSentences).toBeGreaterThan(1);
  });
});

describe("Voice Descriptor Generation", () => {
  it("generates a rich descriptor strictly under the 1500 character limit", () => {
    const metrics = extractMetrics([RICH_SAMPLE_1, RICH_SAMPLE_2]);
    const descriptor = generateDescriptor(metrics);

    expect(descriptor.length).toBeGreaterThan(50);
    expect(descriptor.length).toBeLessThanOrEqual(MAX_DESCRIPTOR_LENGTH);
    expect(descriptor).toContain("Sentence structure:");
    expect(descriptor).toContain("Negative constraints:");
  });

  it("never includes any literal sample sentence in the descriptor", () => {
    const metrics = extractMetrics([RICH_SAMPLE_1]);
    const descriptor = generateDescriptor(metrics);

    expect(descriptor).not.toContain("I write because thinking without a keyboard");
    expect(descriptor).not.toContain("clean right hook");
  });

  it("enforces strict hard cap even with simulated heavy metrics", () => {
    const metrics = extractMetrics([RICH_SAMPLE_1, RICH_SAMPLE_2]);
    // Artificially inflate lists to stress test descriptor length
    metrics.topConnectors = [
      { word: "however", count: 10 },
      { word: "therefore", count: 8 },
      { word: "moreover", count: 6 },
      { word: "nevertheless", count: 5 },
      { word: "consequently", count: 4 },
      { word: "furthermore", count: 3 },
    ];
    metrics.topOpeners = [
      { word: "interestingly", count: 9 },
      { word: "consequently", count: 8 },
      { word: "surprisingly", count: 7 },
      { word: "fundamentally", count: 6 },
      { word: "specifically", count: 5 },
    ];

    const descriptor = generateDescriptor(metrics);
    expect(descriptor.length).toBeLessThanOrEqual(MAX_DESCRIPTOR_LENGTH);
  });
});
