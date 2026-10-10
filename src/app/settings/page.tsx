"use client";

import * as React from "react";
import { z } from "zod";
import { AlertTriangle, Download, Upload, Trash2, Sun, Shield, ArrowRight } from "lucide-react";
import { Segmented } from "@/components/ui/segmented";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { getDb, getAllVoicesSafe, saveVoiceSafe, type VoiceProfile, type HistoryEntry } from "@/lib/db";
import { getAllHistorySafe, saveHistorySafe } from "@/lib/history";
import { toast } from "@/lib/toast";

const THEME_OPTIONS = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
] as const;

const BackupSchema = z.object({
  version: z.number(),
  voices: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      createdAt: z.number(),
      updatedAt: z.number(),
      samples: z.array(z.any()),
      metrics: z.any(),
      descriptor: z.string(),
    })
  ).optional().default([]),
  history: z.array(
    z.object({
      id: z.string(),
      createdAt: z.number(),
      original: z.string(),
      rewrite: z.string(),
      strength: z.any(),
      voiceName: z.string(),
      notes: z.array(z.any()),
      stats: z.any(),
    })
  ).optional().default([]),
});

export default function SettingsPage() {
  const [theme, setTheme] = React.useState<"system" | "light" | "dark">("system");

  // Delete all dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = React.useState("");
  const [importError, setImportError] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    try {
      const storedTheme = localStorage.getItem("imhuman-theme");
      if (storedTheme === "light" || storedTheme === "dark") {
        setTheme(storedTheme);
      } else {
        setTheme("system");
      }
    } catch {
      setTheme("system");
    }
  }, []);

  const handleThemeChange = (newTheme: "system" | "light" | "dark") => {
    setTheme(newTheme);
    try {
      if (newTheme === "system") {
        localStorage.removeItem("imhuman-theme");
        document.documentElement.removeAttribute("data-theme");
      } else {
        localStorage.setItem("imhuman-theme", newTheme);
        document.documentElement.setAttribute("data-theme", newTheme);
      }
    } catch (err) {
      console.error("Failed to persist theme:", err);
    }
  };

  const handleExport = async () => {
    try {
      const voices = await getAllVoicesSafe();
      const history = await getAllHistorySafe();

      const backupData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        voices,
        history,
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `imhuman-data-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: "Data exported", description: "All voices and history downloaded." });
    } catch (err) {
      console.error("Export failed:", err);
      toast({ title: "Export failed", description: "Could not complete data export." });
    }
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    try {
      const text = await file.text();
      let rawJson: unknown;
      try {
        rawJson = JSON.parse(text);
      } catch {
        setImportError("Selected file is not valid JSON.");
        return;
      }

      const parsed = BackupSchema.safeParse(rawJson);
      if (!parsed.success) {
        setImportError("File format does not match I’m human backup schema.");
        return;
      }

      const db = getDb();
      if (!db) {
        setImportError("Storage unavailable in this browser session.");
        return;
      }

      const existingVoices = await getAllVoicesSafe();
      const existingVoiceIds = new Set(existingVoices.map((v) => v.id));

      const existingHist = await getAllHistorySafe();
      const existingHistIds = new Set(existingHist.map((h) => h.id));

      let importedVoicesCount = 0;
      for (const voice of parsed.data.voices) {
        if (!existingVoiceIds.has(voice.id)) {
          await saveVoiceSafe(voice as VoiceProfile);
          importedVoicesCount++;
        }
      }

      let importedHistCount = 0;
      for (const entry of parsed.data.history) {
        if (!existingHistIds.has(entry.id)) {
          await saveHistorySafe(entry as HistoryEntry);
          importedHistCount++;
        }
      }

      toast({
        title: "Import complete",
        description: `Imported ${importedVoicesCount} new voices and ${importedHistCount} history entries.`,
      });

      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error("Import error:", err);
      setImportError("Failed to parse and import backup file.");
    }
  };

  const handleDeleteAllLocalData = async () => {
    if (deleteConfirmText.trim().toLowerCase() !== "delete") return;

    try {
      const db = getDb();
      if (db) {
        await db.voices.clear();
        await db.history.clear();
      }

      localStorage.removeItem("imhuman-draft");
      localStorage.removeItem("imhuman-theme");
      localStorage.removeItem(["imhuman", "groq", "key"].join("-"));
      document.documentElement.removeAttribute("data-theme");

      setDeleteDialogOpen(false);
      setDeleteConfirmText("");

      toast({
        title: "All local data deleted",
        description: "Voices, history, drafts, and preferences have been removed.",
      });
    } catch (err) {
      console.error("Delete all failed:", err);
    }
  };

  return (
    <div className="py-6 md:py-10 max-w-3xl mx-auto font-ui">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[24px] font-bold text-ink tracking-tight">Settings</h1>
        <p className="text-[14.5px] text-muted mt-1 leading-relaxed">
          Manage appearance, data privacy, and backups.
        </p>
      </div>

      <div className="divide-y divide-line border-y border-line">
        {/* Section 1: Appearance */}
        <section className="py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-[15px] font-semibold text-ink flex items-center gap-2">
              <Sun size={16} />
              Appearance
            </h2>
            <p className="text-[13px] text-muted mt-0.5">
              Choose your preferred interface theme.
            </p>
          </div>
          <div>
            <Segmented
              id="theme-select"
              aria-label="Appearance theme"
              options={THEME_OPTIONS}
              value={theme}
              onChange={(val) => handleThemeChange(val as "system" | "light" | "dark")}
            />
          </div>
        </section>

        {/* Section 2: How your text is handled */}
        <section className="py-6 space-y-2">
          <h2 className="text-[15px] font-semibold text-ink flex items-center gap-2">
            <Shield size={16} />
            How your text is handled
          </h2>
          <p className="text-[13.5px] text-muted leading-relaxed max-w-2xl">
            When you press Rewrite, your text and a short style summary are sent to Groq to produce the rewrite. This app doesn’t store your text on a server or keep logs of it. Your history and voices are saved in this browser only. Groq’s own handling of data depends on its terms, so don’t paste anything confidential.
          </p>
          <div className="pt-1">
            <a
              href="https://groq.com/privacy-policy/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] text-accent hover:underline font-medium inline-flex items-center gap-1.5"
            >
              <span>View Groq Privacy Policy</span>
              <ArrowRight size={13} aria-hidden="true" />
            </a>
          </div>
        </section>

        {/* Section 3: Your data (Export, Import, Delete) */}
        <section className="py-6 space-y-4">
          <div>
            <h2 className="text-[15px] font-semibold text-ink">Your data</h2>
            <p className="text-[13px] text-muted mt-0.5">
              Export your custom voices and history to a backup file, import previously saved data, or erase all local information.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleExport}
              className="gap-1.5"
            >
              <Download size={14} />
              <span>Export everything</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="gap-1.5"
            >
              <Upload size={14} />
              <span>Import backup</span>
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileImport}
              className="hidden"
              aria-label="Upload JSON backup file"
            />

            <Button
              type="button"
              variant="quiet"
              size="sm"
              onClick={() => {
                setDeleteConfirmText("");
                setDeleteDialogOpen(true);
              }}
              className="text-del hover:text-del gap-1.5 ml-auto"
            >
              <Trash2 size={14} />
              <span>Delete all local data</span>
            </Button>
          </div>

          {importError && (
            <p role="alert" className="text-[13px] text-del flex items-center gap-1.5 pt-1">
              <AlertTriangle size={13} />
              {importError}
            </p>
          )}
        </section>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete all local data</DialogTitle>
            <DialogDescription>
              This permanently removes all voices, rewrite history, drafts, and theme settings stored in this browser.
            </DialogDescription>
          </DialogHeader>

          <div className="my-3 space-y-2">
            <label htmlFor="delete-confirm-input" className="text-[13px] text-ink block font-medium">
              Type <strong className="text-del font-mono">delete</strong> to confirm:
            </label>
            <input
              id="delete-confirm-input"
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="delete"
              className="w-full h-9 px-3 rounded-[6px] bg-panel border border-line text-[13.5px] text-ink font-mono outline-none focus-visible:ring-1 focus-visible:ring-del"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              disabled={deleteConfirmText.trim().toLowerCase() !== "delete"}
              onClick={handleDeleteAllLocalData}
              className="bg-del hover:brightness-110 text-white disabled:opacity-40"
            >
              Delete all data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
