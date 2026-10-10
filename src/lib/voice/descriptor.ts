import { type VoiceMetrics } from "./types";

export const MAX_DESCRIPTOR_LENGTH = 1500;

export function generateDescriptor(metrics: VoiceMetrics): string {
  if (metrics.totalWords === 0) {
    return "Balanced, clear prose with standard sentence length and natural rhythm.";
  }

  const sections: string[] = [];

  // 1. Sentence length & cadence
  const rhythmText =
    metrics.rhythmCategory === "Even"
      ? "even, consistent sentence lengths"
      : metrics.rhythmCategory === "Very varied"
      ? "wide rhythmic variation across sentences"
      : "natural, moderate variation in sentence lengths";

  sections.push(
    `Sentence structure: Sentences average ${metrics.meanSentenceLength} words (median ${metrics.medianSentenceLength}), exhibiting ${rhythmText} spanning from ${metrics.shortestSentenceLength} to ${metrics.longestSentenceLength} words.`
  );

  // Short/long sentence characteristics
  if (metrics.shortSentenceRatio >= 0.25) {
    sections.push(
      "Cadence: Frequently introduces punchy short sentences (under 8 words) to emphasize key assertions."
    );
  }
  if (metrics.longSentenceRatio >= 0.2) {
    sections.push(
      "Syntactic complexity: Comfortably develops extended clauses (25+ words) to explore nuanced or layered ideas."
    );
  }

  // 2. Contractions
  if (metrics.contractionUse === "Often") {
    sections.push(
      "Diction & tone: Consistently employs natural contractions (e.g., don't, it's, we're) for an unpretentious, direct tone."
    );
  } else if (metrics.contractionUse === "Sometimes") {
    sections.push(
      "Diction & tone: Uses contractions where natural, balancing warmth with professional clarity."
    );
  } else {
    sections.push(
      "Diction & tone: Uses contractions sparingly, maintaining a formal and deliberate register."
    );
  }

  // 3. Paragraph structure
  sections.push(
    `Paragraph flow: Paragraphs typically run ${metrics.meanSentencesPerParagraph} sentences, keeping thought units focused.`
  );

  // 4. Punctuation habits
  const punctDetails: string[] = [];
  if (metrics.punctuation.emDashes >= 6) {
    punctDetails.push("em dashes for parenthetical emphasis or conversational aside");
  }
  if (metrics.punctuation.semicolons >= 4) {
    punctDetails.push("semicolons to balance paired clauses");
  }
  if (metrics.punctuation.colons >= 4) {
    punctDetails.push("colons to introduce explanations");
  }
  if (metrics.punctuation.questionMarks >= 5) {
    punctDetails.push("rhetorical or direct questions to engage the reader");
  }
  if (punctDetails.length > 0) {
    sections.push(`Punctuation tendencies: Employs ${punctDetails.join("; ")}.`);
  }

  // 5. Connectors & Openers
  if (metrics.topConnectors.length > 0) {
    const connList = metrics.topConnectors.slice(0, 4).map((c) => `"${c.word}"`).join(", ");
    sections.push(`Favored transitions: Relies on organic connectors like ${connList}.`);
  }

  if (metrics.topOpeners.length > 0) {
    const openerList = metrics.topOpeners.slice(0, 4).map((o) => `"${o.word}"`).join(", ");
    sections.push(`Sentence opening habits: Often opens thoughts with terms such as ${openerList}.`);
  }

  // 6. Perspective
  if (metrics.firstPersonRate >= 2.0) {
    sections.push("Point of view: Writes with an active first-person presence (I/we).");
  } else if (metrics.secondPersonRate >= 1.5) {
    sections.push("Point of view: Directly engages the audience using second-person address (you).");
  }

  // 7. General style rules
  sections.push(
    "Negative constraints: Avoid stock AI fillers (moreover, furthermore, delve, tapestry, robust, testament, foster, in conclusion). Describe ideas with plain, grounded phrasing without borrowing sample phrases."
  );

  let descriptor = sections.join("\n\n").trim();

  // Enforce strict 1500 character hard cap
  if (descriptor.length > MAX_DESCRIPTOR_LENGTH) {
    descriptor = descriptor.slice(0, MAX_DESCRIPTOR_LENGTH - 3).trimEnd() + "...";
  }

  return descriptor;
}
