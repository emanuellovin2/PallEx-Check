"use client";

import { useEffect, useState, useCallback } from "react";
import { WifiOff, RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { countPending } from "@/lib/offline/db";
import { syncPendingChecklists } from "@/lib/offline/sync";

export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  // Refresh pending count
  const refreshCount = useCallback(async () => {
    const n = await countPending();
    setPendingCount(n);
  }, []);

  // Poll count every 5s so banner updates after wizard saves offline
  useEffect(() => {
    refreshCount();
    const id = setInterval(refreshCount, 5000);
    return () => clearInterval(id);
  }, [refreshCount]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (!isOnline || pendingCount === 0) return;

    async function autoSync() {
      setSyncing(true);
      try {
        const result = await syncPendingChecklists();
        if (result.synced > 0) {
          toast.success(
            `${result.synced} checklist${result.synced > 1 ? "-uri" : ""} sincronizat${result.synced > 1 ? "e" : ""} ✓`
          );
        }
        if (result.failed > 0) {
          toast.error(`${result.failed} checklist-uri nu s-au putut sincroniza`);
        }
        await refreshCount();
      } catch {
        toast.error("Sincronizare eșuată. Încearcă manual.");
      } finally {
        setSyncing(false);
      }
    }

    autoSync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  // Manual sync button handler
  async function handleManualSync() {
    if (syncing) return;
    setSyncing(true);
    try {
      const result = await syncPendingChecklists();
      if (result.synced > 0) {
        toast.success(`${result.synced} checklist${result.synced > 1 ? "-uri" : ""} trimis${result.synced > 1 ? "e" : ""} ✓`);
      } else if (result.failed > 0) {
        toast.error("Sincronizare eșuată. Încearcă din nou.");
      } else {
        toast("Nimic de sincronizat");
      }
      await refreshCount();
    } catch {
      toast.error("Eroare la sincronizare. Încearcă din nou.");
    } finally {
      setSyncing(false);
    }
  }

  // Nothing to show: online and no pending items
  if (isOnline && pendingCount === 0) return null;

  return (
    <div
      className={[
        "w-full px-4 py-2.5 flex items-center gap-3 text-sm font-medium",
        "transition-all duration-300",
        !isOnline
          ? "bg-slate-800 border-b border-slate-700 text-slate-300"
          : "bg-amber-500/10 border-b border-amber-500/20 text-amber-300",
      ].join(" ")}
    >
      {/* Icon */}
      {!isOnline ? (
        <WifiOff className="w-4 h-4 text-slate-400 flex-shrink-0" />
      ) : syncing ? (
        <RefreshCw className="w-4 h-4 text-amber-400 flex-shrink-0 animate-spin" />
      ) : (
        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
      )}

      {/* Message */}
      <span className="flex-1 min-w-0 truncate">
        {!isOnline && pendingCount === 0 && "Ești offline"}
        {!isOnline && pendingCount > 0 &&
          `Ești offline · ${pendingCount} checklist${pendingCount > 1 ? "-uri" : ""} salvat${pendingCount > 1 ? "e" : ""} local`}
        {isOnline && pendingCount > 0 && syncing &&
          "Se sincronizează…"}
        {isOnline && pendingCount > 0 && !syncing &&
          `${pendingCount} checklist${pendingCount > 1 ? "-uri" : ""} în așteptare`}
      </span>

      {/* Manual sync button — only when online and pending */}
      {isOnline && pendingCount > 0 && !syncing && (
        <button
          onClick={handleManualSync}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/20
            hover:bg-amber-500/30 text-amber-300 text-xs font-semibold
            transition-colors touch-manipulation flex-shrink-0"
        >
          <RefreshCw className="w-3 h-3" />
          Sync
        </button>
      )}

      {/* Synced feedback */}
      {isOnline && pendingCount === 0 && syncing && (
        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
      )}
    </div>
  );
}
