"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/checklists");
  return { supabase, adminClient: createAdminClient() };
}

export async function deleteChecklist(checklistId: string) {
  const { adminClient } = await requireAdmin();

  // Delete photos from storage first
  const { data: photos } = await adminClient
    .from("checklist_photos")
    .select("url")
    .eq("checklist_id", checklistId);

  if (photos && photos.length > 0) {
    const paths = photos.map((p) => extractStoragePath(p.url, "checklist-photos")).filter(Boolean);
    if (paths.length > 0) {
      await adminClient.storage.from("checklist-photos").remove(paths);
    }
  }

  // Cascade delete via DB (photos row, checks row, then checklist)
  await adminClient.from("checklist_photos").delete().eq("checklist_id", checklistId);
  await adminClient.from("checklist_checks").delete().eq("checklist_id", checklistId);
  await adminClient.from("checklists").delete().eq("id", checklistId);

  redirect("/admin/checklists");
}

export async function setReviewStatus(checklistId: string, status: "verified" | "needs_review" | "pending") {
  const { adminClient } = await requireAdmin();

  await adminClient
    .from("checklists")
    .update({ review_status: status })
    .eq("id", checklistId);

  revalidatePath(`/checklists/${checklistId}`);
}

function extractStoragePath(url: string, bucket: string): string {
  const marker = `/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return "";
  return decodeURIComponent(url.slice(idx + marker.length).split("?")[0]);
}
