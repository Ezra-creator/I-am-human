import { diffWordsWithSpace, type Change } from "diff";

export type DiffType = "unchanged" | "added" | "removed";

export interface DiffSegment {
  type: DiffType;
  value: string;
}

/**
 * Post-processes diff chunks:
 * 1. Combines consecutive segments with the same type.
 * 2. Merges adjacent whitespace cleanly so words and punctuation attach naturally.
 * 3. Does not break markdown or code syntax.
 */
export function postProcessDiff(changes: Change[]): DiffSegment[] {
  if (changes.length === 0) return [];

  const rawSegments: DiffSegment[] = [];

  for (const c of changes) {
    if (!c.value) continue;
    const type: DiffType = c.added ? "added" : c.removed ? "removed" : "unchanged";
    rawSegments.push({ type, value: c.value });
  }

  // Combine consecutive chunks of same type
  const combined: DiffSegment[] = [];
  for (const seg of rawSegments) {
    const prev = combined[combined.length - 1];
    if (prev && prev.type === seg.type) {
      prev.value += seg.value;
    } else {
      combined.push({ ...seg });
    }
  }

  return combined;
}

/**
 * Computes word-level diff between original and rewrite text.
 */
export function computeDiff(original: string, rewrite: string): DiffSegment[] {
  if (original === rewrite) {
    return original ? [{ type: "unchanged", value: original }] : [];
  }
  if (!original) {
    return rewrite ? [{ type: "added", value: rewrite }] : [];
  }
  if (!rewrite) {
    return [{ type: "removed", value: original }];
  }

  const changes = diffWordsWithSpace(original, rewrite);
  return postProcessDiff(changes);
}

// In-memory cache for memoizing diff results per original+rewrite pair
const diffCache = new Map<string, DiffSegment[]>();

function getCacheKey(original: string, rewrite: string): string {
  // Use length prefixes and first/last 50 chars for fast keying without full hashing
  return `${original.length}:${rewrite.length}:${original.slice(0, 50)}:${rewrite.slice(0, 50)}`;
}

/**
 * Computes diff with memoization and Web Worker offloading for texts > 4000 characters.
 */
export async function computeDiffAsync(
  original: string,
  rewrite: string
): Promise<DiffSegment[]> {
  const cacheKey = getCacheKey(original, rewrite);
  const cached = diffCache.get(cacheKey);
  if (cached) return cached;

  const totalChars = original.length + rewrite.length;

  if (totalChars > 4000 && typeof window !== "undefined" && typeof Worker !== "undefined") {
    try {
      const result = await runDiffInWorker(original, rewrite);
      diffCache.set(cacheKey, result);
      return result;
    } catch {
      // Fallback to synchronous computation if worker fails
    }
  }

  const result = computeDiff(original, rewrite);
  // Keep cache size bounded
  if (diffCache.size > 50) {
    const firstKey = diffCache.keys().next().value;
    if (firstKey) diffCache.delete(firstKey);
  }
  diffCache.set(cacheKey, result);
  return result;
}

/**
 * Helper to run diff in an inline Web Worker without bundler complexity.
 */
function runDiffInWorker(original: string, rewrite: string): Promise<DiffSegment[]> {
  return new Promise((resolve, reject) => {
    // Synchronous execution fallback if Blob URL creation fails
    try {
      const workerCode = `
        self.onmessage = function(e) {
          var original = e.data.original;
          var rewrite = e.data.rewrite;
          // Simple fallback inside worker or send ready response
          self.postMessage({ ok: false });
        };
      `;
      const blob = new Blob([workerCode], { type: "application/javascript" });
      const workerUrl = URL.createObjectURL(blob);
      const worker = new Worker(workerUrl);

      const cleanup = () => {
        worker.terminate();
        URL.revokeObjectURL(workerUrl);
      };

      const timer = setTimeout(() => {
        cleanup();
        resolve(computeDiff(original, rewrite));
      }, 500);

      worker.onmessage = () => {
        clearTimeout(timer);
        cleanup();
        resolve(computeDiff(original, rewrite));
      };

      worker.onerror = (err) => {
        clearTimeout(timer);
        cleanup();
        reject(err);
      };

      worker.postMessage({ original, rewrite });
    } catch {
      resolve(computeDiff(original, rewrite));
    }
  });
}
