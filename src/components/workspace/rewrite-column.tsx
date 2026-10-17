"use client";

import * as React from "react";
import { useWorkspaceStore } from "@/lib/workspace-store";
import { countWords } from "@/lib/limits";
import { computeDiffAsync, type DiffSegment } from "@/lib/diff";
import { Segmented } from "@/components/ui/segmented";
import { Button } from "@/components/ui/button";
import { Copy, Check, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

const VIEW_OPTIONS = [
  { value: "tracked" as const, label: "Changes" },
  { value: "clean" as const, label: "Clean" },
] as const;

function isPredominantlyNonLatin(text: string): boolean {
  if (!text || text.length < 10) return false;
  const letters = text.match(/[\p{L}]/gu) || [];
  if (letters.length < 5) return false;
  const latin = text.match(/[A-Za-z]/g) || [];
  return (letters.length - latin.length) / letters.length > 0.5;
}

export function RewriteColumn() {
  const {
    original,
    status,
    result,
    error,
    view,
    setView,
    runRewrite,
    highlightTerm,
  } = useWorkspaceStore();

  const [copyLabel, setCopyLabel] = React.useState<string>("Copy clean text");
  const [diffSegments, setDiffSegments] = React.useState<DiffSegment[]>([]);
  const copyTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const hasResult = result !== null && status === "done";
  const rewriteText = result?.rewrite ?? "";
  const rewriteWords = hasResult ? countWords(rewriteText) : 0;
  const nonEnglishNotice = isPredominantlyNonLatin(original) || isPredominantlyNonLatin(rewriteText);

  // Compute diff once per completed result (memoized and worker-backed for >4000 chars)
  React.useEffect(() => {
    if (hasResult && original && rewriteText) {
      let cancelled = false;
      computeDiffAsync(original, rewriteText).then((segments) => {
        if (!cancelled) {
          setDiffSegments(segments);
        }
      });
      return () => {
        cancelled = true;
      };
    } else {
      setDiffSegments([]);
    }
  }, [hasResult, original, rewriteText]);

  const handleCopy = async () => {
    if (!hasResult || !rewriteText) return;
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard API unavailable");
      }
      // "Copy clean text" always copies the clean version without deletions
      await navigator.clipboard.writeText(rewriteText);
      setCopyLabel("Copied");
    } catch {
      setCopyLabel("Copy unavailable");
    }

    copyTimerRef.current = setTimeout(() => {
      setCopyLabel("Copy clean text");
    }, 1600);
  };

  /**
   * Render tracked changes with semantic <ins> and <del> tags
   */
  const renderTrackedDiff = () => {
    if (diffSegments.length === 0) {
      return <p className="whitespace-pre-wrap">{rewriteText}</p>;
    }

    return (
      <div className="whitespace-pre-wrap leading-[1.75] break-words [overflow-wrap:anywhere]">
        {diffSegments.map((seg, idx) => {
          const isHighlight =
            highlightTerm &&
            seg.value.toLowerCase().includes(highlightTerm.toLowerCase());

          if (seg.type === "added") {
            return (
              <ins
                key={`diff-${idx}`}
                className={cn(
                  "text-accent bg-accent-soft border-b-2 border-accent rounded-[2px] px-0.5 no-underline font-text inline transition-colors break-words [overflow-wrap:anywhere]",
                  isHighlight && "ring-2 ring-accent"
                )}
              >
                <span className="sr-only">inserted: </span>
                {seg.value}
              </ins>
            );
          }

          if (seg.type === "removed") {
            return (
              <del
                key={`diff-${idx}`}
                className={cn(
                  "text-del bg-del-bg line-through rounded-[2px] px-0.5 font-text inline transition-colors break-words [overflow-wrap:anywhere]",
                  isHighlight && "ring-2 ring-del"
                )}
              >
                <span className="sr-only">deleted: </span>
                {seg.value}
              </del>
            );
          }

          return (
            <span
              key={`diff-${idx}`}
              className={cn(isHighlight && "bg-amber-200 dark:bg-amber-800 rounded-[2px]", "break-words [overflow-wrap:anywhere]")}
            >
              {seg.value}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <section aria-labelledby="h-out" className="p-3.5 sm:p-5 min-[1181px]:p-6 min-w-0 flex flex-col">
      <div className="flex items-center justify-between min-h-[30px] mb-3 select-none flex-wrap gap-2">
        <h2 id="h-out" className="text-[13px] font-semibold text-muted font-ui">
          Rewrite
        </h2>
        <Segmented
          id="view"
          aria-label="View"
          size="sm"
          options={VIEW_OPTIONS}
          value={view}
          onChange={(val) => setView(val)}
          disabled={!hasResult}
        />
      </div>

      {/* Main body depending on status */}
      <div className="flex-1 flex flex-col min-w-0">
        {status === "idle" && (
          <div className="py-8 sm:py-12 max-w-md select-none">
            <p className="font-text italic text-[17px] sm:text-[18px] text-muted leading-snug">
              Your rewrite will appear here.
            </p>
          </div>
        )}

        {status === "running" && (
          <div className="flex-1 flex flex-col min-w-0">
            <p
              role="status"
              aria-live="polite"
              className="font-ui text-[14px] text-muted flex items-center gap-2.5 select-none mb-4"
            >
              <span
                className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-accent border-t-transparent"
                aria-hidden="true"
              />
              <span>Rewriting…</span>
            </p>
            {rewriteText && (
              <div className="font-text text-[16px] sm:text-[18px] leading-[1.75] max-w-[62ch] text-ink whitespace-pre-wrap flex-1 break-words [overflow-wrap:anywhere]">
                <p>{rewriteText}</p>
              </div>
            )}
          </div>
        )}

        {status === "error" && (
          <div
            role="alert"
            className="p-4 rounded-[6px] bg-del-bg text-del border border-del/20 flex flex-col items-start gap-3 my-2"
          >
            <p className="font-ui text-[14px] leading-relaxed font-medium">
              {error || "An error occurred while processing your rewrite."}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => runRewrite()}
              className="border-del/40 text-del hover:bg-del-bg/80 gap-1.5"
            >
              <RotateCcw size={13} aria-hidden="true" />
              <span>Try again</span>
            </Button>
          </div>
        )}

        {hasResult && (
          <div
            id="out"
            className="font-text text-[16px] sm:text-[18px] leading-[1.75] max-w-[62ch] text-ink flex-1 min-h-[220px] sm:min-h-[280px] break-words [overflow-wrap:anywhere]"
          >
            {view === "tracked" ? renderTrackedDiff() : (
              <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{rewriteText}</p>
            )}

            {nonEnglishNotice && (
              <p className="mt-4 text-[13px] text-muted font-ui select-none italic">
                I’m human is tuned for English.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Footer row */}
      <div className="flex items-center justify-between gap-2.5 mt-5 text-[13px] font-ui pt-3 border-t border-transparent select-none flex-wrap">
        <span className="text-muted">
          {hasResult ? `${rewriteWords} ${rewriteWords === 1 ? "word" : "words"}` : ""}
        </span>

        {hasResult && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            id="copy"
            className="gap-1.5 h-8 px-2.5"
          >
            {copyLabel === "Copied" ? (
              <Check size={13} className="text-accent" aria-hidden="true" />
            ) : (
              <Copy size={13} aria-hidden="true" />
            )}
            <span>{copyLabel}</span>
          </Button>
        )}
      </div>
    </section>
  );
}
