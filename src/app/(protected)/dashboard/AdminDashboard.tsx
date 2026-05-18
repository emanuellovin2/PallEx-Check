import Link from "next/link";
import {
  ClipboardList,
  AlertTriangle,
  Users,
  TrendingUp,
  ChevronRight,
  Plus,
  ImageOff,
  Clock,
  MapPinOff,
  Activity,
  Truck,
  ScrollText,
  ShieldAlert,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface LiveDriver {
  id: string;
  name: string;
  lastActivity: string | null;
  lastChecklist: {
    status: string;
    vehicle: { plate_number: string; model: string } | null;
    created_at: string;
  } | null;
}

interface ActivityItem {
  id: string;
  driverId: string;
  status: string;
  vehicle: { plate_number: string; model: string } | null;
  createdAt: string;
  submittedAt: string | null;
}

interface FraudSignals {
  missingPhotos: number;
  lateSubmissions: number;
  gpsMissing: number;
}

interface Props {
  name: string;
  checklistCount: number;
  incidentCount: number;
  driverCount: number;
  completionRate: number;
  fraudSignals: FraudSignals;
  liveActivity: LiveDriver[];
  activityFeed: ActivityItem[];
}

export function AdminDashboard({
  name,
  checklistCount,
  incidentCount,
  driverCount,
  completionRate,
  fraudSignals,
  liveActivity,
  activityFeed,
}: Props) {
  const totalFraud =
    fraudSignals.missingPhotos + fraudSignals.lateSubmissions + fraudSignals.gpsMissing;

  const stats = [
    {
      label: "Checklist-uri",
      value: checklistCount,
      icon: ClipboardList,
      color: "text-brand-400",
      bg: "bg-brand-500/10",
      href: "/admin/checklists",
    },
    {
      label: "Incidente deschise",
      value: incidentCount,
      icon: AlertTriangle,
      color: incidentCount > 0 ? "text-red-400" : "text-surface-400",
      bg: incidentCount > 0 ? "bg-red-500/10" : "bg-surface-700",
      href: "/admin/incidents",
    },
    {
      label: "Șoferi activi",
      value: driverCount,
      icon: Users,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      href: "/admin/drivers",
    },
    {
      label: "Rată completare",
      value: `${completionRate}%`,
      icon: TrendingUp,
      color: completionRate >= 80 ? "text-emerald-400" : completionRate >= 50 ? "text-amber-400" : "text-red-400",
      bg: completionRate >= 80 ? "bg-emerald-500/10" : completionRate >= 50 ? "bg-amber-500/10" : "bg-red-500/10",
      href: "/admin/checklists",
    },
  ];

  const quickLinks = [
    {
      href: "/admin/drivers/new",
      label: "Adaugă Șofer",
      icon: Users,
      color: "bg-emerald-600",
      description: "Cont nou șofer",
    },
    {
      href: "/admin/checklists",
      label: "Checklist-uri",
      icon: ClipboardList,
      color: "bg-brand-500",
      description: "Toate trimiterile",
    },
    {
      href: "/admin/incidents",
      label: "Incidente",
      icon: AlertTriangle,
      color: "bg-red-600",
      description: "Deschise & rezolvate",
    },
    {
      href: "/admin/audit-logs",
      label: "Audit Logs",
      icon: ScrollText,
      color: "bg-surface-600",
      description: "Trail complet activitate",
    },
  ];

  return (
    <div className="flex flex-col gap-5 animate-slide-up">
      {/* ── Greeting ── */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-surface-400 text-sm">{getTimeOfDay()}</p>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            {name.split(" ")[0]}
          </h1>
        </div>
        <Link href="/admin/drivers/new">
          <button className="flex items-center gap-1.5 h-10 px-4 rounded-xl bg-brand-500 active:bg-brand-700 transition-colors text-white text-sm font-semibold touch-manipulation">
            <Plus className="w-4 h-4" />
            Șofer nou
          </button>
        </Link>
      </div>

      {/* ── Fraud Alert Banner — shown ONLY when signals exist ── */}
      {totalFraud > 0 && (
        <Link href="/admin/checklists?fraud=1">
          <div className="rounded-2xl border border-red-500/50 bg-red-500/10 px-4 py-3.5 flex items-center gap-3 active:bg-red-500/20 transition-colors cursor-pointer ring-fraud">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="w-5 h-5 text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-red-300 text-sm">
                {totalFraud} semnal{totalFraud > 1 ? "e" : ""} de fraudă detectat{totalFraud > 1 ? "e" : ""}
              </p>
              <p className="text-xs text-red-400/70 mt-0.5">Apasă pentru a vedea detalii</p>
            </div>
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500 text-white text-sm font-black flex-shrink-0">
              {totalFraud > 9 ? "9+" : totalFraud}
            </span>
          </div>
        </Link>
      )}

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map(({ label, value, icon: Icon, color, bg, href }) => (
          <Link key={label} href={href}>
            <Card className="flex flex-col gap-3 hover:border-surface-600 active:scale-[0.99] transition-all cursor-pointer h-full">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <p className="text-2xl font-black text-white tracking-tight">{value}</p>
                <p className="text-xs text-surface-400 mt-0.5 leading-tight">{label}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* ── Fraud Signals detail ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-surface-500 uppercase tracking-widest flex items-center gap-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            Semnale Fraudă
          </h2>
          <Link href="/admin/checklists?fraud=1" className="text-xs text-brand-400 flex items-center gap-0.5">
            Vezi tot <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {totalFraud === 0 ? (
          <Card className="flex items-center gap-3 py-3.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Niciun semnal detectat</p>
              <p className="text-xs text-surface-400 mt-0.5">Toate checklist-urile sunt curate în ultimele 30 zile</p>
            </div>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {fraudSignals.missingPhotos > 0 && (
              <Link href="/admin/checklists?fraud=missing_photos">
                <Card
                  noPadding
                  className="flex items-center gap-3 px-4 py-3.5 border-red-500/30 hover:border-red-500/50 active:scale-[0.99] transition-all cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-red-500/15 flex items-center justify-center flex-shrink-0">
                    <ImageOff className="w-4 h-4 text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white">Poze lipsă</p>
                    <p className="text-xs text-surface-400 mt-0.5">Trimise fără dovezi foto</p>
                  </div>
                  <Badge variant="danger">{fraudSignals.missingPhotos}</Badge>
                </Card>
              </Link>
            )}

            {fraudSignals.lateSubmissions > 0 && (
              <Link href="/admin/checklists?fraud=late_submissions">
                <Card
                  noPadding
                  className="flex items-center gap-3 px-4 py-3.5 border-amber-500/30 hover:border-amber-500/50 active:scale-[0.99] transition-all cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white">Trimiteri târzii</p>
                    <p className="text-xs text-surface-400 mt-0.5">Trimise cu mai mult de 2h întârziere</p>
                  </div>
                  <Badge variant="warning">{fraudSignals.lateSubmissions}</Badge>
                </Card>
              </Link>
            )}

            {fraudSignals.gpsMissing > 0 && (
              <Link href="/admin/checklists?fraud=gps_missing">
                <Card
                  noPadding
                  className="flex items-center gap-3 px-4 py-3.5 border-orange-500/30 hover:border-orange-500/50 active:scale-[0.99] transition-all cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-orange-500/15 flex items-center justify-center flex-shrink-0">
                    <MapPinOff className="w-4 h-4 text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white">GPS neînregistrat</p>
                    <p className="text-xs text-surface-400 mt-0.5">Trimise fără date de locație</p>
                  </div>
                  <Badge variant="warning">{fraudSignals.gpsMissing}</Badge>
                </Card>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* ── Live Drivers Activity ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-surface-500 uppercase tracking-widest flex items-center gap-2">
            <Activity className="w-3.5 h-3.5" />
            Activitate șoferi
          </h2>
          <Link href="/admin/drivers" className="text-xs text-brand-400 flex items-center gap-0.5">
            Gestionează <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {liveActivity.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-8 text-center">
            <Users className="w-7 h-7 text-surface-600 mb-2" />
            <p className="text-sm text-surface-400">Niciun șofer înregistrat</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {liveActivity.map((driver) => {
              const statusInfo = getDriverStatus(driver.lastActivity);
              return (
                <Link key={driver.id} href={`/admin/drivers/${driver.id}`}>
                  <Card
                    noPadding
                    className="flex items-center gap-3 px-4 py-3.5 hover:border-surface-600 active:scale-[0.99] transition-all cursor-pointer"
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 rounded-xl bg-brand-500/15 flex items-center justify-center">
                        <Users className="w-4 h-4 text-brand-400" />
                      </div>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-surface-800 ${statusInfo.dot}`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{driver.name}</p>
                      {driver.lastChecklist ? (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Truck className="w-3 h-3 text-surface-500 flex-shrink-0" />
                          <span className="text-xs text-surface-400 truncate">
                            {driver.lastChecklist.vehicle?.plate_number ?? "—"} · {relativeTime(driver.lastActivity)}
                          </span>
                        </div>
                      ) : (
                        <p className="text-xs text-surface-500 mt-0.5">Nicio activitate</p>
                      )}
                    </div>
                    <Badge
                      variant={
                        statusInfo.label === "Activ" ? "success" :
                        statusInfo.label === "Inactiv" ? "warning" : "default"
                      }
                    >
                      {statusInfo.label}
                    </Badge>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Quick Actions ── */}
      <div>
        <h2 className="text-xs font-bold text-surface-500 uppercase tracking-widest mb-3">
          Acțiuni rapide
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {quickLinks.map(({ href, label, icon: Icon, color, description }) => (
            <Link key={href} href={href}>
              <Card
                noPadding
                className="flex flex-col gap-2.5 p-3.5 hover:border-surface-600 active:scale-[0.99] transition-all cursor-pointer h-full"
              >
                <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white leading-tight">{label}</p>
                  <p className="text-xs text-surface-400 mt-0.5">{description}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Recent Checklist Activity ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-surface-500 uppercase tracking-widest">
            Checklist-uri recente
          </h2>
          <Link href="/admin/checklists" className="text-xs text-brand-400 flex items-center gap-0.5">
            Vezi tot <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {activityFeed.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-10 text-center">
            <ClipboardList className="w-8 h-8 text-surface-600 mb-2" />
            <p className="text-surface-400 text-sm">Niciun checklist încă</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-1.5">
            {activityFeed.map((item) => (
              <Link key={item.id} href={`/checklists/${item.id}`}>
                <Card
                  noPadding
                  className="flex items-center gap-3 px-4 py-3 hover:border-surface-600 active:scale-[0.99] transition-all cursor-pointer"
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      item.status === "submitted" ? "bg-emerald-500/15" : "bg-surface-700"
                    }`}
                  >
                    {item.status === "submitted" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Circle className="w-4 h-4 text-surface-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">
                      {item.vehicle?.plate_number ?? "—"}{" "}
                      <span className="text-surface-500 font-normal text-xs">{item.vehicle?.model}</span>
                    </p>
                    <p className="text-xs text-surface-400 mt-0.5">{relativeTime(item.createdAt)}</p>
                  </div>
                  <Badge variant={item.status === "submitted" ? "success" : "warning"}>
                    {item.status === "submitted" ? "Trimis" : "Draft"}
                  </Badge>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "Bună dimineața,";
  if (h < 17) return "Bună ziua,";
  return "Bună seara,";
}

function getDriverStatus(lastActivity: string | null): { label: string; dot: string } {
  if (!lastActivity) return { label: "Offline", dot: "bg-surface-500" };
  const hoursAgo = (Date.now() - new Date(lastActivity).getTime()) / 3_600_000;
  if (hoursAgo < 1) return { label: "Activ", dot: "bg-emerald-400" };
  if (hoursAgo < 8) return { label: "Inactiv", dot: "bg-amber-400" };
  return { label: "Offline", dot: "bg-surface-500" };
}

function relativeTime(ts: string | null): string {
  if (!ts) return "Niciodată";
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Acum";
  if (mins < 60) return `${mins}m în urmă`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h în urmă`;
  const days = Math.floor(hours / 24);
  return `${days}z în urmă`;
}
