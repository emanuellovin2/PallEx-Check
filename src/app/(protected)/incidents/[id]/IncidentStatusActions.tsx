"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { CheckCircle2, Eye, XCircle, RotateCcw, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type IncidentStatus = "open" | "reviewing" | "resolved" | "closed";

interface Props {
  incidentId: string;
  currentStatus: IncidentStatus;
}

interface StatusAction {
  label: string;
  next: IncidentStatus;
  icon: React.ElementType;
  className: string;
}

const TRANSITIONS: Record<IncidentStatus, StatusAction[]> = {
  open: [
    {
      label: "Mark as Reviewing",
      next: "reviewing",
      icon: Eye,
      className:
        "bg-brand-500/10 border-brand-500/30 text-brand-300 hover:bg-brand-500/20 hover:border-brand-500/50",
    },
    {
      label: "Mark as Resolved",
      next: "resolved",
      icon: CheckCircle2,
      className:
        "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-500/50",
    },
  ],
  reviewing: [
    {
      label: "Mark as Resolved",
      next: "resolved",
      icon: CheckCircle2,
      className:
        "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-500/50",
    },
    {
      label: "Close Incident",
      next: "closed",
      icon: XCircle,
      className:
        "bg-slate-500/10 border-slate-500/30 text-slate-400 hover:bg-slate-500/20 hover:border-slate-500/50",
    },
  ],
  resolved: [
    {
      label: "Close Incident",
      next: "closed",
      icon: XCircle,
      className:
        "bg-slate-500/10 border-slate-500/30 text-slate-400 hover:bg-slate-500/20 hover:border-slate-500/50",
    },
    {
      label: "Reopen",
      next: "open",
      icon: RotateCcw,
      className:
        "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/50",
    },
  ],
  closed: [
    {
      label: "Reopen",
      next: "open",
      icon: RotateCcw,
      className:
        "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/50",
    },
  ],
};

const STATUS_LABELS: Record<IncidentStatus, { label: string; className: string }> = {
  open:      { label: "Open",      className: "bg-red-500/15 border-red-500/30 text-red-400" },
  reviewing: { label: "Reviewing", className: "bg-brand-500/15 border-brand-500/30 text-brand-300" },
  resolved:  { label: "Resolved",  className: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" },
  closed:    { label: "Closed",    className: "bg-slate-500/15 border-slate-500/30 text-slate-400" },
};

export function IncidentStatusActions({ incidentId, currentStatus }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<IncidentStatus | null>(null);
  const [status, setStatus] = useState<IncidentStatus>(currentStatus);

  const actions = TRANSITIONS[status] ?? [];
  const statusInfo = STATUS_LABELS[status];

  async function handleStatusChange(next: IncidentStatus) {
    setLoading(next);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("incidents")
        .update({ status: next, updated_at: new Date().toISOString() })
        .eq("id", incidentId);

      if (error) {
        toast.error("Failed to update status: " + error.message);
        return;
      }

      setStatus(next);
      toast.success(`Status updated to "${next}"`);
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-surface-700 bg-surface-800/50 px-4 py-4">
      {/* Current status */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Status Management
        </span>
        <span
          className={`px-2.5 py-1 rounded-full border text-xs font-semibold uppercase tracking-wide ${statusInfo.className}`}
        >
          {statusInfo.label}
        </span>
      </div>

      {/* Action buttons */}
      {actions.length > 0 ? (
        <div className="flex flex-col gap-2">
          {actions.map(({ label, next, icon: Icon, className }) => (
            <button
              key={next}
              onClick={() => handleStatusChange(next)}
              disabled={loading !== null}
              className={`flex items-center gap-2.5 w-full px-4 py-2.5 rounded-xl border text-sm font-medium
                transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
            >
              {loading === next ? (
                <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
              ) : (
                <Icon className="w-4 h-4 flex-shrink-0" />
              )}
              {label}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-500">No further actions available.</p>
      )}
    </div>
  );
}
