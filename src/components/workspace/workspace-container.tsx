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

export function WorkspaceContainer() {
  const { initFromStorage, runRewrite, stopRewrite, status } = useWorkspaceStore();

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

  return (
    <div className="w-full flex flex-col">
      <WorkspaceOnboarding />

      {/* Main bordered workspace bench */}
      <div className="w-full bg-panel border border-line rounded-[10px] overflow-hidden flex flex-col">
        <WorkspaceToolbar />

        {/* 3-column responsive grid */}
        <div className="grid grid-cols-1 min-[681px]:grid-cols-2 min-[1021px]:grid-cols-[1fr_1fr_300px] flex-1">
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

      {/* Caveat paragraph under container */}
      <p className="font-ui text-[12.5px] text-muted max-w-[70ch] mt-3.5 leading-relaxed select-none">
        AI detectors are probabilistic and disagree with each other. I’m human improves how text reads and varies its patterns; it can’t guarantee any score on any detector.
      </p>
    </div>
  );
}
