import Link from "next/link";
import { Plus, AlertTriangle, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

const severityVariant = (s: string): "danger" | "warning" | "info" | "default" => {
  if (s === "critical" || s === "high") return "danger";
  if (s === "medium") return "warning";
  return "info";
};

const statusVariant = (s: string): "success" | "warning" | "info" | "default" => {
  if (s === "resolved" || s === "closed") return "success";
  if (s === "reviewing") return "info";
  return "warning";
};

const severityLabel: Record<string, string> = {
  critical: "Critic",
  high: "Ridicat",
  medium: "Mediu",
  low: "Scăzut",
};

const statusLabel: Record<string, string> = {
  open: "Deschis",
  reviewing: "În analiză",
  resolved: "Rezolvat",
  closed: "Închis",
};

function fmtRo(ts: string) {
  return new Date(ts).toLocaleDateString("ro-RO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const severityDot: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-amber-500",
  low: "bg-surface-500",
};

const severityBorder: Record<string, string> = {
  critical: "border-l-red-500",
  high: "border-l-orange-500",
  medium: "border-l-amber-500",
  low: "border-l-surface-600",
};

export default async function IncidentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();

  const isAdmin = profile?.role === "admin";

  const query = supabase
    .from("incidents")
    .select("id, title, severity, status, locked, has_damage, created_at, driver_id")
    .order("created_at", { ascending: false })
    .limit(100);

  if (!isAdmin) query.eq("driver_id", user.id);

  const { data: incidents } = await query;

  const openCount = incidents?.filter((i) => i.status === "open").length ?? 0;

  return (
    <div className="flex flex-col gap-5 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Incidente</h1>
          {incidents && incidents.length > 0 && (
            <p className="text-xs text-surface-400 mt-0.5">
              {isAdmin
                ? `${openCount} deschise · ${incidents.length} total`
                : `${incidents.length} raportate`}
            </p>
          )}
        </div>
        <Link href="/incidents/new">
          <Button size="sm" variant="danger">
            <Plus className="w-4 h-4" />
            Raportează
          </Button>
        </Link>
      </div>

      {!incidents?.length ? (
        <Card className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface-700 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-surface-500" />
          </div>
          <div>
            <p className="font-semibold text-white">Niciun incident raportat</p>
            <p className="text-sm text-surface-400 mt-1">Drum bun!</p>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {incidents.map((inc) => (
            <Link key={inc.id} href={`/incidents/${inc.id}`}>
              <Card
                noPadding
                className={[
                  "flex items-center gap-3 pl-0 pr-4 py-4",
                  "border-l-4 overflow-hidden",
                  severityBorder[inc.severity] ?? "border-l-surface-600",
                  "hover:border-opacity-80 active:scale-[0.99] transition-all cursor-pointer",
                ].join(" ")}
              >
                {/* Severity color bar (left accent) */}
                <div className="pl-4 flex-shrink-0">
                  <div className={["w-2.5 h-2.5 rounded-full", severityDot[inc.severity] ?? "bg-surface-500"].join(" ")} />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <p className="font-semibold text-white text-sm truncate">
                      {inc.title || "Incident fără titlu"}
                    </p>
                    {inc.locked && (
                      <Lock className="w-3 h-3 text-surface-500 flex-shrink-0" />
                    )}
                    {inc.has_damage && (
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-surface-400 mt-0.5">{fmtRo(inc.created_at)}</p>
                </div>

                {/* Badges */}
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <Badge variant={severityVariant(inc.severity)}>
                    {severityLabel[inc.severity] ?? inc.severity}
                  </Badge>
                  <Badge variant={statusVariant(inc.status)}>
                    {statusLabel[inc.status] ?? inc.status}
                  </Badge>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
