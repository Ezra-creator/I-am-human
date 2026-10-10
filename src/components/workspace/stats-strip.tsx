"use client";

import * as React from "react";
import { useWorkspaceStore } from "@/lib/workspace-store";
import { countWords } from "@/lib/limits";
import { countFlags } from "@/lib/flags";
import { compareMeaning, type MeaningItem } from "@/lib/meaning";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

export function StatsStrip() {
  const { original, result, status, setHighlightTerm } = useWorkspaceStore();
  const highlightTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasResult = result !== null && status === "done";
  const rewriteText = result?.rewrite ?? "";

  const originalWords = countWords(original);
  const rewriteWords = hasResult ? countWords(rewriteText) : 0;

  const stockRemoved = React.useMemo(() => {
    if (!hasResult || !original || !rewriteText) return 0;
    const origFlags = countFlags(original);
    const rewFlags = countFlags(rewriteText);
    return Math.max(0, origFlags - rewFlags);
  }, [hasResult, original, rewriteText]);

  const meaningDiff = React.useMemo(() => {
    if (!hasResult || !original || !rewriteText) return null;
    return compareMeaning(original, rewriteText);
  }, [hasResult, original, rewriteText]);

  const readingTimeSec = Math.max(1, Math.round(rewriteWords / 230));

  const handleItemClick = (item: MeaningItem) => {
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
    }
    setHighlightTerm(item.raw);
    highlightTimeoutRef.current = setTimeout(() => {
      setHighlightTerm(null);
    }, 2500);
  };

  return (
    <div className="border-t border-line bg-panel/30 font-ui select-none">
      {/* Primary stats strip */}
      <div className="flex items-center gap-x-5 gap-y-2 px-5 md:px-6 py-3 text-[13px] text-muted flex-wrap">
        <span>
          <strong className="font-semibold text-ink">{originalWords}</strong>{" "}
          {originalWords === 1 ? "word" : "words"} in the original
        </span>

        {hasResult && (
          <>
            <span className="text-line" aria-hidden="true">·</span>
            <span>
              <strong className="font-semibold text-ink">{rewriteWords}</strong>{" "}
              {rewriteWords === 1 ? "word" : "words"} in the rewrite
            </span>

            <span className="text-line" aria-hidden="true">·</span>
            <span>
              <strong className="font-semibold text-ink">{stockRemoved}</strong>{" "}
              stock {stockRemoved === 1 ? "phrase" : "phrases"} removed
            </span>

            <span className="text-line" aria-hidden="true">·</span>
            <div className="flex items-center gap-1.5">
              {meaningDiff?.allKept ? (
                <span className="text-ink flex items-center gap-1 font-medium">
                  <CheckCircle2 size={13} className="text-accent" />
                  Numbers, names and quotes all kept.
                </span>
              ) : (
                <span className="text-del flex items-center gap-1 font-medium">
                  <AlertTriangle size={13} />
                  Possible differences detected
                </span>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-muted hover:text-ink cursor-help p-0.5 rounded"
                    aria-label="Meaning check details"
                  >
                    <Info size={12} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  This is a consistency check comparing numbers, dates, quotes, URLs, and entities, not proof that meaning is preserved.
                </TooltipContent>
              </Tooltip>
            </div>

            <span className="text-line" aria-hidden="true">·</span>
            <span>
              Reading time{" "}
              <strong className="font-semibold text-ink">{readingTimeSec}</strong> sec
            </span>
          </>
        )}
      </div>

      {/* Meaning check difference callouts */}
      {hasResult && meaningDiff && !meaningDiff.allKept && (
        <div
          role="region"
          aria-label="Meaning consistency differences"
          className="px-5 md:px-6 py-2.5 bg-del-bg/30 border-t border-line text-[12.5px] flex items-center gap-3 flex-wrap"
        >
          <span className="font-medium text-del shrink-0">Check these:</span>
          <div className="flex items-center gap-2 flex-wrap">
            {meaningDiff.missing.map((item, idx) => (
              <button
                key={`mis-${idx}`}
                type="button"
                onClick={() => handleItemClick(item)}
                className="inline-flex items-center px-1.5 py-0.5 rounded bg-del/10 hover:bg-del/20 text-del border border-del/30 cursor-pointer font-mono text-[12px] transition-colors"
                title="In original but not in rewrite. Click to highlight."
              >
                &lsquo;{item.raw}&rsquo; missing in rewrite
              </button>
            ))}

            {meaningDiff.added.map((item, idx) => (
              <button
                key={`add-${idx}`}
                type="button"
                onClick={() => handleItemClick(item)}
                className="inline-flex items-center px-1.5 py-0.5 rounded bg-accent/10 hover:bg-accent/20 text-accent border border-accent/30 cursor-pointer font-mono text-[12px] transition-colors"
                title="New in rewrite. Click to highlight."
              >
                &lsquo;{item.raw}&rsquo; newly in rewrite
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
