# I’m human

A web app that rewrites AI-drafted text so it reads naturally, in the user’s own voice.

Built for writers, freelancers, and marketers with Next.js (App Router), TypeScript, and Tailwind CSS. The app is frontend-only, with one stateless route handler forwarding to Groq.

## Getting Started

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Configure environment:
   Copy `.env.example` to `.env.local` and add your Groq API key:
   ```bash
   cp .env.example .env.local
   ```

3. Run the development server:
   ```bash
   pnpm dev
   ```

4. Open [http://localhost:3000](http://localhost:3000).

## Model Comparison Script

Compare rewrite speed, output length, and note generation across Groq models:

1. Place one or more `.txt` writing passages inside the `eval-samples/` folder (gitignored).
2. Run the evaluation script with your target model IDs:
   ```bash
   pnpm dlx tsx scripts/compare-models.ts llama-3.3-70b-versatile
   ```
   Or evaluate multiple models in parallel:
   ```bash
   pnpm dlx tsx scripts/compare-models.ts llama-3.3-70b-versatile qwen-2.5-32b
   ```
3. Rewritten files are saved to `eval-output/<model>/<file>.txt` (gitignored), and a summary table with timing and word counts is printed to the console.
