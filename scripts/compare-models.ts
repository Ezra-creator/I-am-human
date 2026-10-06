#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { buildSystemPrompt, estimateMaxTokens, NOTES_DELIMITER } from "../src/lib/prompts";
import { countWords } from "../src/lib/limits";

interface EvalResult {
  model: string;
  file: string;
  inputWords: number;
  outputWords: number;
  notesCount: number;
  durationMs: number;
  error?: string;
}

async function main() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("Error: GROQ_API_KEY environment variable is required to run evaluations.");
    process.exit(1);
  }

  // Parse model IDs from CLI args or fallback
  const args = process.argv.slice(2);
  const models = args.length > 0 ? args : [process.env.GROQ_MODEL || "llama-3.3-70b-versatile"];

  const samplesDir = path.resolve(process.cwd(), "eval-samples");
  const outputBaseDir = path.resolve(process.cwd(), "eval-output");

  if (!fs.existsSync(samplesDir)) {
    fs.mkdirSync(samplesDir, { recursive: true });
    console.log(`Created ${samplesDir}. Place .txt evaluation passages in this directory and re-run.`);
    return;
  }

  const sampleFiles = fs.readdirSync(samplesDir).filter((file) => file.endsWith(".txt"));
  if (sampleFiles.length === 0) {
    console.log(`No .txt files found in ${samplesDir}.`);
    console.log("Add 1 or more .txt sample files to evaluate model performance.");
    return;
  }

  console.log(`\nEvaluating ${sampleFiles.length} sample(s) across ${models.length} model(s):`);
  console.log(`Models: ${models.join(", ")}\n`);

  const groq = createGroq({ apiKey });
  const results: EvalResult[] = [];

  for (const modelId of models) {
    console.log(`▶ Running model: ${modelId}`);
    const modelOutputDir = path.join(outputBaseDir, modelId.replace(/[/\\?%*:|"<>]/g, "_"));
    fs.mkdirSync(modelOutputDir, { recursive: true });

    for (const file of sampleFiles) {
      const filePath = path.join(samplesDir, file);
      const text = fs.readFileSync(filePath, "utf-8").trim();
      const inputWords = countWords(text);

      const startTime = performance.now();
      try {
        const systemPrompt = buildSystemPrompt("balanced", { kind: "preset", id: "neutral" });
        const maxTokens = estimateMaxTokens(text);

        const response = await generateText({
          model: groq(modelId),
          system: systemPrompt,
          prompt: text,
          temperature: 0.7,
          maxOutputTokens: maxTokens,
        });

        const durationMs = Math.round(performance.now() - startTime);
        const fullOutput = response.text;

        const delimiterIdx = fullOutput.indexOf(NOTES_DELIMITER);
        const rewrite = delimiterIdx !== -1 ? fullOutput.slice(0, delimiterIdx).trim() : fullOutput.trim();
        const rawNotes = delimiterIdx !== -1 ? fullOutput.slice(delimiterIdx + NOTES_DELIMITER.length).trim() : "";

        let notesCount = 0;
        try {
          const parsed = JSON.parse(rawNotes);
          if (Array.isArray(parsed)) notesCount = parsed.length;
        } catch {
          // ignore notes count parsing error
        }

        const outputWords = countWords(rewrite);
        const outFilePath = path.join(modelOutputDir, file);
        fs.writeFileSync(outFilePath, fullOutput, "utf-8");

        results.push({
          model: modelId,
          file,
          inputWords,
          outputWords,
          notesCount,
          durationMs,
        });

        console.log(`  ✓ ${file}: ${durationMs}ms, ${inputWords}w -> ${outputWords}w (${notesCount} notes)`);
      } catch (err: unknown) {
        const durationMs = Math.round(performance.now() - startTime);
        const errorMsg = err instanceof Error ? err.message : String(err);
        results.push({
          model: modelId,
          file,
          inputWords,
          outputWords: 0,
          notesCount: 0,
          durationMs,
          error: errorMsg,
        });
        console.error(`  ✗ ${file}: Failed (${errorMsg})`);
      }
    }
  }

  // Summary Table
  console.log("\n==================== EVALUATION SUMMARY ====================");
  console.table(
    results.map((r) => ({
      Model: r.model,
      Sample: r.file,
      "Input (words)": r.inputWords,
      "Output (words)": r.outputWords,
      Notes: r.notesCount,
      "Time (ms)": r.durationMs,
      Status: r.error ? "Error" : "Success",
    }))
  );
  console.log(`Outputs written to: ${outputBaseDir}`);
}

main().catch((err) => {
  console.error("Evaluation script encountered fatal error:", err);
  process.exit(1);
});
