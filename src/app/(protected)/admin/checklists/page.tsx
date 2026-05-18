import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { ChecklistsExportWrapper } from "./ChecklistsExportWrapper";
import {
  ClipboardList,
  Lock,
  Truck,
  ImageOff,
  Clock,
  MapPinOff,
  CheckCircle2,
  Circle,
  ShieldAlert,
} from "lucide-react";

interface PageProps {
  searchParams: Promise<{
    driver?: string;
    vehicle?: string;
    date?: string;
    status?: string;
    fraud?: string;
    q?: string;
  }>;
}

export default async function AdminChecklistsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  // ── Fetch filter options ─────────────────────────────────────────────────
  const [{ data: drivers }, { data: vehicles }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("role", "driver")
      .order("full_name"),
    supabase.from("vehicles").select("id, plate_number, model").order("plate_number"),
  ]);

  // ── Build checklists query ────────────────────────────────────────────────
  let query = supabase
    .from("checklists")
    .select(
      `id, driver_id, vehicle_id, status, locked, gps_lat, gps_lng,
       created_at, submitted_at,
       vehicles(plate_number, model),
       profiles(full_name, email)`
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (params.driver) query = query.eq("driver_id", params.driver);
  if (params.vehicle) query = query.eq("vehicle_id", params.vehicle);
  if (params.status) query = query.eq("status", params.status);
  if (params.date) {
    const start = `${params.date}T00:00:00`;
    const end = `${params.date}T23:59:59`;
    query = query.gte("created_at", start).lte("created_at", end);
  }

  const { data: rawChecklists } = await query;
  const checklists = rawChecklists ?? [];

  // ── Fetch photo counts for displayed checklists ─────────────────────────
  const ids = checklists.map((c) => c.id);
  let photosByChecklist: Record<string, number> = {};
  if (ids.length) {
    const { data: photos } = await supabase
      .from("checklist_photos")
      .select("checklist_id")
      .in("checklist_id", ids);
    for (const p of photos ?? []) {
      photosByChecklist[p.checklist_id] = (photosByChecklist[p.checklist_id] ?? 0) + 1;
    }
  }

  // ── Annotate fraud signals ────────────────────────────────────────────────
  type Checklist = typeof checklists[0] & {
    fraudFlags: { missingPhotos: boolean; lateSubmission: boolean; gpsMissing: boolean };
    photoCount: number;
  };

  const annotated: Checklist[] = checklists.map((c) => {
    const photoCount = photosByChecklist[c.id] ?? 0;
    const isSubmitted = c.status === "submitted";
    const submissionHours = c.submitted_at
      ? (new Date(c.submitted_at).getTime() - new Date(c.created_at).getTime()) / 3_600_000
      : 0;
    return {
      ...c,
      photoCount,
      fraudFlags: {
        missingPhotos: isSubmitted && photoCount === 0,
        lateSubmission: isSubmitted && submissionHours > 2,
        gpsMissing: isSubmitted && c.gps_lat === null,
      },
    };
  });

  // ── Apply fraud filter ────────────────────────────────────────────────────
  let filtered = annotated;
  if (params.fraud === "missing_photos") filtered = annotated.filter((c) => c.fraudFlags.missingPhotos);
  if (params.fraud === "late_submissions") filtered = annotated.filter((c) => c.fraudFlags.lateSubmission);
  if (params.fraud === "gps_missing") filtered = annotated.filter((c) => c.fraudFlags.gpsMissing);
  if (params.fraud === "1") filtered = annotated.filter((c) =>
    c.fraudFlags.missingPhotos || c.fraudFlags.lateSubmission || c.fraudFlags.gpsMissing
  );

  // ── Apply text search (driver name, vehicle plate/model) ─────────────────
  if (params.q) {
    const q = params.q.toLowerCase();
    filtered = filtered.filter((c) => {
      const driver = c.profiles as { full_name: string; email: string } | null;
      const vehicle = c.vehicles as { plate_number: string; model: string } | null;
      return (
        (driver?.full_name ?? "").toLowerCase().includes(q) ||
        (driver?.email ?? "").toLowerCase().includes(q) ||
        (vehicle?.plate_number ?? "").toLowerCase().includes(q) ||
        (vehicle?.model ?? "").toLowerCase().includes(q)
      );
    });
  }

  // ── Prepare filter options ────────────────────────────────────────────────
  const driverOptions = (drivers ?? []).map((d) => ({
    value: d.id,
    label: d.full_name || d.email,
  }));
  const vehicleOptions = (vehicles ?? []).map((v) => ({
    value: v.id,
    label: `${v.plate_number} (${v.model})`,
  }));

  // ── Export data ───────────────────────────────────────────────────────────
  const exportData = filtered.map((c) => {
    const driver = c.profiles as { full_name: string; email: string } | null;
    const vehicle = c.vehicles as { plate_number: string; model: string } | null;
    return {
      id: c.id,
      driver: driver?.full_name ?? driver?.email ?? "—",
      vehicle: vehicle?.plate_number ?? "—",
      vehicle_model: vehicle?.model ?? "—",
      status: c.status,
      locked: c.locked ? "Yes" : "No",
      photos: c.photoCount,
      gps_captured: c.gps_lat !== null ? "Yes" : "No",
      created_at: c.created_at,
      submitted_at: c.submitted_at ?? "—",
      flag_missing_photos: c.fraudFlags.missingPhotos ? "⚠️" : "",
      flag_late_submission: c.fraudFlags.lateSubmission ? "⚠️" : "",
      flag_gps_missing: c.fraudFlags.gpsMissing ? "⚠️" : "",
    };
  });

  // Fraud summary counts
  const fraudCounts = {
    missingPhotos: annotated.filter((c) => c.fraudFlags.missingPhotos).length,
    lateSubmissions: annotated.filter((c) => c.fraudFlags.lateSubmission).length,
    gpsMissing: annotated.filter((c) => c.fraudFlags.gpsMissing).length,
  };

  const totalFraud = fraudCounts.missingPhotos + fraudCounts.lateSubmissions + fraudCounts.gpsMissing;
  const activeFraud = params.fraud ?? "";

  return (
    <div className="flex flex-col gap-5">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            Checklist-uri
            {totalFraud > 0 && (
              <Link
                href="/admin/checklists?fraud=1"
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/25
                  text-red-400 text-xs font-semibold hover:bg-red-500/25 transition-colors"
              >
                <ShieldAlert className="w-3 h-3" />
                {totalFraud} fraudă
              </Link>
            )}
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {filtered.length}{filtered.length !== annotated.length ? ` din ${annotated.length}` : ""} checklist-uri
          </p>
        </div>
        <ChecklistsExportWrapper data={exportData} />
      </div>

      {/* ── Fraud signal summary pills ── */}
      {totalFraud > 0 && (
        <div className="flex gap-2 flex-wrap">
          {fraudCounts.missingPhotos > 0 && (
            <Link
              href={activeFraud === "missing_photos" ? "/admin/checklists" : "/admin/checklists?fraud=missing_photos"}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors
                ${activeFraud === "missing_photos"
                  ? "bg-red-500/30 border-red-500/60 text-red-300"
                  : "bg-red-500/15 border-red-500/25 text-red-400 hover:bg-red-500/25"
                }`}
            >
              <ImageOff className="w-3 h-3" />
              {fraudCounts.missingPhotos} fără poze
            </Link>
          )}
          {fraudCounts.lateSubmissions > 0 && (
            <Link
              href={activeFraud === "late_submissions" ? "/admin/checklists" : "/admin/checklists?fraud=late_submissions"}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors
                ${activeFraud === "late_submissions"
                  ? "bg-amber-500/30 border-amber-500/60 text-amber-300"
                  : "bg-amber-500/15 border-amber-500/25 text-amber-400 hover:bg-amber-500/25"
                }`}
            >
              <Clock className="w-3 h-3" />
              {fraudCounts.lateSubmissions} trimiteri târzii
            </Link>
          )}
          {fraudCounts.gpsMissing > 0 && (
            <Link
              href={activeFraud === "gps_missing" ? "/admin/checklists" : "/admin/checklists?fraud=gps_missing"}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors
                ${activeFraud === "gps_missing"
                  ? "bg-orange-500/30 border-orange-500/60 text-orange-300"
                  : "bg-orange-500/15 border-orange-500/25 text-orange-400 hover:bg-orange-500/25"
                }`}
            >
              <MapPinOff className="w-3 h-3" />
              {fraudCounts.gpsMissing} GPS lipsă
            </Link>
          )}
        </div>
      )}

      {/* ── Filter bar ── */}
      <AdminFilterBar
        drivers={driverOptions}
        vehicles={vehicleOptions}
        showStatus
        showFraud
        showSearch
        statusOptions={[
          { value: "draft", label: "Ciornă" },
          { value: "submitted", label: "Trimis" },
        ]}
      />

      {/* ── List ── */}
      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-14 gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl bg-surface-700 flex items-center justify-center">
            <ClipboardList className="w-7 h-7 text-slate-500" />
          </div>
          <div>
            <p className="font-medium text-white">Niciun checklist găsit</p>
            <p className="text-sm text-slate-400 mt-1">Încearcă să ajustezi filtrele</p>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((c) => {
            const driver = c.profiles as { full_name: string; email: string } | null;
            const vehicle = c.vehicles as { plate_number: string; model: string } | null;
            const isSubmitted = c.status === "submitted";
            const hasFraud =
              c.fraudFlags.missingPhotos || c.fraudFlags.lateSubmission || c.fraudFlags.gpsMissing;

            return (
              <Link key={c.id} href={`/checklists/${c.id}`}>
                <Card
                  noPadding
                  className={`flex flex-col gap-0 hover:border-surface-600 active:scale-[0.99] transition-all cursor-pointer overflow-hidden
                    ${hasFraud ? "border-red-500/30" : ""}`}
                >
                  {/* Fraud banner */}
                  {hasFraud && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border-b border-red-500/20">
                      <span className="text-xs font-medium text-red-400 flex items-center gap-1.5">
                        {c.fraudFlags.missingPhotos && (
                          <>
                            <ImageOff className="w-3 h-3" /> Fără poze
                          </>
                        )}
                        {c.fraudFlags.lateSubmission && (
                          <>
                            {c.fraudFlags.missingPhotos && " · "}
                            <Clock className="w-3 h-3 ml-1" /> Târziu
                          </>
                        )}
                        {c.fraudFlags.gpsMissing && (
                          <>
                            {(c.fraudFlags.missingPhotos || c.fraudFlags.lateSubmission) && " · "}
                            <MapPinOff className="w-3 h-3 ml-1" /> Fără GPS
                          </>
                        )}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-3 px-4 py-3.5">
                    {/* Icon */}
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isSubmitted ? "bg-emerald-500/15" : "bg-surface-700"
                      }`}
                    >
                      {isSubmitted ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-400" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Truck className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                        <span className="font-semibold text-white text-sm">
                          {vehicle?.plate_number ?? "—"}
                        </span>
                        <span className="text-slate-500 text-xs">{vehicle?.model ?? ""}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">
                        {driver?.full_name ?? driver?.email ?? "—"} ·{" "}
                        {new Date(c.created_at).toLocaleDateString("ro-RO", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        } as Intl.DateTimeFormatOptions)}
                      </p>
                      {c.photoCount > 0 && (
                        <p className="text-xs text-slate-500 mt-0.5">{c.photoCount} {c.photoCount !== 1 ? "poze" : "poză"}</p>
                      )}
                    </div>

                    {/* Badges */}
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <Badge variant={isSubmitted ? "success" : "warning"}>
                        {isSubmitted ? "Trimis" : "Ciornă"}
                      </Badge>
                      {c.locked && (
                        <div className="flex items-center gap-1">
                          <Lock className="w-3 h-3 text-slate-500" />
                          <span className="text-xs text-slate-500">Blocat</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
