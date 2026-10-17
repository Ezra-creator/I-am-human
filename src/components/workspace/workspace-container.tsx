"use client";

import * as React from "react";
import { useWorkspaceStore } from "@/lib/workspace-store";
import { WorkspaceToolbar } from "./workspace-toolbar";
import { OriginalColumn } from "./original-column";
import { RewriteColumn } from "./rewrite-column";
import { NotesColumn } from "./notes-column";
import { StatsStrip } from "./stats-strip";
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
    </div>
  );
}
