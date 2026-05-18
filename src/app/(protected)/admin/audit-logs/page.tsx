import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AuditExportWrapper } from "./AuditExportWrapper";
import { ScrollText, User, Clock, Tag } from "lucide-react";

interface PageProps {
  searchParams: Promise<{
    driver?: string;
    date?: string;
    action?: string;
    entity?: string;
    q?: string;
  }>;
}

const ACTION_COLORS: Record<string, string> = {
  create: "text-emerald-400 bg-emerald-500/10",
  update: "text-brand-400 bg-brand-500/10",
  delete: "text-red-400 bg-red-500/10",
  submit: "text-amber-400 bg-amber-500/10",
  login: "text-slate-400 bg-surface-700",
  logout: "text-slate-400 bg-surface-700",
  lock: "text-purple-400 bg-purple-500/10",
  unlock: "text-purple-400 bg-purple-500/10",
  upload: "text-cyan-400 bg-cyan-500/10",
  export: "text-orange-400 bg-orange-500/10",
};

function actionStyle(action: string): string {
  const key = action.split("_")[0].toLowerCase();
  return ACTION_COLORS[key] ?? "text-slate-400 bg-surface-700";
}

export default async function AuditLogsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  // ── Fetch profiles (filter dropdown + userMap) and logs in parallel ──────
  let logsQuery = supabase
    .from("audit_logs")
    .select("id, user_id, action, entity, entity_id, device_info, timestamp")
    .order("timestamp", { ascending: false })
    .limit(500);
  if (params.driver) logsQuery = logsQuery.eq("user_id", params.driver);
  if (params.date) {
    logsQuery = logsQuery
      .gte("timestamp", `${params.date}T00:00:00`)
      .lte("timestamp", `${params.date}T23:59:59`);
  }
  if (params.action) logsQuery = logsQuery.ilike("action", `%${params.action}%`);
  if (params.entity) logsQuery = logsQuery.eq("entity", params.entity);

  type ProfileRow = { id: string; full_name: string; email: string; role: string };
  type LogRow = { id: string; user_id: string | null; action: string; entity: string; entity_id: string | null; device_info: Record<string, unknown> | null; timestamp: string };

  const [profilesResult, logsResult] = await Promise.all([
    supabase.from("profiles").select("id, full_name, email, role").order("full_name"),
    logsQuery,
  ]);
  const allProfiles = profilesResult.data as ProfileRow[] | null;
  const rawLogs = logsResult.data as LogRow[] | null;

  // ── User map: id → { name, role } ────────────────────────────────────────
  type ProfileInfo = { name: string; role: string };
  const userMap: Record<string, ProfileInfo> = {};
  for (const p of allProfiles ?? []) {
    userMap[p.id] = { name: p.full_name || p.email, role: p.role ?? "driver" };
  }

  const allLogs = rawLogs ?? [];

  // ── Text search — includes username ──────────────────────────────────────
  const logs = params.q
    ? allLogs.filter((l) => {
        const q = params.q!.toLowerCase();
        const userName = userMap[l.user_id ?? ""]?.name ?? "";
        return (
          l.action.toLowerCase().includes(q) ||
          l.entity.toLowerCase().includes(q) ||
          (l.entity_id ?? "").toLowerCase().includes(q) ||
          userName.toLowerCase().includes(q)
        );
      })
    : allLogs;

  // ── Entity unique values for filter ──────────────────────────────────────
  const entities = [...new Set(allLogs.map((l) => l.entity))].sort();

  // ── Export data ───────────────────────────────────────────────────────────
  const exportData = logs.map((l) => ({
    timestamp: l.timestamp,
    user: userMap[l.user_id ?? ""]?.name ?? l.user_id ?? "System",
    role: userMap[l.user_id ?? ""]?.role ?? "",
    action: l.action,
    entity: l.entity,
    entity_id: l.entity_id ?? "",
    device: l.device_info
      ? JSON.stringify(l.device_info)
          .replace(/"/g, "'")
          .slice(0, 100)
      : "",
  }));

  const driverOptions = (allProfiles ?? []).map((d) => ({ value: d.id, label: d.full_name || d.email }));

  // Stats
  const actionCounts: Record<string, number> = {};
  for (const l of allLogs) {
    const key = l.action.split("_")[0].toLowerCase();
    actionCounts[key] = (actionCounts[key] ?? 0) + 1;
  }

  return (
    <div className="flex flex-col gap-5">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-slate-400" />
            Audit Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {logs.length} entries · complete activity trail
          </p>
        </div>
        <AuditExportWrapper data={exportData} />
      </div>

      {/* ── Quick stats ── */}
      {allLogs.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {Object.entries(actionCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([action, count]) => (
              <span
                key={action}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-800 border border-surface-700 text-xs text-slate-400"
              >
                <Tag className="w-3 h-3" />
                {action}: {count}
              </span>
            ))}
        </div>
      )}

      {/* ── Filter bar ── */}
      <AdminFilterBar
        drivers={driverOptions}
        showSearch
      />

      {/* Entity filter inline */}
      {entities.length > 0 && (
        <div className="flex gap-2 flex-wrap -mt-2">
          {entities.map((entity) => (
            <a
              key={entity}
              href={`/admin/audit-logs?entity=${entity}`}
              className={`px-2.5 py-1 rounded-full text-xs border transition-colors
                ${params.entity === entity
                  ? "bg-brand-500/20 border-brand-500/40 text-brand-300"
                  : "bg-surface-800 border-surface-700 text-slate-400 hover:border-surface-600"
                }`}
            >
              {entity}
            </a>
          ))}
        </div>
      )}

      {/* ── Log list ── */}
      {logs.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-14 gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl bg-surface-700 flex items-center justify-center">
            <ScrollText className="w-7 h-7 text-slate-500" />
          </div>
          <div>
            <p className="font-medium text-white">No audit logs found</p>
            <p className="text-sm text-slate-400 mt-1">
              Actions are logged automatically as users interact with the app
            </p>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-1.5">
          {logs.map((log) => {
            const userInfo = userMap[log.user_id ?? ""];
            const userName = userInfo?.name ?? log.user_id?.slice(0, 8) ?? "System";
            const userRole = userInfo?.role ?? null;
            const style = actionStyle(log.action);
            const deviceInfo = log.device_info as Record<string, string | boolean | null> | null;

            return (
              <Card
                key={log.id}
                noPadding
                className="flex items-start gap-3 px-4 py-3.5"
              >
                {/* Action badge */}
                <div
                  className={`flex-shrink-0 px-2 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wide ${style} mt-0.5`}
                >
                  {log.action.split("_")[0]}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium">
                    {log.action}
                    {log.entity && (
                      <span className="text-slate-400 font-normal"> on </span>
                    )}
                    {log.entity && (
                      <span className="text-brand-300">{log.entity}</span>
                    )}
                  </p>

                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="flex items-center gap-1.5 text-xs text-slate-400">
                      <User className="w-3 h-3 flex-shrink-0" />
                      <span>{userName}</span>
                      {userRole && (
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide
                            ${userRole === "admin"
                              ? "bg-brand-500/15 text-brand-400"
                              : "bg-surface-700 text-slate-500"
                            }`}
                        >
                          {userRole}
                        </span>
                      )}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="w-3 h-3" />
                      {new Date(log.timestamp).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      } as Intl.DateTimeFormatOptions)}
                    </span>
                    {log.entity_id && (
                      <span className="text-xs text-slate-600 font-mono truncate max-w-[120px]">
                        #{log.entity_id.slice(0, 8)}…
                      </span>
                    )}
                  </div>

                  {/* Device info */}
                  {deviceInfo && Object.keys(deviceInfo).length > 0 && (
                    <div className="mt-1.5 flex gap-2 flex-wrap">
                      {deviceInfo.userAgent && (
                        <span className="text-xs text-slate-500 bg-surface-700 px-2 py-0.5 rounded truncate max-w-[200px]">
                          {String(deviceInfo.userAgent).slice(0, 60)}…
                        </span>
                      )}
                      {deviceInfo.ip && (
                        <span className="text-xs text-slate-500 bg-surface-700 px-2 py-0.5 rounded font-mono">
                          {String(deviceInfo.ip)}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Entity badge */}
                {log.entity && (
                  <Badge variant="info" className="flex-shrink-0 mt-0.5 text-xs">
                    {log.entity}
                  </Badge>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
