"use client";

import * as React from "react";
import { useWorkspaceStore } from "@/lib/workspace-store";
import { countWords, countChars, MAX_INPUT_CHARS } from "@/lib/limits";
import { Button } from "@/components/ui/button";
import { Toast, ToastTitle, ToastDescription, ToastClose } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export function OriginalColumn() {
  const { original, setOriginal, clearOriginal, status } = useWorkspaceStore();
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
  }, [original]);

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

  return (
    <section aria-labelledby="h-orig" className="p-5 md:px-6 md:py-5 min-w-0 flex flex-col">
      <h2
        id="h-orig"
        className="text-[13px] font-semibold text-muted font-ui min-h-[30px] flex items-center mb-3 select-none"
      >
        Original
      </h2>

      <div className="flex-1 flex flex-col">
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

        <Button
          type="button"
          variant="quiet"
          size="sm"
          onClick={handlePaste}
          disabled={isRunning}
        >
          Paste
        </Button>

        <Button
          type="button"
          variant="quiet"
          size="sm"
          onClick={clearOriginal}
          disabled={isRunning || !original}
        >
          Clear
        </Button>
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
