"use client";

import * as React from "react";
import { computeComparisonRhythm } from "@/lib/rhythm";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface RhythmChartProps {
  originalText: string;
  rewriteText: string;
}

export function RhythmChart({ originalText, rewriteText }: RhythmChartProps) {
  const data = React.useMemo(() => {
    return computeComparisonRhythm(originalText, rewriteText);
  }, [originalText, rewriteText]);

  const { before, after, sharedMax, summaryText } = data;

  if (before.lengths.length === 0 && after.lengths.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 pt-5 border-t border-line font-ui">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[13px] font-semibold text-muted select-none">
          Sentence length (words)
        </h3>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="text-muted hover:text-ink transition-colors p-0.5 rounded cursor-help"
              aria-label="Explain sentence variation"
            >
              <Info size={13} strokeWidth={1.75} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            Variation is the coefficient of variation (standard deviation divided by mean sentence length). Higher numbers mean more natural rhythm and varied pacing.
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="space-y-3">
        {/* Before row */}
        <div className="flex items-end gap-3" role="figure" aria-label={before.textAlternative}>
          <span className="text-[11.5px] text-muted w-11 shrink-0 font-medium select-none pb-1">
            Before
          </span>
          <div
            className="flex items-end gap-[5px] h-[56px] flex-1 overflow-x-auto pb-0.5"
            tabIndex={0}
            aria-label={before.textAlternative}
          >
            <span className="sr-only">{before.textAlternative}</span>
            {before.lengths.map((len, idx) => {
              const heightPx = Math.max(4, Math.round((len / sharedMax) * 56));
              return (
                <div
                  key={`b-${idx}`}
                  style={{ height: `${heightPx}px` }}
                  className="w-[6px] shrink-0 bg-line rounded-t-[2px] transition-all hover:brightness-90"
                  title={`Sentence ${idx + 1}: ${len} words`}
                  aria-hidden="true"
                />
              );
            })}
          </div>
        </div>

        {/* After row */}
        <div className="flex items-end gap-3" role="figure" aria-label={after.textAlternative}>
          <span className="text-[11.5px] text-accent w-11 shrink-0 font-medium select-none pb-1">
            After
          </span>
          <div
            className="flex items-end gap-[5px] h-[56px] flex-1 overflow-x-auto pb-0.5"
            tabIndex={0}
            aria-label={after.textAlternative}
          >
            <span className="sr-only">{after.textAlternative}</span>
            {after.lengths.map((len, idx) => {
              const heightPx = Math.max(4, Math.round((len / sharedMax) * 56));
              return (
                <div
                  key={`a-${idx}`}
                  style={{ height: `${heightPx}px` }}
                  className="w-[6px] shrink-0 bg-accent rounded-t-[2px] transition-all hover:brightness-110"
                  title={`Sentence ${idx + 1}: ${len} words`}
                  aria-hidden="true"
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Derived summary sentence */}
      <div className="mt-3 flex items-center justify-between text-[12.5px] text-muted">
        <span>{summaryText}</span>
        {(before.isGrouped || after.isGrouped) && (
          <span className="text-[11px] italic">Grouped into 40 buckets</span>
        )}
      </div>
    </div>
  );
}
