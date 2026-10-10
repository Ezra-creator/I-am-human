"use client";

import * as React from "react";
import { useWorkspaceStore } from "@/lib/workspace-store";
import { countWords, countChars, MAX_INPUT_CHARS } from "@/lib/limits";
import { findFlags } from "@/lib/flags";
import { Button } from "@/components/ui/button";
import { Toast, ToastTitle, ToastDescription, ToastClose } from "@/components/ui/toast";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Clipboard, Trash2, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function OriginalColumn() {
  const {
    original,
    setOriginal,
    clearOriginal,
    status,
    mode,
    setMode,
    highlightTerm,
  } = useWorkspaceStore();

  const [toastOpen, setToastOpen] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const isRunning = status === "running";
  const words = countWords(original);
  const chars = countChars(original);
  const isOverLimit = chars > MAX_INPUT_CHARS;
  const overBy = chars - MAX_INPUT_CHARS;

  // Auto-grow textarea to content height with 280px floor
  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.max(280, textareaRef.current.scrollHeight)}px`;
    }
  }, [original, mode]);

  const flags = React.useMemo(() => {
    return mode === "reviewing" && original ? findFlags(original) : [];
  }, [original, mode]);

  const handlePaste = async () => {
    if (isRunning) return;
    try {
      if (!navigator.clipboard?.readText) {
        throw new Error("Clipboard API unavailable");
      }
      const text = await navigator.clipboard.readText();
      if (text) {
        setOriginal(text);
      }
    } catch {
      setToastOpen(true);
    }
  };

  /**
   * Render reviewed original text with highlighted <mark> tags for AI clichés
   * and meaning check term highlighting.
   */
  const renderReviewContent = () => {
    if (!original) {
      return <p className="text-muted font-ui">No original text.</p>;
    }

    if (flags.length === 0) {
      return <p className="whitespace-pre-wrap">{original}</p>;
    }

    const elements: React.ReactNode[] = [];
    let lastIndex = 0;

    flags.forEach((flag, idx) => {
      if (flag.start > lastIndex) {
        elements.push(
          <span key={`text-${lastIndex}`}>
            {original.slice(lastIndex, flag.start)}
          </span>
        );
      }

      const isHighlightedTerm =
        highlightTerm &&
        flag.text.toLowerCase().includes(highlightTerm.toLowerCase());

      elements.push(
        <Tooltip key={`flag-${idx}`}>
          <TooltipTrigger asChild>
            <mark
              tabIndex={0}
              className={cn(
                "bg-flag border-b-2 border-flag-line rounded-[2px] px-0.5 text-ink cursor-help transition-colors duration-200 outline-none focus-visible:ring-1 focus-visible:ring-accent",
                isHighlightedTerm && "ring-2 ring-accent"
              )}
              aria-label={`${flag.categoryLabel}: ${flag.text}`}
            >
              {flag.text}
            </mark>
          </TooltipTrigger>
          <TooltipContent side="top">
            <span>{flag.categoryLabel}</span>
          </TooltipContent>
        </Tooltip>
      );

      lastIndex = flag.end;
    });

    if (lastIndex < original.length) {
      elements.push(
        <span key={`text-tail`}>{original.slice(lastIndex)}</span>
      );
    }

    return <div className="whitespace-pre-wrap">{elements}</div>;
  };

  return (
    <section aria-labelledby="h-orig" className="p-5 md:px-6 md:py-5 min-w-0 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between min-h-[30px] mb-3 select-none">
        <div className="flex items-center gap-3">
          <h2 id="h-orig" className="text-[13px] font-semibold text-muted font-ui">
            Original
          </h2>
          {mode === "reviewing" && (
            <span
              className="text-[12px] text-muted flex items-center gap-1.5 font-ui"
              title={`${flags.length} potential AI patterns identified`}
            >
              <span
                className="inline-block w-2.5 h-2.5 rounded-[2px] bg-flag border-b border-flag-line shrink-0"
                aria-hidden="true"
              />
              <span>AI patterns flagged ({flags.length})</span>
            </span>
          )}
        </div>

        {mode === "reviewing" && (
          <Button
            type="button"
            variant="quiet"
            size="sm"
            onClick={() => setMode("editing")}
            className="text-muted hover:text-ink text-[12.5px] h-7 px-2"
          >
            Edit original
          </Button>
        )}
      </div>

      {/* Main Column Body */}
      <div className="flex-1 flex flex-col">
        {mode === "editing" ? (
          <>
            <label htmlFor="original-input" className="sr-only">
              Text to rewrite
            </label>
            <textarea
              id="original-input"
              ref={textareaRef}
              value={original}
              onChange={(e) => setOriginal(e.target.value)}
              placeholder="Paste or write the text you want to rewrite."
              disabled={isRunning}
              rows={7}
              className={cn(
                "w-full flex-1 max-w-[62ch] min-h-[280px] bg-transparent border-0 outline-none resize-none p-0",
                "font-text text-[18px] max-[680px]:text-[17px] leading-[1.75] text-ink placeholder:text-muted/60",
                "focus-visible:outline-none"
              )}
            />
          </>
        ) : (
          <div className="font-text text-[18px] max-[680px]:text-[17px] leading-[1.75] max-w-[62ch] text-ink flex-1 min-h-[280px]">
            {renderReviewContent()}
          </div>
        )}
      </div>

      {/* Footer row */}
      <div className="flex items-center gap-2.5 mt-5 text-[13px] font-ui pt-3 border-t border-transparent select-none">
        <div className="flex-1">
          {isOverLimit ? (
            <span className="text-del font-medium">
              Over the limit by {overBy} {overBy === 1 ? "character" : "characters"}
            </span>
          ) : (
            <span className="text-muted">
              {words} {words === 1 ? "word" : "words"}
            </span>
          )}
        </div>

        {mode === "editing" ? (
          <>
            <Button
              type="button"
              variant="quiet"
              size="sm"
              onClick={handlePaste}
              disabled={isRunning}
              className="gap-1.5"
            >
              <Clipboard size={13} aria-hidden="true" />
              <span>Paste</span>
            </Button>
            <Button
              type="button"
              variant="quiet"
              size="sm"
              onClick={clearOriginal}
              disabled={isRunning || !original}
              className="gap-1.5"
            >
              <Trash2 size={13} aria-hidden="true" />
              <span>Clear</span>
            </Button>
          </>
        ) : (
          <Button
            type="button"
            variant="quiet"
            size="sm"
            onClick={() => setMode("editing")}
            className="gap-1.5"
          >
            <Edit2 size={13} aria-hidden="true" />
            <span>Edit original</span>
          </Button>
        )}
      </div>

      {/* Clipboard error Toast */}
      <Toast open={toastOpen} onOpenChange={setToastOpen}>
        <div className="flex flex-col gap-0.5">
          <ToastTitle>Clipboard access needed</ToastTitle>
          <ToastDescription>
            Please paste directly with your keyboard (⌘V or Ctrl+V).
          </ToastDescription>
        </div>
        <ToastClose />
      </Toast>
    </section>
  );
}
