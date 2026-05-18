import { openDB, type DBSchema, type IDBPDatabase } from "idb";

// ─── Schema ───────────────────────────────────────────────────────────────────

export type OfflineStatus = "pending" | "syncing" | "synced" | "error";

export interface PhotoEntry {
  slot: "front" | "back" | "side" | "damage";
  buffer: ArrayBuffer;
  name: string;
  type: string; // MIME type, e.g. "image/jpeg"
}

export interface PendingChecklist {
  /** UUID generated at wizard mount — idempotency key */
  local_id: string;
  driver_id: string;
  vehicle_id: string;
  vehicle_plate: string;
  vehicle_model: string;

  // GPS captured at submit time (null if denied)
  gps_lat: number | null;
  gps_lng: number | null;

  // Step data
  safety: Record<string, boolean>;
  cargo_type: string;
  cargo_quantity: number | null;
  cargo_notes: string | null;
  has_damage: boolean;
  damage_description: string | null;
  damage_voice_text: string | null;

  // Photos stored as ArrayBuffer so they survive IndexedDB serialization
  photos: PhotoEntry[];

  // Sync metadata
  status: OfflineStatus;
  created_at: string; // ISO timestamp
  synced_at: string | null;
  retry_count: number;
  error_message: string | null;
}

interface PallExDB extends DBSchema {
  pending_checklists: {
    key: string; // local_id
    value: PendingChecklist;
    indexes: { by_status: OfflineStatus };
  };
}

// ─── Singleton ────────────────────────────────────────────────────────────────

let _db: IDBPDatabase<PallExDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<PallExDB>> {
  if (_db) return _db;
  if (typeof indexedDB === "undefined") {
    throw new Error("IndexedDB nu este disponibil (mod privat sau browser nesuportat).");
  }
  _db = await openDB<PallExDB>("pallex-offline", 1, {
    upgrade(db) {
      const store = db.createObjectStore("pending_checklists", {
        keyPath: "local_id",
      });
      store.createIndex("by_status", "status");
    },
  });
  return _db;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export async function savePendingChecklist(
  item: Omit<PendingChecklist, "status" | "created_at" | "synced_at" | "retry_count" | "error_message">
): Promise<void> {
  const db = await getDB();
  await db.put("pending_checklists", {
    ...item,
    status: "pending",
    created_at: new Date().toISOString(),
    synced_at: null,
    retry_count: 0,
    error_message: null,
  });
}

export async function getPendingChecklists(): Promise<PendingChecklist[]> {
  const db = await getDB();
  return db.getAllFromIndex("pending_checklists", "by_status", "pending");
}

export async function countPending(): Promise<number> {
  const db = await getDB();
  return db.countFromIndex("pending_checklists", "by_status", "pending");
}

export async function markSyncing(local_id: string): Promise<void> {
  const db = await getDB();
  const item = await db.get("pending_checklists", local_id);
  if (!item) return;
  await db.put("pending_checklists", { ...item, status: "syncing" });
}

export async function markSynced(local_id: string): Promise<void> {
  const db = await getDB();
  const item = await db.get("pending_checklists", local_id);
  if (!item) return;
  await db.put("pending_checklists", {
    ...item,
    status: "synced",
    synced_at: new Date().toISOString(),
  });
}

export async function markError(local_id: string, message: string): Promise<void> {
  const db = await getDB();
  const item = await db.get("pending_checklists", local_id);
  if (!item) return;
  await db.put("pending_checklists", {
    ...item,
    status: "error",
    retry_count: item.retry_count + 1,
    error_message: message,
  });
}

export async function resetErrorsToPending(): Promise<void> {
  const db = await getDB();
  const errors = await db.getAllFromIndex("pending_checklists", "by_status", "error");
  const tx = db.transaction("pending_checklists", "readwrite");
  await Promise.all(
    errors.map((item) =>
      tx.store.put({ ...item, status: "pending", error_message: null })
    )
  );
  await tx.done;
}

/** Convert a File to a PhotoEntry for storage */
export async function fileToPhotoEntry(
  file: File,
  slot: PhotoEntry["slot"]
): Promise<PhotoEntry> {
  const buffer = await file.arrayBuffer();
  return { slot, buffer, name: file.name, type: file.type };
}

/** Reconstruct a File from a stored PhotoEntry */
export function photoEntryToFile(entry: PhotoEntry): File {
  return new File([entry.buffer], entry.name, { type: entry.type });
}
