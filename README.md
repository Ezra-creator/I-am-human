# I’m human

> **I’m human** is a privacy-first web application that rewrites AI-drafted text so it reads naturally, in the user’s own authentic voice.

Built for writers, freelancers, and marketers with Next.js (App Router, TypeScript strict, Tailwind CSS). The application is entirely client-side and browser-persisted, powered by one stateless proxy route handler that interfaces with Groq's high-speed inference engine.

There is **no user tracking, no backend database, no user accounts, and no telemetry**. All drafts, custom voice profiles, and revision histories live entirely in the user's browser.

---

## Key Features

1. **Natural Rewrite Engine**:
   - Streamed rewrites powered by Groq (defaulting to `llama-3.3-70b-versatile`).
   - Three fine-tuned strength settings: *Light*, *Balanced*, and *Full rewrite*.
   - Plain editorial principles: preserves facts, numbers, dates, and quotes while eliminating generic AI openers, filler transitions, inflated vocabulary, and hollow summaries.
   - Structured editorial change notes for each edit.

2. **Custom Voice Profiles**:
   - Pure deterministic analysis using `Intl.Segmenter` directly inside the browser.
   - Extracts sentence length distributions, rhythm variation (coefficient of variation), lexical diversity, punctuation habits, and opener frequencies.
   - Generates concise style-guide descriptors (hard-capped at 1,500 characters). Raw writing samples never leave the browser.
   - Local IndexedDB storage via Dexie with graceful degradation when storage is blocked.

3. **Tracked Changes & Inspectable Analysis**:
   - Semantic word-level `<ins>` and `<del>` tracked changes with a toggleable "Clean" view.
   - AI cliché pattern detection highlighting stock transitions with contextual tooltips.
   - Interactive sentence-rhythm chart comparing before and after sentence length bars with accessibility text alternatives.
   - Meaning consistency checker verifying retention of numbers, dates, quotes, URLs, and mid-sentence entities.

4. **Local History & Data Sovereignty**:
   - Automatic chronological ledger of past rewrites grouped by day.
   - Client-side debounced search and one-click workspace restoration.
   - Complete data export and schema-validated JSON import.
   - Complete local wipe mechanism.

---

## Tech Stack

- **Framework**: Next.js 16 (App Router, Server Components & Route Handlers)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS v4 & custom design tokens (light and dark mode)
- **Persistence**: Dexie.js (IndexedDB) & LocalStorage
- **State Management**: Zustand
- **Accessible Primitives**: Radix UI (Dialog, Select, Tooltip, Toast)
- **Diff Engine**: `diff` with Web Worker offloading for long texts
- **Testing**: Vitest (unit tests) & Playwright (end-to-end tests)

---

## Local Setup

### 1. Prerequisites
- Node.js 20+
- `pnpm` (v9 or v12)

### 2. Installation
```bash
git clone https://github.com/Ezra-creator/I-am-human.git
cd "I-am-human"
pnpm install
```

### 3. Environment Variables
Create a `.env.local` file in the root directory:
```bash
cp .env.example .env.local
```

Define the following environment variables:
```ini
# Required: Groq API key for the shared proxy route
GROQ_API_KEY=gsk_your_groq_api_key_here

# Optional: Overrides the default model (defaults to llama-3.3-70b-versatile)
GROQ_MODEL=llama-3.3-70b-versatile

# Optional: Max input characters allowed (defaults to 12000)
MAX_INPUT_CHARS=12000
```

### 4. Development Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Scripts & Testing

- `pnpm lint`: Run ESLint checks.
- `pnpm typecheck`: Run TypeScript compilation check (`tsc --noEmit`).
- `pnpm test`: Run Vitest unit tests (voice extraction, diff, flags, rhythm, meaning, rate-limiter, prompts).
- `pnpm test:e2e`: Run Playwright end-to-end test suite.
- `pnpm check`: Run all validation gates in sequence (`lint`, `typecheck`, `test`, `build`).

---

## Model Comparison Tool

To evaluate candidate LLM models on real writing samples:
```bash
pnpm dlx tsx scripts/compare-models.ts llama-3.3-70b-versatile qwen-2.5-32b
```
Outputs timing, word count delta, and generated notes to `eval-output/`.

---

## Rate Limits

- The server route enforces an in-memory sliding-window rate limit (8 requests/minute, 60 requests/day per IP).
- If limits are reached, the route returns HTTP 429 with a Retry-After header advising when to retry.
- For high-throughput commercial deployment, upgrading the server-side Groq tier provides higher allowances.

---

## Deployment on Vercel

1. Push your repository to GitHub.
2. In the Vercel dashboard, click **Add New Project** and select the `I-am-human` repository.
3. In **Project Settings** &rarr; **Environment Variables**, configure:
   - `GROQ_API_KEY`: Your production Groq API key.
   - `GROQ_MODEL`: `llama-3.3-70b-versatile` (or your chosen model).
   - `MAX_INPUT_CHARS`: `12000`.
4. Deploy. The Node runtime for route handlers (`export const runtime = "nodejs"`) and security headers are configured automatically.
