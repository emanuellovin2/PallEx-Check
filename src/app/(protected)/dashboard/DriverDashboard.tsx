import type { ReactNode } from "react";
import Link from "next/link";
import {
  Truck,
  Play,
  AlertTriangle,
  ClockIcon,
  LockIcon,
  ChevronRight,
} from "lucide-react";

interface Vehicle {
  id: string;
  plate_number: string;
  model: string;
}

interface Props {
  name: string;
  checklistCount: number;
  incidentCount: number;
  vehicle: Vehicle | null;
}

export function DriverDashboard({ name, checklistCount, incidentCount, vehicle }: Props) {
  const hasVehicle = !!vehicle;

  return (
    <div className="flex flex-col gap-5 animate-slide-up">
      {/* ── Greeting ── */}
      <div className="pt-1">
        <p className="text-surface-400 text-sm">{getGreeting()}</p>
        <h1 className="text-3xl font-extrabold text-white leading-tight mt-0.5 tracking-tight">
          {name.split(" ")[0]}
        </h1>
      </div>

      {/* ── Assigned Vehicle ── */}
      <div
        className={[
          "rounded-2xl p-4 flex items-center gap-4",
          hasVehicle
            ? "bg-emerald-500/10 border border-emerald-500/25"
            : "bg-surface-800 border border-surface-700 border-dashed",
        ].join(" ")}
      >
        <div
          className={[
            "w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0",
            hasVehicle ? "bg-emerald-500/20" : "bg-surface-700",
          ].join(" ")}
        >
          <Truck
            className={["w-7 h-7", hasVehicle ? "text-emerald-400" : "text-surface-500"].join(" ")}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-surface-500">
              Vehicul alocat
            </p>
            <LockIcon className="w-3 h-3 text-surface-600" />
          </div>
          {hasVehicle ? (
            <>
              <p className="text-2xl font-black text-white tracking-widest">{vehicle.plate_number}</p>
              <p className="text-sm text-surface-400 mt-0.5">{vehicle.model}</p>
            </>
          ) : (
            <>
              <p className="text-base font-semibold text-surface-300">Niciun vehicul alocat</p>
              <p className="text-xs text-surface-500 mt-0.5">Contactează managerul de flotă</p>
            </>
          )}
        </div>
      </div>

      {/* ── Primary CTA — full-width hero button ── */}
      {hasVehicle ? (
        <Link href="/checklists/new" className="block">
          <HeroButton
            icon={<Play className="w-8 h-8" />}
            label="Pornește Checklist"
            desc={`Inspecție vehicul · ${vehicle.plate_number}`}
            colorClass="bg-brand-500 active:bg-brand-700"
            shadowClass="shadow-xl shadow-brand-500/30"
          />
        </Link>
      ) : (
        <HeroButton
          icon={<Play className="w-8 h-8" />}
          label="Pornește Checklist"
          desc="Vehicul nealocat — contactează admin"
          colorClass="bg-surface-800 border border-surface-700 opacity-50"
          shadowClass=""
          disabled
        />
      )}

      {/* ── Secondary actions ── */}
      <div className="flex flex-col gap-3">
        <Link href="/incidents/new" className="block">
          <ActionRow
            icon={<AlertTriangle className="w-5 h-5" />}
            label="Raportează Incident"
            desc="Problemă vehicul sau traseu"
            iconBg="bg-red-500/15"
            iconColor="text-red-400"
          />
        </Link>

        <Link href="/checklists" className="block">
          <ActionRow
            icon={<ClockIcon className="w-5 h-5" />}
            label="Istoric"
            desc={`${checklistCount} checklist-uri · ${incidentCount} incidente`}
            iconBg="bg-surface-700"
            iconColor="text-surface-400"
          />
        </Link>
      </div>
    </div>
  );
}

/* ── Hero button (primary action) ── */
function HeroButton({
  icon,
  label,
  desc,
  colorClass,
  shadowClass,
  disabled = false,
}: {
  icon: ReactNode;
  label: string;
  desc: string;
  colorClass: string;
  shadowClass: string;
  disabled?: boolean;
}) {
  return (
    <div
      className={[
        "flex items-center gap-4 rounded-2xl px-6 py-6",
        "transition-all duration-150 select-none touch-manipulation",
        disabled ? "pointer-events-none cursor-not-allowed" : "active:scale-[0.97] cursor-pointer",
        colorClass,
        shadowClass,
      ].join(" ")}
    >
      <div className="text-white flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="font-extrabold text-xl text-white leading-tight tracking-tight">{label}</p>
        <p className="text-sm text-white/60 mt-1">{desc}</p>
      </div>
      {!disabled && <ChevronRight className="w-5 h-5 text-white/40 flex-shrink-0" />}
    </div>
  );
}

/* ── Secondary row button ── */
function ActionRow({
  icon,
  label,
  desc,
  iconBg,
  iconColor,
}: {
  icon: ReactNode;
  label: string;
  desc: string;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl px-4 py-4 bg-surface-800 border border-surface-700 active:bg-surface-700 transition-colors touch-manipulation select-none cursor-pointer">
      <div className={["w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0", iconBg].join(" ")}>
        <span className={iconColor}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-white text-base leading-tight">{label}</p>
        <p className="text-sm text-surface-400 mt-0.5">{desc}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-surface-600 flex-shrink-0" />
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bună dimineața,";
  if (h < 17) return "Bună ziua,";
  return "Bună seara,";
}
