"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Plus, Minus, History, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

interface PointEvent {
  id: string;
  amount: number;
  reason: string;
  source: string;
  created_at: string;
}

interface Props {
  driverId: string;
  driverName: string;
  totalPoints: number;
  recentEvents: PointEvent[];
}

export function DriverPointsManager({ driverId, driverName, totalPoints, recentEvents }: Props) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<"add" | "remove">("add");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseInt(amount);
    if (!n || n <= 0) { toast.error("Introdu un număr valid"); return; }
    if (!reason.trim()) { toast.error("Motivul este obligatoriu"); return; }

    setSaving(true);
    const supabase = createClient();
    const finalAmount = mode === "remove" ? -Math.abs(n) : Math.abs(n);

    const { error } = await supabase.from("point_events").insert({
      driver_id: driverId,
      amount: finalAmount,
      reason: reason.trim(),
      source: "admin",
      awarded_by: (await supabase.auth.getUser()).data.user?.id ?? null,
    });

    setSaving(false);
    if (error) { toast.error(error.message); return; }

    toast.success(
      mode === "add"
        ? `+${n} puncte acordate lui ${driverName}`
        : `-${n} puncte deduse de la ${driverName}`
    );
    setAmount("");
    setReason("");
    router.refresh();
  }

  return (
    <Card className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center">
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <p className="font-semibold text-white text-sm">Puncte șofer</p>
            <p className="text-xs text-slate-400">Total curent</p>
          </div>
        </div>
        <div className="flex items-end gap-1">
          <span className="text-2xl font-black text-amber-400 tabular-nums">{totalPoints}</span>
          <span className="text-xs text-slate-500 mb-0.5">pct</span>
        </div>
      </div>

      {/* Add/Remove form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {/* Mode toggle */}
        <div className="flex gap-1 p-1 rounded-xl bg-surface-800 border border-surface-700">
          <button
            type="button"
            onClick={() => setMode("add")}
            className={[
              "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all",
              mode === "add"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "text-slate-500 hover:text-slate-300",
            ].join(" ")}
          >
            <Plus className="w-3.5 h-3.5" />
            Acordă
          </button>
          <button
            type="button"
            onClick={() => setMode("remove")}
            className={[
              "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all",
              mode === "remove"
                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                : "text-slate-500 hover:text-slate-300",
            ].join(" ")}
          >
            <Minus className="w-3.5 h-3.5" />
            Deduce
          </button>
        </div>

        <Input
          label="Număr puncte"
          type="number"
          min="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="ex: 10"
          leftIcon={
            mode === "add"
              ? <Plus className="w-4 h-4 text-emerald-400" />
              : <Minus className="w-4 h-4 text-red-400" />
          }
        />
        <Input
          label="Motiv"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="ex: Performanță excelentă luna aceasta"
        />

        <Button
          type="submit"
          variant={mode === "add" ? "primary" : "danger"}
          size="sm"
          loading={saving}
          className="gap-1.5 self-start"
        >
          {mode === "add" ? <Plus className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
          {mode === "add" ? "Acordă puncte" : "Deduce puncte"}
        </Button>
      </form>

      {/* Recent events */}
      {recentEvents.length > 0 && (
        <div className="flex flex-col gap-2 pt-1 border-t border-surface-700">
          <div className="flex items-center gap-1.5 text-slate-500">
            <History className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold uppercase tracking-wide">Istoric recent</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {recentEvents.map((ev) => (
              <div key={ev.id} className="flex items-center gap-3">
                <span
                  className={[
                    "text-sm font-bold tabular-nums w-12 text-right flex-shrink-0",
                    ev.amount > 0 ? "text-emerald-400" : "text-red-400",
                  ].join(" ")}
                >
                  {ev.amount > 0 ? "+" : ""}{ev.amount}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-300 truncate">{ev.reason}</p>
                  <p className="text-xs text-slate-600">
                    {new Date(ev.created_at).toLocaleDateString("ro-RO")}
                    {ev.source === "checklist" && " · auto"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
