"use client";

import * as React from "react";
import { useWorkspaceStore } from "@/lib/workspace-store";
import { WorkspaceToolbar } from "./workspace-toolbar";
import { OriginalColumn } from "./original-column";
import { RewriteColumn } from "./rewrite-column";
import { NotesColumn } from "./notes-column";
import { StatsStrip } from "./stats-strip";

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
