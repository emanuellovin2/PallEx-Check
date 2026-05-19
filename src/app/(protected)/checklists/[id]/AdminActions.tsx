"use client";

import { useState } from "react";
import { Trash2, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { deleteChecklist, setReviewStatus } from "./actions";

interface Props {
  checklistId: string;
  currentReviewStatus: string | null;
}

export default function AdminActions({ checklistId, currentReviewStatus }: Props) {
  const [pending, setPending] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setPending("delete");
    await deleteChecklist(checklistId);
  }

  async function handleStatus(status: "verified" | "needs_review") {
    setPending(status);
    await setReviewStatus(checklistId, status);
    setPending(null);
  }

  return (
    <div className="flex flex-col gap-2 mt-1">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 px-1">Acțiuni admin</p>
      <div className="flex gap-2">
        <button
          onClick={() => handleStatus("verified")}
          disabled={pending !== null}
          className={[
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all",
            currentReviewStatus === "verified"
              ? "bg-emerald-500 text-white"
              : "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25",
            pending === "verified" ? "opacity-60" : "",
          ].join(" ")}
        >
          {pending === "verified" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
          Verificat
        </button>

        <button
          onClick={() => handleStatus("needs_review")}
          disabled={pending !== null}
          className={[
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all",
            currentReviewStatus === "needs_review"
              ? "bg-amber-500 text-white"
              : "bg-amber-500/15 text-amber-400 hover:bg-amber-500/25",
            pending === "needs_review" ? "opacity-60" : "",
          ].join(" ")}
        >
          {pending === "needs_review" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          De verificat
        </button>
      </div>

      <button
        onClick={handleDelete}
        disabled={pending !== null}
        className={[
          "w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all",
          confirmDelete
            ? "bg-red-500 text-white animate-pulse"
            : "bg-red-500/10 text-red-400 hover:bg-red-500/20",
          pending === "delete" ? "opacity-60" : "",
        ].join(" ")}
      >
        {pending === "delete" ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Trash2 className="w-4 h-4" />
        )}
        {confirmDelete ? "Apasă din nou pentru confirmare" : "Șterge raportul"}
      </button>

      {confirmDelete && (
        <button
          onClick={() => setConfirmDelete(false)}
          className="text-xs text-slate-500 text-center hover:text-slate-400 transition-colors"
        >
          Anulează ștergerea
        </button>
      )}
    </div>
  );
}
