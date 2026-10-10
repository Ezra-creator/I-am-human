"use client";

import * as React from "react";
import { useWorkspaceStore } from "@/lib/workspace-store";
import { RhythmChart } from "./rhythm-chart";
import { cn } from "@/lib/utils";

export function NotesColumn() {
  const { original, result, status } = useWorkspaceStore();
  const hasResult = result !== null && status === "done";
  const isRunning = status === "running";
  const notes = result?.notes ?? [];
  const rewriteText = result?.rewrite ?? "";

  const isIdentical = hasResult && original.trim() === rewriteText.trim() && original.trim().length > 0;

  return (
    <aside
      aria-labelledby="h-notes"
      className={cn(
        "p-5 md:px-6 md:py-5 min-w-0 flex flex-col",
        "border-line border-t min-[1021px]:border-t-0 min-[1021px]:border-l",
        "max-[1020px]:col-span-full"
      )}
    >
      <div className="flex items-center justify-between min-h-[30px] mb-3 select-none">
        <h2
          id="h-notes"
          className="text-[13px] font-semibold text-muted font-ui"
        >
          What changed
        </h2>
        {isRunning && (
          <span className="text-[12px] text-muted italic font-ui">
            Waiting for notes…
          </span>
        )}
      </div>

      {/* Change notes list or state notices */}
      {status === "idle" && (
        <p className="text-[13px] text-muted font-ui leading-relaxed">
          Each edit is explained here after a rewrite.
        </p>
      )}

      {isIdentical && (
        <p className="text-[13px] text-muted font-ui italic py-2">
          No changes were needed
        </p>
      )}

      {hasResult && !isIdentical && notes.length > 0 && (
        <ol className="list-none p-0 divide-y divide-line text-[13px] font-ui">
          {notes.map((note, idx) => (
            <li key={idx} className="py-2.5 first:pt-0">
              <strong className="block font-semibold text-ink mb-0.5">
                {note.title}
              </strong>
              <span className="text-muted leading-relaxed block">
                {note.detail}
              </span>
            </li>
          ))}
        </ol>
      )}

      {/* Sentence length (words) Rhythm Chart */}
      {hasResult && original && rewriteText && (
        <RhythmChart originalText={original} rewriteText={rewriteText} />
      )}
    </aside>
  );
}
