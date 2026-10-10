import Dexie, { type EntityTable } from "dexie";
import { type VoiceProfile } from "./voice/types";
export type { VoiceProfile };
import { type EditStrength, type RewriteNote } from "./rewrite-client";

export interface HistoryStats {
  originalWords: number;
  rewriteWords: number;
  stockRemoved: number;
  readingTimeSec: number;
}

export interface HistoryEntry {
  id: string;
  createdAt: number;
  original: string;
  rewrite: string;
  strength: EditStrength;
  voiceName: string;
  notes: RewriteNote[];
  stats: HistoryStats;
}

export class ImHumanDatabase extends Dexie {
  voices!: EntityTable<VoiceProfile, "id">;
  history!: EntityTable<HistoryEntry, "id">;

  constructor() {
    super("imhuman");
    this.version(1).stores({
      voices: "id, name, createdAt, updatedAt",
    });
    this.version(2).stores({
      voices: "id, name, createdAt, updatedAt",
      history: "id, createdAt",
    });
  }
}

let dbInstance: ImHumanDatabase | null = null;

export function getDb(): ImHumanDatabase | null {
  if (typeof window === "undefined") return null;
  if (!isStorageAvailable()) return null;
  if (!dbInstance) {
    try {
      dbInstance = new ImHumanDatabase();
    } catch {
      return null;
    }
  }
  return dbInstance;
}

export function isStorageAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return Boolean(window.indexedDB);
  } catch {
    return false;
  }
}

export async function getAllVoicesSafe(): Promise<VoiceProfile[]> {
  const db = getDb();
  if (!db) return [];
  try {
    return await db.voices.orderBy("createdAt").toArray();
  } catch (err) {
    console.error("Failed to fetch voices from IndexedDB:", err);
    return [];
  }
}

export async function getVoiceSafe(id: string): Promise<VoiceProfile | undefined> {
  const db = getDb();
  if (!db) return undefined;
  try {
    return await db.voices.get(id);
  } catch (err) {
    console.error("Failed to fetch voice by id:", err);
    return undefined;
  }
}

export async function saveVoiceSafe(voice: VoiceProfile): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  try {
    await db.voices.put(voice);
    return true;
  } catch (err) {
    console.error("Failed to save voice:", err);
    return false;
  }
}

export async function deleteVoiceSafe(id: string): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  try {
    await db.voices.delete(id);
    return true;
  } catch (err) {
    console.error("Failed to delete voice:", err);
    return false;
  }
}
