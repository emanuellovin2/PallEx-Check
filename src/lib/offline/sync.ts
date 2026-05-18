import { createClient } from "@/lib/supabase/client";
import {
  getPendingChecklists,
  markSyncing,
  markSynced,
  markError,
  resetErrorsToPending,
  photoEntryToFile,
} from "./db";

const MAX_RETRIES = 3;

// ─── Upload a single photo to Supabase Storage ────────────────────────────────

async function uploadPhoto(
  supabase: ReturnType<typeof createClient>,
  file: File,
  driverId: string,
  checklistId: string,
  slot: string
): Promise<string | null> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${driverId}/${checklistId}/${slot}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from("checklist-photos")
    .upload(path, file, { upsert: false });
  if (error) return null;
  const { data } = supabase.storage.from("checklist-photos").getPublicUrl(path);
  return data.publicUrl;
}

// ─── Sync a single pending checklist ─────────────────────────────────────────

async function syncOne(
  supabase: ReturnType<typeof createClient>,
  item: Awaited<ReturnType<typeof getPendingChecklists>>[number]
): Promise<void> {
  await markSyncing(item.local_id);

  // 1. Create checklist row — local_id stored in device_info for idempotency
  const { data: checklist, error: clErr } = await supabase
    .from("checklists")
    .insert({
      driver_id: item.driver_id,
      vehicle_id: item.vehicle_id,
      gps_lat: item.gps_lat,
      gps_lng: item.gps_lng,
      status: "draft",
    })
    .select()
    .single();

  if (clErr || !checklist) {
    throw new Error(clErr?.message ?? "Failed to create checklist");
  }

  // 2. Upload photos
  const photoResults: { slot: string; url: string }[] = [];
  for (const entry of item.photos) {
    const file = photoEntryToFile(entry);
    const url = await uploadPhoto(supabase, file, item.driver_id, checklist.id, entry.slot);
    if (url) photoResults.push({ slot: entry.slot, url });
  }

  // 3. Insert photo metadata
  if (photoResults.length > 0) {
    await supabase.from("checklist_photos").insert(
      photoResults.map(({ slot, url }) => ({
        checklist_id: checklist.id,
        url,
        type: slot as "front" | "back" | "side" | "damage",
      }))
    );
  }

  // 4. Insert checklist_checks
  const { error: chkErr } = await supabase.from("checklist_checks").insert({
    checklist_id: checklist.id,
    ...item.safety,
    cargo_type: item.cargo_type || null,
    cargo_quantity: item.cargo_quantity,
    cargo_notes: item.cargo_notes,
    has_damage: item.has_damage,
    damage_description: item.has_damage ? item.damage_description : null,
    damage_voice_text: item.has_damage ? item.damage_voice_text : null,
  });

  if (chkErr) {
    // Clean up orphan checklist row
    await supabase.from("checklists").delete().eq("id", checklist.id);
    throw new Error(chkErr.message);
  }

  // 5. Submit → triggers auto-lock via DB trigger
  const { error: submitErr } = await supabase
    .from("checklists")
    .update({ status: "submitted" })
    .eq("id", checklist.id);

  if (submitErr) {
    throw new Error(submitErr.message);
  }

  // 6. Audit log — includes local_id so admin can trace offline submissions
  await supabase.rpc("log_audit", {
    p_action: "submit_checklist_offline_sync",
    p_entity: "checklists",
    p_entity_id: checklist.id,
    p_device_info: {
      local_id: item.local_id,
      offline_created_at: item.created_at,
      gps_captured: item.gps_lat !== null,
    },
  });

  await markSynced(item.local_id);
}

// ─── Public: sync all pending items ──────────────────────────────────────────

export interface SyncResult {
  synced: number;
  failed: number;
  skipped: number;
}

export async function syncPendingChecklists(): Promise<SyncResult> {
  // Reset previous errors so they get one more attempt
  await resetErrorsToPending();

  const pending = await getPendingChecklists();
  if (pending.length === 0) return { synced: 0, failed: 0, skipped: 0 };

  const supabase = createClient();
  let synced = 0;
  let failed = 0;
  let skipped = 0;

  for (const item of pending) {
    // Skip items that have exhausted retries
    if (item.retry_count >= MAX_RETRIES) {
      skipped++;
      continue;
    }

    try {
      await syncOne(supabase, item);
      synced++;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      await markError(item.local_id, message);
      failed++;
    }
  }

  return { synced, failed, skipped };
}
