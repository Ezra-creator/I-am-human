"use client";

import * as React from "react";
import { useWorkspaceStore } from "@/lib/workspace-store";
import { WorkspaceToolbar } from "./workspace-toolbar";
import { OriginalColumn } from "./original-column";
import { RewriteColumn } from "./rewrite-column";
import { NotesColumn } from "./notes-column";
import { StatsStrip } from "./stats-strip";
import { X, FileText, AudioLines, ShieldCheck } from "lucide-react";

function WorkspaceOnboarding() {
  const [dismissed, setDismissed] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    try {
      setDismissed(localStorage.getItem("imhuman-onboarding-dismissed") === "true");
    } catch {
      setDismissed(false);
    }
  }, []);

  if (dismissed !== false) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem("imhuman-onboarding-dismissed", "true");
    } catch {}
  };

  return (
    <div
      role="region"
      aria-label="Welcome guide"
      className="mb-3.5 p-3.5 md:p-4 rounded-[8px] border border-line bg-panel flex items-start justify-between gap-4 font-ui text-[13px] text-muted animate-in fade-in duration-150"
    >
      <div className="space-y-2 leading-relaxed">
        <p className="flex items-start gap-2">
          <FileText size={14} className="text-accent shrink-0 mt-0.5" aria-hidden="true" />
          <span><strong className="text-ink font-semibold">What to paste:</strong> Paste drafts generated or structured by AI to replace robotic phrasing and flat transitions.</span>
        </p>
        <p className="flex items-start gap-2">
          <AudioLines size={14} className="text-accent shrink-0 mt-0.5" aria-hidden="true" />
          <span><strong className="text-ink font-semibold">How voices work:</strong> Use presets or add your own samples in Voices so rewrites match your authentic sentence rhythm.</span>
        </p>
        <p className="flex items-start gap-2">
          <ShieldCheck size={14} className="text-accent shrink-0 mt-0.5" aria-hidden="true" />
          <span><strong className="text-ink font-semibold">Realistic expectations:</strong> Style and cadence improve noticeably; outputs are never guaranteed to pass AI detectors.</span>
        </p>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        className="text-muted hover:text-ink p-1 rounded transition-colors shrink-0 cursor-pointer"
        aria-label="Dismiss guide"
      >
        <X size={15} />
      </button>
    </div>
  );
}

import { MIN_INPUT_CHARS, MAX_INPUT_CHARS } from "@/lib/limits";
import { Button } from "@/components/ui/button";

export function WorkspaceContainer() {
  const { initFromStorage, runRewrite, stopRewrite, status, original } = useWorkspaceStore();

  React.useEffect(() => {
    initFromStorage();
  }, [initFromStorage]);

  // Global keyboard shortcuts: ⌘/Ctrl+Enter runs; Esc stops
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        runRewrite();
      } else if (e.key === "Escape") {
        if (status === "running") {
          e.preventDefault();
          stopRewrite();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [runRewrite, stopRewrite, status]);

  const charCount = original.length;
  const isUnderMin = charCount < MIN_INPUT_CHARS;
  const isOverMax = charCount > MAX_INPUT_CHARS;
  const isRunning = status === "running";
  const isRewriteDisabled = isUnderMin || isOverMax;

  return (
    <div className="w-full flex flex-col">
      <WorkspaceOnboarding />

      {/* Main bordered workspace bench */}
      <div className="w-full bg-panel border border-line rounded-[10px] overflow-hidden flex flex-col">
        <WorkspaceToolbar />

        {/* Responsive grid: 1 col on <=680px, 2 col on 681-1020px, 3 col on 1021px+ */}
        <div className="grid grid-cols-1 min-[681px]:grid-cols-2 min-[1021px]:grid-cols-[1fr_1fr_260px] min-[1181px]:grid-cols-[1fr_1fr_300px] flex-1">
          {/* Column 1: Original */}
          <OriginalColumn />

          {/* Column 2: Rewrite */}
          <div className="border-t min-[681px]:border-t-0 min-[681px]:border-l border-line flex flex-col">
            <RewriteColumn />
          </div>

          {/* Column 3: What changed */}
          <NotesColumn />
        </div>

        <StatsStrip />
      </div>

      {/* Mobile Sticky Action Bar: Visible only on <= 680px, pinned above BottomNav */}
      <div
        role="region"
        aria-label="Mobile rewrite actions"
        className="fixed bottom-[calc(56px+env(safe-area-inset-bottom,0px))] left-0 right-0 z-30 p-2.5 px-4 bg-panel/95 backdrop-blur-md border-t border-line flex min-[681px]:hidden items-center justify-between gap-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]"
      >
        {isRunning ? (
          <Button
            type="button"
            variant="quiet"
            size="md"
            onClick={() => stopRewrite()}
            className="w-full h-11 text-del hover:text-del font-semibold text-[15px]"
          >
            Stop
          </Button>
        ) : (
          <Button
            type="button"
            variant="primary"
            size="md"
            disabled={isRewriteDisabled}
            onClick={() => runRewrite()}
            className="w-full h-11 font-semibold text-[15px]"
          >
            {isUnderMin ? (
              <span>Rewrite (needs {MIN_INPUT_CHARS - charCount} more chars)</span>
            ) : (
              <span>Rewrite</span>
            )}
          </Button>
        )}
      </div>

      {/* Caveat paragraph under container */}
      <p className="font-ui text-[12.5px] text-muted max-w-[70ch] mt-3.5 leading-relaxed select-none">
        AI detectors are probabilistic and disagree with each other. I’m human improves how text reads and varies its patterns; it can’t guarantee any score on any detector.
      </p>
    </div>
  );
}
