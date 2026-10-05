"use client";

import * as React from "react";
import { useWorkspaceStore } from "@/lib/workspace-store";
import { cn } from "@/lib/utils";

export function NotesColumn() {
  const { result, status } = useWorkspaceStore();
  const hasResult = result !== null && status === "done";
  const notes = result?.notes ?? [];

  return (
    <aside
      aria-labelledby="h-notes"
      className={cn(
        "p-5 md:px-6 md:py-5 min-w-0 flex flex-col",
        "border-line border-t min-[1021px]:border-t-0 min-[1021px]:border-l",
        "max-[1020px]:col-span-full"
      )}
    >
      <h2
        id="h-notes"
        className="text-[13px] font-semibold text-muted font-ui min-h-[30px] flex items-center mb-3 select-none"
      >
        What changed
      </h2>

      {!hasResult || notes.length === 0 ? (
        <p className="text-[14px] text-muted font-ui leading-relaxed">
          Each edit is explained here after a rewrite.
        </p>
      ) : (
        <ol className="list-none p-0 divide-y divide-line text-[14px] font-ui">
          {notes.map((note, idx) => (
            <li key={idx} className="py-3 first:pt-0">
              <strong className="block font-semibold text-ink mb-0.5">
                {note.title}
              </strong>
              <span className="text-muted leading-relaxed">
                {note.detail}
              </span>
            </li>
          ))}
        </ol>
      )}

      {/* Sentence length (words) section placeholder region - stays hidden until result exists (Phase 5) */}
      <div
        className={cn("mt-5", !hasResult && "hidden")}
        aria-hidden={!hasResult ? "true" : undefined}
        data-region="sentence-length"
      >
        <h3 className="text-[13px] font-semibold text-muted font-ui mb-2.5">
          Sentence length (words)
        </h3>
      </div>
    </aside>
  );
}
