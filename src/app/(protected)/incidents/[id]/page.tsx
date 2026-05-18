import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  MapPin,
  Mic,
  Lock,
  AlertTriangle,
  Camera,
  Clock,
  User,
  Shield,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { IncidentStatusActions } from "./IncidentStatusActions";

// ── Helpers ─────────────────────────────────────────────────

const severityVariant = (
  s: string
): "danger" | "warning" | "info" | "default" => {
  if (s === "critical" || s === "high") return "danger";
  if (s === "medium") return "warning";
  return "info";
};

const statusVariant = (
  s: string
): "success" | "warning" | "info" | "default" => {
  if (s === "resolved" || s === "closed") return "success";
  if (s === "reviewing") return "info";
  return "warning";
};

function fmt(ts: string) {
  return new Date(ts).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Page ────────────────────────────────────────────────────

export default async function IncidentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";

  // Fetch incident
  const { data: incident } = await supabase
    .from("incidents")
    .select(
      `*,
       profiles:driver_id ( full_name, email ),
       vehicles:vehicle_id ( plate_number, model )`
    )
    .eq("id", id)
    .single();

  if (!incident) notFound();

  // Access check: driver can only see their own
  if (!isAdmin && incident.driver_id !== user.id) notFound();

  // Fetch photos
  const { data: photos } = await supabase
    .from("incident_photos")
    .select("id, path, created_at")
    .eq("incident_id", id)
    .order("created_at", { ascending: true });

  // Generate signed URLs for photos (1h expiry)
  const photoUrls: { id: string; url: string }[] = [];
  if (photos && photos.length > 0) {
    for (const photo of photos) {
      const { data: signed } = await supabase.storage
        .from("incident-photos")
        .createSignedUrl(photo.path, 3600);
      if (signed?.signedUrl) {
        photoUrls.push({ id: photo.id, url: signed.signedUrl });
      }
    }
  }

  // Fetch audit log entries for this incident (admin only)
  let auditLogs: Array<{
    id: string;
    action: string;
    timestamp: string;
    user_id: string | null;
    device_info: Record<string, unknown> | null;
  }> = [];

  if (isAdmin) {
    const { data: logs } = await supabase
      .from("audit_logs")
      .select("id, action, timestamp, user_id, device_info")
      .eq("entity", "incidents")
      .eq("entity_id", id)
      .order("timestamp", { ascending: false });
    auditLogs = logs ?? [];
  }

  const driver = incident.profiles as
    | { full_name: string; email: string }
    | undefined;
  const vehicle = incident.vehicles as
    | { plate_number: string; model: string }
    | undefined;

  return (
    <div className="flex flex-col gap-5 max-w-lg pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={isAdmin ? "/admin/incidents" : "/incidents"}>
            <button className="p-2 rounded-xl bg-surface-800 text-slate-400 hover:text-white transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white truncate max-w-[220px]">
              {incident.title}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">{fmt(incident.created_at)}</p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <Badge variant={severityVariant(incident.severity)}>
            {incident.severity}
          </Badge>
          <Badge variant={statusVariant(incident.status)}>
            {incident.status}
          </Badge>
        </div>
      </div>

      {/* Locked banner */}
      {incident.locked && (
        <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3 text-sm text-slate-400">
          <Lock className="w-4 h-4 text-slate-500 flex-shrink-0" />
          This report is <span className="text-white font-medium">locked</span> — no further edits are permitted.
        </div>
      )}

      {/* Admin status management */}
      {isAdmin && (
        <IncidentStatusActions
          incidentId={incident.id}
          currentStatus={incident.status as "open" | "reviewing" | "resolved" | "closed"}
        />
      )}

      {/* Damage flag */}
      {incident.has_damage && (
        <div className="flex items-center gap-2 rounded-xl border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-300">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          Damage reported
        </div>
      )}

      {/* Core details */}
      <Card className="flex flex-col gap-4">
        {/* Driver */}
        {isAdmin && driver && (
          <Row icon={<User className="w-4 h-4" />} label="Driver">
            {driver.full_name} · {driver.email}
          </Row>
        )}

        {/* Vehicle */}
        {vehicle && (
          <Row icon={<AlertTriangle className="w-4 h-4" />} label="Vehicle">
            {vehicle.plate_number} — {vehicle.model}
          </Row>
        )}

        {/* GPS */}
        {incident.gps_lat && incident.gps_lng ? (
          <Row icon={<MapPin className="w-4 h-4 text-emerald-400" />} label="GPS Location">
            <a
              href={`https://maps.google.com/?q=${incident.gps_lat},${incident.gps_lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-400 underline underline-offset-2 hover:text-brand-300"
            >
              {Number(incident.gps_lat).toFixed(5)},{" "}
              {Number(incident.gps_lng).toFixed(5)} — Open in Maps
            </a>
          </Row>
        ) : (
          <Row icon={<MapPin className="w-4 h-4 text-slate-600" />} label="GPS Location">
            <span className="text-slate-500">Not captured</span>
          </Row>
        )}

        {/* Description */}
        {incident.description && (
          <Row icon={<Clock className="w-4 h-4" />} label="Description">
            <p className="whitespace-pre-wrap">{incident.description}</p>
          </Row>
        )}

        {/* Voice transcript */}
        {incident.voice_text && (
          <Row icon={<Mic className="w-4 h-4 text-brand-400" />} label="Voice Transcript">
            <p className="italic text-slate-300">&ldquo;{incident.voice_text}&rdquo;</p>
          </Row>
        )}
      </Card>

      {/* Photos */}
      {photoUrls.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <Camera className="w-4 h-4" />
            Photos ({photoUrls.length})
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {photoUrls.map(({ id, url }) => (
              <a
                key={id}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="aspect-square rounded-xl overflow-hidden bg-surface-800 border border-surface-700 block"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt="Incident photo"
                  className="w-full h-full object-cover hover:opacity-80 transition-opacity"
                />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Audit Log (admin only) */}
      {isAdmin && auditLogs.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <Shield className="w-4 h-4 text-slate-400" />
            Audit Trail
          </h2>
          <Card noPadding className="divide-y divide-surface-700">
            {auditLogs.map((log) => (
              <div key={log.id} className="px-4 py-3 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white font-mono">
                    {log.action}
                  </span>
                  <span className="text-xs text-slate-500">{fmt(log.timestamp)}</span>
                </div>
                {log.device_info && (
                  <p className="text-xs text-slate-500 truncate">
                    {typeof log.device_info === "object" && log.device_info !== null
                      ? Object.entries(log.device_info)
                          .filter(([k]) =>
                            ["severity", "has_damage", "photo_count", "gps_lat", "gps_lng"].includes(k)
                          )
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(" · ")
                      : ""}
                  </p>
                )}
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}

// ── Helper component ────────────────────────────────────────

function Row({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 text-slate-500 flex-shrink-0">{icon}</div>
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
          {label}
        </span>
        <div className="text-sm text-slate-200">{children}</div>
      </div>
    </div>
  );
}
