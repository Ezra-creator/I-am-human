import { getDb, isStorageAvailable, type HistoryEntry } from "./db";

export const MAX_HISTORY_ENTRIES = 200;

export async function saveHistorySafe(entry: HistoryEntry): Promise<boolean> {
  const db = getDb();
  if (!db) return false;

  try {
    await db.history.put(entry);

    // Enforce 200-entry cap: delete oldest entries beyond the cap
    const count = await db.history.count();
    if (count > MAX_HISTORY_ENTRIES) {
      const excess = count - MAX_HISTORY_ENTRIES;
      const oldestKeys = await db.history
        .orderBy("createdAt")
        .limit(excess)
        .primaryKeys();

      await db.history.bulkDelete(oldestKeys);
    }

    return true;
  } catch (err) {
    console.error("Failed to save history entry to IndexedDB:", err);
    return false;
  }
}

export async function getAllHistorySafe(): Promise<HistoryEntry[]> {
  const db = getDb();
  if (!db) return [];

  try {
    return await db.history.orderBy("createdAt").reverse().toArray();
  } catch (err) {
    console.error("Failed to fetch history entries from IndexedDB:", err);
    return [];
  }
}

export async function deleteHistoryItemSafe(id: string): Promise<boolean> {
  const db = getDb();
  if (!db) return false;

  try {
    await db.history.delete(id);
    return true;
  } catch (err) {
    console.error("Failed to delete history item:", err);
    return false;
  }
}

export async function clearAllHistorySafe(): Promise<boolean> {
  const db = getDb();
  if (!db) return false;

  try {
    await db.history.clear();
    return true;
  } catch (err) {
    console.error("Failed to clear history:", err);
    return false;
  }
}

export { isStorageAvailable, type HistoryEntry };
