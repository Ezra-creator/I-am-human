"use client";

import * as React from "react";
import { useWorkspaceStore } from "@/lib/workspace-store";
import { countWords } from "@/lib/limits";
import { Segmented } from "@/components/ui/segmented";
import { Button } from "@/components/ui/button";

const VIEW_OPTIONS = [
  { value: "tracked" as const, label: "Changes" },
  { value: "clean" as const, label: "Clean" },
] as const;

export function RewriteColumn() {
  const {
    status,
    result,
    error,
    view,
    setView,
    runRewrite,
  } = useWorkspaceStore();

  const [copyLabel, setCopyLabel] = React.useState<string>("Copy clean text");
  const copyTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const hasResult = result !== null && status === "done";
  const rewriteText = result?.rewrite ?? "";
  const rewriteWords = hasResult ? countWords(rewriteText) : 0;

  const handleCopy = async () => {
    if (!hasResult || !rewriteText) return;
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard API unavailable");
      }
      await navigator.clipboard.writeText(rewriteText);
      setCopyLabel("Copied");
    } catch {
      setCopyLabel("Copy unavailable");
    }

    copyTimerRef.current = setTimeout(() => {
      setCopyLabel("Copy clean text");
    }, 1600);
  };

  return (
    <section aria-labelledby="h-out" className="p-5 md:px-6 md:py-5 min-w-0 flex flex-col">
      <div className="flex items-center justify-between min-h-[30px] mb-3 select-none">
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

      {/* Main body depending on state */}
      <div className="flex-1 flex flex-col">
        {status === "idle" && (
          <div className="py-8 max-w-md select-none">
            <p className="font-ui font-medium text-[15px] text-ink">
              Your rewrite appears here.
            </p>
            <p className="font-ui text-[14px] text-muted leading-relaxed mt-1.5">
              Paste text on the left, choose a voice and edit strength, then press Rewrite.
            </p>
          </div>
        )}

        {status === "running" && (
          <div className="flex-1 flex flex-col">
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
              <div className="font-text text-[18px] max-[680px]:text-[17px] leading-[1.75] max-w-[62ch] text-ink whitespace-pre-wrap flex-1">
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
              {error || "The rewrite engine isn’t connected yet."}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => runRewrite()}
              className="border-del/40 text-del hover:bg-del-bg/80"
            >
              Try again
            </Button>
          </div>
        )}

        {hasResult && (
          <div
            id="out"
            className="font-text text-[18px] max-[680px]:text-[17px] leading-[1.75] max-w-[62ch] text-ink whitespace-pre-wrap flex-1"
          >
            <p>{rewriteText}</p>
          </div>
        )}
      </div>

      {/* Footer row */}
      <div className="flex items-center justify-between gap-2.5 mt-5 text-[13px] font-ui pt-3 border-t border-transparent select-none">
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
          >
            {copyLabel}
          </Button>
        )}
      </div>
    </section>
  );
}
