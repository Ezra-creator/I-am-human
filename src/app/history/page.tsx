"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { Search, Trash2, Copy, ExternalLink, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { getDb, isStorageAvailable, type HistoryEntry } from "@/lib/db";
import { deleteHistoryItemSafe, clearAllHistorySafe } from "@/lib/history";
import { useWorkspaceStore } from "@/lib/workspace-store";

function getDayGroupLabel(timestamp: number): string {
  const d = new Date(timestamp);
  const now = new Date();

  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  if (isToday) return "Today";

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return "Yesterday";

  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function HistoryPage() {
  const router = useRouter();
  const { restoreHistoryEntry } = useWorkspaceStore();

  const [mounted, setMounted] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [debouncedQuery, setDebouncedQuery] = React.useState("");
  const [clearDialogOpen, setClearDialogOpen] = React.useState(false);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Debounce search query
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim().toLowerCase());
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const db = React.useMemo(() => (mounted ? getDb() : null), [mounted]);
  const storageBlocked = mounted && !isStorageAvailable();

  const allEntries = useLiveQuery(
    async () => {
      if (!db) return [];
      return await db.history.orderBy("createdAt").reverse().toArray();
    },
    [db],
    []
  );

  const filteredEntries = React.useMemo(() => {
    if (!allEntries) return [];
    if (!debouncedQuery) return allEntries;
    return allEntries.filter(
      (entry) =>
        entry.original.toLowerCase().includes(debouncedQuery) ||
        entry.rewrite.toLowerCase().includes(debouncedQuery)
    );
  }, [allEntries, debouncedQuery]);

  // Group entries by day
  const groupedEntries = React.useMemo(() => {
    const groups: { label: string; items: HistoryEntry[] }[] = [];
    let currentLabel = "";
    let currentItems: HistoryEntry[] = [];

    for (const entry of filteredEntries) {
      const label = getDayGroupLabel(entry.createdAt);
      if (label !== currentLabel) {
        if (currentItems.length > 0) {
          groups.push({ label: currentLabel, items: currentItems });
        }
        currentLabel = label;
        currentItems = [entry];
      } else {
        currentItems.push(entry);
      }
    }
    if (currentItems.length > 0) {
      groups.push({ label: currentLabel, items: currentItems });
    }

    return groups;
  }, [filteredEntries]);

  const handleOpen = (entry: HistoryEntry) => {
    restoreHistoryEntry(entry);
    router.push("/");
  };

  const handleCopy = async (entry: HistoryEntry) => {
    try {
      await navigator.clipboard.writeText(entry.rewrite);
      setCopiedId(entry.id);
      setTimeout(() => setCopiedId(null), 1600);
    } catch (err) {
      console.error("Failed to copy rewrite:", err);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteHistoryItemSafe(id);
  };

  const handleClearAll = async () => {
    await clearAllHistorySafe();
    setClearDialogOpen(false);
  };

  return (
    <div className="py-6 md:py-10 max-w-4xl mx-auto font-ui">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[24px] font-bold text-ink tracking-tight">History</h1>
          <p className="text-[14.5px] text-muted mt-1 leading-relaxed">
            Your rewrites are saved in this browser only.
          </p>
        </div>

        {!storageBlocked && mounted && allEntries && allEntries.length > 0 && (
          <Button
            type="button"
            variant="quiet"
            size="sm"
            onClick={() => setClearDialogOpen(true)}
            className="text-del hover:text-del self-start sm:self-auto gap-1.5"
          >
            <Trash2 size={13} />
            <span>Clear all history</span>
          </Button>
        )}
      </div>

      {/* Blocked storage banner */}
      {storageBlocked && (
        <div
          role="alert"
          className="p-5 rounded-[10px] border border-line bg-panel flex items-start gap-3.5"
        >
          <AlertCircle className="w-5 h-5 text-muted shrink-0 mt-0.5" />
          <div>
            <h2 className="text-[15px] font-semibold text-ink">Storage blocked</h2>
            <p className="text-[13.5px] text-muted mt-1 leading-relaxed">
              Saving voices needs browser storage, which is blocked right now.
            </p>
          </div>
        </div>
      )}

      {/* Search Bar */}
      {!storageBlocked && mounted && allEntries && allEntries.length > 0 && (
        <div className="relative mb-6">
          <label htmlFor="history-search" className="sr-only">
            Search history
          </label>
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
          />
          <input
            id="history-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search original and rewrite text…"
            className="w-full h-10 pl-9 pr-4 rounded-[8px] bg-panel border border-line text-ink text-[14px] placeholder:text-muted/60 outline-none focus-visible:ring-1 focus-visible:ring-accent"
          />
        </div>
      )}

      {/* Empty State */}
      {!storageBlocked && mounted && allEntries && allEntries.length === 0 && (
        <div className="p-10 md:p-14 text-center rounded-[10px] border border-line bg-panel">
          <p className="text-[15px] text-muted leading-relaxed max-w-md mx-auto">
            Your rewrites will be listed here. They are saved in this browser only.
          </p>
        </div>
      )}

      {/* Empty Search State */}
      {!storageBlocked &&
        mounted &&
        allEntries &&
        allEntries.length > 0 &&
        filteredEntries.length === 0 && (
          <div className="p-10 text-center rounded-[10px] border border-line bg-panel">
            <p className="text-[14.5px] text-muted">Nothing matches that search.</p>
          </div>
        )}

      {/* Ledger list grouped by day */}
      {!storageBlocked && mounted && groupedEntries.length > 0 && (
        <div className="space-y-6">
          {groupedEntries.map((group) => (
            <div key={group.label} className="space-y-2">
              <h2 className="text-[12.5px] font-semibold text-muted uppercase tracking-wider px-1">
                {group.label}
              </h2>

              <div
                role="list"
                className="w-full bg-panel border border-line rounded-[10px] divide-y divide-line overflow-hidden"
              >
                {group.items.map((entry) => {
                  const preview =
                    entry.original.length > 90
                      ? entry.original.slice(0, 90).trim() + "…"
                      : entry.original;

                  const words =
                    entry.stats?.originalWords ?? entry.original.split(/\s+/).length;

                  const strengthLabel =
                    entry.strength === "light"
                      ? "Light"
                      : entry.strength === "full"
                      ? "Full rewrite"
                      : "Balanced";

                  return (
                    <div
                      key={entry.id}
                      role="listitem"
                      className="p-4 md:px-5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-bg/40 transition-colors"
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <p className="font-text text-[15.5px] text-ink leading-snug line-clamp-2">
                          {preview}
                        </p>
                        <p className="text-[12.5px] text-muted font-ui mt-1">
                          {strengthLabel} · {entry.voiceName} · {words} words
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0 self-end md:self-auto">
                        <Button
                          type="button"
                          variant="quiet"
                          size="sm"
                          onClick={() => handleOpen(entry)}
                          className="gap-1 h-8 px-2.5 text-muted hover:text-ink text-[12.5px]"
                          aria-label="Open rewrite in workspace"
                        >
                          <ExternalLink size={13} />
                          <span>Open</span>
                        </Button>

                        <Button
                          type="button"
                          variant="quiet"
                          size="sm"
                          onClick={() => handleCopy(entry)}
                          className="gap-1 h-8 px-2.5 text-muted hover:text-ink text-[12.5px]"
                          aria-label="Copy rewrite text"
                        >
                          <Copy size={13} />
                          <span>{copiedId === entry.id ? "Copied" : "Copy"}</span>
                        </Button>

                        <Button
                          type="button"
                          variant="quiet"
                          size="sm"
                          onClick={() => handleDelete(entry.id)}
                          className="gap-1 h-8 px-2 text-muted hover:text-del text-[12.5px]"
                          aria-label="Delete history entry"
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Clear All Confirmation Dialog */}
      <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Clear all history</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove all {allEntries?.length ?? 0} saved rewrites from this browser? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => setClearDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleClearAll}
              className="bg-del hover:brightness-110 text-white"
            >
              Clear all
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
