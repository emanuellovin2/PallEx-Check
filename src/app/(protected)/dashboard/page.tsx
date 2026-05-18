import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminDashboard } from "./AdminDashboard";
import { DriverDashboard } from "./DriverDashboard";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "driver";
  const name = profile?.full_name ?? user.email ?? "User";

  if (role === "admin") {
    // ── Core counts ──────────────────────────────────────────────────────────
    const [
      { count: checklistCount },
      { count: incidentCount },
      { count: driverCount },
      { data: allDrivers },
    ] = await Promise.all([
      supabase.from("checklists").select("*", { count: "exact", head: true }),
      supabase.from("incidents").select("*", { count: "exact", head: true }).eq("status", "open"),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "driver"),
      supabase.from("profiles").select("id, full_name, email").eq("role", "driver").order("full_name"),
    ]);

    // ── Fraud signal computation (last 30 days) ──────────────────────────────
    const since30d = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
    const { data: submittedChecklists } = await supabase
      .from("checklists")
      .select("id, driver_id, vehicle_id, created_at, submitted_at, gps_lat, gps_lng")
      .eq("status", "submitted")
      .gte("created_at", since30d);

    const submitted = submittedChecklists ?? [];
    const submittedIds = submitted.map((c) => c.id);

    let photosByChecklist: Record<string, number> = {};
    if (submittedIds.length) {
      const { data: photos } = await supabase
        .from("checklist_photos")
        .select("checklist_id")
        .in("checklist_id", submittedIds);
      for (const p of photos ?? []) {
        photosByChecklist[p.checklist_id] = (photosByChecklist[p.checklist_id] ?? 0) + 1;
      }
    }

    const missingPhotosList = submitted.filter((c) => !photosByChecklist[c.id]);
    const lateSubmissionsList = submitted.filter((c) => {
      if (!c.submitted_at) return false;
      return (new Date(c.submitted_at).getTime() - new Date(c.created_at).getTime()) / 3_600_000 > 2;
    });
    const gpsMissingList = submitted.filter((c) => c.gps_lat === null);

    const fraudSignals = {
      missingPhotos: missingPhotosList.length,
      lateSubmissions: lateSubmissionsList.length,
      gpsMissing: gpsMissingList.length,
    };

    // ── Live driver activity ──────────────────────────────────────────────────
    const { data: recentChecklists } = await supabase
      .from("checklists")
      .select("id, driver_id, status, created_at, submitted_at, vehicles(plate_number, model)")
      .order("created_at", { ascending: false })
      .limit(100);

    const { data: recentIncidents } = await supabase
      .from("incidents")
      .select("id, driver_id, title, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    const lastActivityByDriver: Record<string, string> = {};
    for (const c of recentChecklists ?? []) {
      const ts = c.submitted_at ?? c.created_at;
      if (!lastActivityByDriver[c.driver_id] || ts > lastActivityByDriver[c.driver_id])
        lastActivityByDriver[c.driver_id] = ts;
    }
    for (const i of recentIncidents ?? []) {
      if (!lastActivityByDriver[i.driver_id] || i.created_at > lastActivityByDriver[i.driver_id])
        lastActivityByDriver[i.driver_id] = i.created_at;
    }

    const lastChecklistByDriver: Record<string, { status: string; vehicle: { plate_number: string; model: string } | null; created_at: string }> = {};
    for (const c of recentChecklists ?? []) {
      if (!lastChecklistByDriver[c.driver_id]) {
        lastChecklistByDriver[c.driver_id] = {
          status: c.status,
          vehicle: c.vehicles as { plate_number: string; model: string } | null,
          created_at: c.created_at,
        };
      }
    }

    const liveActivity = (allDrivers ?? []).map((d) => ({
      id: d.id,
      name: d.full_name || d.email,
      lastActivity: lastActivityByDriver[d.id] ?? null,
      lastChecklist: lastChecklistByDriver[d.id] ?? null,
    }));

    // ── Completion rate ───────────────────────────────────────────────────────
    const { count: submittedCount } = await supabase
      .from("checklists")
      .select("*", { count: "exact", head: true })
      .eq("status", "submitted");
    const completionRate =
      checklistCount && checklistCount > 0
        ? Math.round(((submittedCount ?? 0) / checklistCount) * 100)
        : 0;

    // ── Activity feed (most recent 8) ─────────────────────────────────────────
    const activityFeed = (recentChecklists ?? []).slice(0, 8).map((c) => ({
      id: c.id,
      driverId: c.driver_id,
      status: c.status,
      vehicle: c.vehicles as { plate_number: string; model: string } | null,
      createdAt: c.created_at,
      submittedAt: c.submitted_at,
    }));

    return (
      <AdminDashboard
        name={name}
        checklistCount={checklistCount ?? 0}
        incidentCount={incidentCount ?? 0}
        driverCount={driverCount ?? 0}
        completionRate={completionRate}
        fraudSignals={fraudSignals}
        liveActivity={liveActivity}
        activityFeed={activityFeed}
      />
    );
  }

  // Driver: get stats + assigned vehicle
  const [
    { count: checklistCount },
    { count: incidentCount },
    { data: vehicle },
  ] = await Promise.all([
    supabase
      .from("checklists")
      .select("*", { count: "exact", head: true })
      .eq("driver_id", user.id),
    supabase
      .from("incidents")
      .select("*", { count: "exact", head: true })
      .eq("driver_id", user.id),
    supabase
      .from("vehicles")
      .select("id, plate_number, model")
      .eq("assigned_driver_id", user.id)
      .single(),
  ]);

  return (
    <DriverDashboard
      name={name}
      checklistCount={checklistCount ?? 0}
      incidentCount={incidentCount ?? 0}
      vehicle={vehicle ?? null}
    />
  );
}
