"use client";

import * as React from "react";
import { useWorkspaceStore } from "@/lib/workspace-store";
import { countWords } from "@/lib/limits";

export function StatsStrip() {
  const { original, result, status } = useWorkspaceStore();
  const originalWords = countWords(original);
  const hasResult = result !== null && status === "done";

  return (
    <div className="flex items-center gap-5 px-5 md:px-6 py-3.5 border-t border-line text-[13px] text-muted font-ui flex-wrap select-none">
      <span>
        <strong className="font-semibold text-ink">{originalWords}</strong>{" "}
        {originalWords === 1 ? "word" : "words"} in the original
      </span>

      {/* Remaining stats appear after result exists (Phase 5) */}
      {hasResult && (
        <span className="hidden" aria-hidden="true" data-region="result-stats" />
      )}
    </div>
  );
}
