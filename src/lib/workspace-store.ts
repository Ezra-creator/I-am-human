import { create } from "zustand";
import {
  type EditStrength,
  type RewriteResult,
  startRewrite,
} from "./rewrite-client";
import { getVoiceSafe, type HistoryEntry } from "./db";
import { saveHistorySafe } from "./history";
import { MIN_INPUT_CHARS, MAX_INPUT_CHARS, countWords } from "./limits";
import { countFlags } from "./flags";

const STORAGE_KEY = "imhuman-draft";

export interface WorkspaceDraft {
  original: string;
  strength: EditStrength;
  voiceId: string;
}

export interface WorkspaceState {
  original: string;
  strength: EditStrength;
  voiceId: string;
  status: "idle" | "running" | "done" | "error";
  result: RewriteResult | null;
  error: string | null;
  view: "tracked" | "clean";
  mode: "editing" | "reviewing";
  highlightTerm: string | null;
  abortController: AbortController | null;

  setOriginal: (original: string) => void;
  setStrength: (strength: EditStrength) => void;
  setVoiceId: (voiceId: string) => void;
  setView: (view: "tracked" | "clean") => void;
  setMode: (mode: "editing" | "reviewing") => void;
  setHighlightTerm: (term: string | null) => void;
  setStatus: (status: "idle" | "running" | "done" | "error") => void;
  setResult: (result: RewriteResult | null) => void;
  setError: (error: string | null) => void;
  clearOriginal: () => void;
  runRewrite: () => Promise<void>;
  stopRewrite: () => void;
  initFromStorage: () => void;
  restoreHistoryEntry: (entry: HistoryEntry) => void;
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function saveDraftToStorage(draft: WorkspaceDraft) {
  if (typeof window === "undefined") return;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // Ignore storage write errors (private mode, quota exceeded, etc.)
    }
  }, 400);
}

function loadDraftFromStorage(): Partial<WorkspaceDraft> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<WorkspaceDraft>;
  } catch {
    return null;
  }
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  original: "",
  strength: "balanced",
  voiceId: "neutral",
  status: "idle",
  result: null,
  error: null,
  view: "tracked",
  mode: "editing",
  highlightTerm: null,
  abortController: null,

  setOriginal: (original: string) => {
    set({ original, mode: "editing" });
    saveDraftToStorage({
      original,
      strength: get().strength,
      voiceId: get().voiceId,
    });
  },

  setStrength: (strength: EditStrength) => {
    set({ strength });
    saveDraftToStorage({
      original: get().original,
      strength,
      voiceId: get().voiceId,
    });
  },

  setVoiceId: (voiceId: string) => {
    set({ voiceId });
    saveDraftToStorage({
      original: get().original,
      strength: get().strength,
      voiceId,
    });
  },

  setView: (view: "tracked" | "clean") => {
    set({ view });
  },

  setMode: (mode: "editing" | "reviewing") => {
    set({ mode });
  },

  setHighlightTerm: (highlightTerm: string | null) => {
    set({ highlightTerm });
  },

  setStatus: (status) => {
    set({ status });
  },

  setResult: (result) => {
    set({ result });
  },

  setError: (error) => {
    set({ error });
  },

  clearOriginal: () => {
    set({ original: "" });
    saveDraftToStorage({
      original: "",
      strength: get().strength,
      voiceId: get().voiceId,
    });
  },

  runRewrite: async () => {
    const { original, voiceId, strength, status } = get();
    if (status === "running") return;

    const charCount = original.length;
    if (charCount < MIN_INPUT_CHARS || charCount > MAX_INPUT_CHARS) {
      return;
    }

    const controller = new AbortController();
    set({
      status: "running",
      error: null,
      abortController: controller,
    });

    try {
      let voicePayload:
        | { kind: "preset"; id: "neutral" | "conversational" }
        | { kind: "profile"; descriptor: string } =
        voiceId === "conversational"
          ? { kind: "preset", id: "conversational" }
          : { kind: "preset", id: "neutral" };

      if (voiceId !== "neutral" && voiceId !== "conversational") {
        const profile = await getVoiceSafe(voiceId);
        if (profile?.descriptor) {
          voicePayload = { kind: "profile", descriptor: profile.descriptor };
        }
      }

      const result = await startRewrite({
        original,
        voiceId,
        voice: voicePayload,
        strength,
        signal: controller.signal,
        onPartial: (partialRewrite) => {
          set({
            result: { rewrite: partialRewrite, notes: [] },
          });
        },
      });

      set({
        status: "done",
        result,
        mode: "reviewing",
        error: null,
        abortController: null,
      });

      // Auto-save successful rewrite to history (never on error or abort)
      try {
        let voiceName = "Neutral professional";
        if (voiceId === "conversational") {
          voiceName = "Casual conversational";
        } else if (voiceId !== "neutral") {
          const profile = await getVoiceSafe(voiceId);
          if (profile?.name) voiceName = profile.name;
        }

        const origWords = countWords(original);
        const rewWords = countWords(result.rewrite);
        const origFlags = countFlags(original);
        const rewFlags = countFlags(result.rewrite);

        const historyItem: HistoryEntry = {
          id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `hist-${Date.now()}`,
          createdAt: Date.now(),
          original,
          rewrite: result.rewrite,
          strength,
          voiceName,
          notes: result.notes,
          stats: {
            originalWords: origWords,
            rewriteWords: rewWords,
            stockRemoved: Math.max(0, origFlags - rewFlags),
            readingTimeSec: Math.max(1, Math.round(rewWords / 230)),
          },
        };

        saveHistorySafe(historyItem);
      } catch (saveErr) {
        console.error("Failed to auto-save history:", saveErr);
      }
    } catch (err: unknown) {
      if (controller.signal.aborted) {
        set({ status: "idle", abortController: null });
        return;
      }

      let message = "An unexpected error occurred while processing your rewrite.";
      if (err instanceof Error) {
        message = err.message;
      }

      set({
        status: "error",
        error: message,
        abortController: null,
      });
    }
  },

  stopRewrite: () => {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
    }
    set({ status: "idle", abortController: null });
  },

  restoreHistoryEntry: (entry: HistoryEntry) => {
    set({
      original: entry.original,
      strength: entry.strength,
      result: { rewrite: entry.rewrite, notes: entry.notes },
      status: "done",
      mode: "reviewing",
      error: null,
    });
  },

  initFromStorage: () => {
    const draft = loadDraftFromStorage();
    if (draft) {
      set({
        ...(draft.original !== undefined ? { original: draft.original } : {}),
        ...(draft.strength ? { strength: draft.strength } : {}),
        ...(draft.voiceId ? { voiceId: draft.voiceId } : {}),
      });
    }
  },
}));
