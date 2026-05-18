import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { IncidentsExportWrapper } from "./IncidentsExportWrapper";
import { AlertTriangle, Truck } from "lucide-react";

interface PageProps {
  searchParams: Promise<{
    driver?: string;
    vehicle?: string;
    date?: string;
    status?: string;
    severity?: string;
    q?: string;
  }>;
}

const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

const severityVariant = (s: string) => {
  if (s === "critical" || s === "high") return "danger";
  if (s === "medium") return "warning";
  return "default";
};

const statusVariant = (s: string) => {
  if (s === "open") return "danger";
  if (s === "reviewing") return "warning";
  if (s === "resolved" || s === "closed") return "success";
  return "default";
};

export default async function AdminIncidentsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  // ── Filter options ────────────────────────────────────────────────────────
  const [{ data: drivers }, { data: vehicles }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, email").eq("role", "driver").order("full_name"),
    supabase.from("vehicles").select("id, plate_number, model").order("plate_number"),
  ]);

  // ── Build query ───────────────────────────────────────────────────────────
  let query = supabase
    .from("incidents")
    .select(
      `id, driver_id, vehicle_id, title, description, severity, status,
       has_damage, locked, gps_lat, gps_lng, created_at, updated_at,
       vehicles(plate_number, model),
       profiles(full_name, email)`
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (params.driver) query = query.eq("driver_id", params.driver);
  if (params.vehicle) query = query.eq("vehicle_id", params.vehicle);
  if (params.status) query = query.eq("status", params.status);
  if (params.severity) query = query.eq("severity", params.severity);
  if (params.date) {
    query = query
      .gte("created_at", `${params.date}T00:00:00`)
      .lte("created_at", `${params.date}T23:59:59`);
  }

  const { data: rawIncidents } = await query;
  const incidents = rawIncidents ?? [];

  // ── Text search ───────────────────────────────────────────────────────────
  const filtered = params.q
    ? incidents.filter((i) =>
        i.title.toLowerCase().includes(params.q!.toLowerCase()) ||
        (i.description ?? "").toLowerCase().includes(params.q!.toLowerCase())
      )
    : incidents;

  // Sort by severity then date
  const sorted = [...filtered].sort((a, b) => {
    const sa = SEVERITY_ORDER[a.severity as keyof typeof SEVERITY_ORDER] ?? 99;
    const sb = SEVERITY_ORDER[b.severity as keyof typeof SEVERITY_ORDER] ?? 99;
    if (sa !== sb) return sa - sb;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // ── Export data ───────────────────────────────────────────────────────────
  const exportData = sorted.map((i) => {
    const driver = i.profiles as { full_name: string; email: string } | null;
    const vehicle = i.vehicles as { plate_number: string; model: string } | null;
    return {
      id: i.id,
      title: i.title,
      driver: driver?.full_name ?? driver?.email ?? "—",
      vehicle: vehicle?.plate_number ?? "—",
      severity: i.severity,
      status: i.status,
      has_damage: i.has_damage ? "Yes" : "No",
      locked: i.locked ? "Yes" : "No",
      gps_captured: i.gps_lat !== null ? "Yes" : "No",
      created_at: i.created_at,
      description: i.description ?? "",
    };
  });

  const driverOptions = (drivers ?? []).map((d) => ({ value: d.id, label: d.full_name || d.email }));
  const vehicleOptions = (vehicles ?? []).map((v) => ({
    value: v.id,
    label: `${v.plate_number} (${v.model})`,
  }));

  // Stats
  const openCount = incidents.filter((i) => i.status === "open").length;
  const criticalCount = incidents.filter(
    (i) => i.severity === "critical" || i.severity === "high"
  ).length;

  return (
    <div className="flex flex-col gap-5">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Incidents</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {sorted.length} shown · {openCount} open · {criticalCount} critical
          </p>
        </div>
        <IncidentsExportWrapper data={exportData} />
      </div>

      {/* ── Severity pills ── */}
      {criticalCount > 0 && (
        <div className="flex gap-2 flex-wrap">
          <Link
            href="/admin/incidents?severity=critical"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/15 border border-red-500/25
              text-red-400 text-xs font-medium hover:bg-red-500/25 transition-colors"
          >
            <AlertTriangle className="w-3 h-3" />
            {incidents.filter((i) => i.severity === "critical").length} critical
          </Link>
          <Link
            href="/admin/incidents?severity=high"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/15 border border-orange-500/25
              text-orange-400 text-xs font-medium hover:bg-orange-500/25 transition-colors"
          >
            {incidents.filter((i) => i.severity === "high").length} high
          </Link>
          <Link
            href="/admin/incidents?status=open"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/25
              text-amber-400 text-xs font-medium hover:bg-amber-500/25 transition-colors"
          >
            {openCount} open
          </Link>
        </div>
      )}

      {/* ── Filters ── */}
      <AdminFilterBar
        drivers={driverOptions}
        vehicles={vehicleOptions}
        showStatus
        showSeverity
        showSearch
        statusOptions={[
          { value: "open", label: "Open" },
          { value: "reviewing", label: "Reviewing" },
          { value: "resolved", label: "Resolved" },
          { value: "closed", label: "Closed" },
        ]}
      />

      {/* ── List ── */}
      {sorted.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-14 gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl bg-surface-700 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-slate-500" />
          </div>
          <div>
            <p className="font-medium text-white">No incidents found</p>
            <p className="text-sm text-slate-400 mt-1">Try adjusting filters</p>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {sorted.map((incident) => {
            const driver = incident.profiles as { full_name: string; email: string } | null;
            const vehicle = incident.vehicles as { plate_number: string; model: string } | null;
            const isCritical =
              incident.severity === "critical" || incident.severity === "high";

            return (
              <Link key={incident.id} href={`/incidents/${incident.id}`}>
                <Card
                  noPadding
                  className={`flex items-center gap-3 px-4 py-3.5 hover:border-surface-600
                    active:scale-[0.99] transition-all cursor-pointer
                    ${isCritical ? "border-red-500/30" : ""}`}
                >
                  {/* Icon */}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isCritical ? "bg-red-500/15" : "bg-amber-500/10"
                    }`}
                  >
                    <AlertTriangle
                      className={`w-5 h-5 ${isCritical ? "text-red-400" : "text-amber-400"}`}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm truncate">{incident.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-slate-400">{driver?.full_name ?? driver?.email ?? "—"}</span>
                      {vehicle && (
                        <>
                          <span className="text-slate-600 text-xs">·</span>
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <Truck className="w-3 h-3" />
                            {vehicle.plate_number}
                          </span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {new Date(incident.created_at).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      } as Intl.DateTimeFormatOptions)}
                    </p>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <Badge variant={severityVariant(incident.severity) as "danger" | "warning" | "default"}>
                      {incident.severity}
                    </Badge>
                    <Badge variant={statusVariant(incident.status) as "danger" | "warning" | "success" | "default"}>
                      {incident.status}
                    </Badge>
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
