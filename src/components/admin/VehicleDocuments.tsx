"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  FileText,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Pencil,
  X,
  Save,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  type VehicleDocType,
  VEHICLE_DOC_LABELS,
} from "@/types/database";

const DOC_TYPES: VehicleDocType[] = [
  "rca",
  "carte_verde",
  "itp",
  "tahograf",
  "revizie_ulei",
  "revizie_generala",
  "rovinieta",
  "licenta_transport",
  "cmr",
];

interface VehicleDoc {
  id: string;
  vehicle_id: string;
  doc_type: VehicleDocType;
  label: string;
  expires_at: string;
  issued_at: string | null;
  notes: string | null;
}

interface Props {
  vehicleId: string;
  documents: VehicleDoc[];
}

function daysUntilExpiry(expiresAt: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const exp = new Date(expiresAt);
  exp.setHours(0, 0, 0, 0);
  return Math.round((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function ExpiryBadge({ expiresAt }: { expiresAt: string }) {
  const days = daysUntilExpiry(expiresAt);
  if (days < 0)
    return (
      <Badge variant="danger" className="flex items-center gap-1 text-xs">
        <XCircle className="w-3 h-3" />
        Expirat
      </Badge>
    );
  if (days <= 30)
    return (
      <Badge variant="warning" className="flex items-center gap-1 text-xs">
        <AlertTriangle className="w-3 h-3" />
        {days === 0 ? "Azi" : `${days}z`}
      </Badge>
    );
  return (
    <Badge variant="success" className="flex items-center gap-1 text-xs">
      <CheckCircle className="w-3 h-3" />
      {days}z
    </Badge>
  );
}

export function VehicleDocuments({ vehicleId, documents: initial }: Props) {
  const router = useRouter();
  const [docs, setDocs] = useState<VehicleDoc[]>(initial);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const emptyForm = {
    doc_type: "rca" as VehicleDocType,
    label: "",
    expires_at: "",
    issued_at: "",
    notes: "",
  };
  const [form, setForm] = useState(emptyForm);

  function openAdd() {
    setEditId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(doc: VehicleDoc) {
    setEditId(doc.id);
    setForm({
      doc_type: doc.doc_type,
      label: doc.label,
      expires_at: doc.expires_at,
      issued_at: doc.issued_at ?? "",
      notes: doc.notes ?? "",
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditId(null);
    setForm(emptyForm);
  }

  function handleDocTypeChange(type: VehicleDocType) {
    setForm((f) => ({
      ...f,
      doc_type: type,
      label: f.label || VEHICLE_DOC_LABELS[type],
    }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.expires_at) {
      toast.error("Data expirării este obligatorie");
      return;
    }
    if (!form.label.trim()) {
      toast.error("Eticheta este obligatorie");
      return;
    }

    setSaving(true);
    const supabase = createClient();

    const payload = {
      doc_type: form.doc_type,
      label: form.label.trim(),
      expires_at: form.expires_at,
      issued_at: form.issued_at || null,
      notes: form.notes.trim() || null,
    };

    if (editId) {
      const { error } = await supabase
        .from("vehicle_documents")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", editId);
      setSaving(false);
      if (error) { toast.error(error.message); return; }
      setDocs((prev) =>
        prev.map((d) => (d.id === editId ? { ...d, ...payload } : d))
      );
      toast.success("Document actualizat");
    } else {
      const { data, error } = await supabase
        .from("vehicle_documents")
        .insert({ vehicle_id: vehicleId, ...payload })
        .select()
        .single();
      setSaving(false);
      if (error) { toast.error(error.message); return; }
      setDocs((prev) => [...prev, data as VehicleDoc]);
      toast.success("Document adăugat");
    }

    closeForm();
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }
    setDeletingId(id);
    const supabase = createClient();
    const { error } = await supabase
      .from("vehicle_documents")
      .delete()
      .eq("id", id);
    setDeletingId(null);
    setConfirmDeleteId(null);
    if (error) { toast.error(error.message); return; }
    setDocs((prev) => prev.filter((d) => d.id !== id));
    toast.success("Document șters");
    router.refresh();
  }

  const sorted = [...docs].sort(
    (a, b) => new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime()
  );

  return (
    <Card className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center">
            <FileText className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <p className="font-semibold text-white text-sm">Documente vehicul</p>
            <p className="text-xs text-slate-400">
              {docs.length === 0
                ? "Niciun document înregistrat"
                : `${docs.length} document${docs.length !== 1 ? "e" : ""}`}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={showForm && !editId ? closeForm : openAdd}
          className="gap-1.5"
        >
          {showForm && !editId ? (
            <><X className="w-3.5 h-3.5" /> Anulează</>
          ) : (
            <><Plus className="w-3.5 h-3.5" /> Adaugă</>
          )}
        </Button>
      </div>

      {/* Add / Edit form */}
      {showForm && (
        <form
          onSubmit={handleSave}
          className="flex flex-col gap-3 p-3 rounded-xl bg-surface-800 border border-surface-700"
        >
          <p className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
            {editId ? "Editează document" : "Document nou"}
          </p>

          {/* Doc type selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Tip document</label>
            <select
              value={form.doc_type}
              onChange={(e) => handleDocTypeChange(e.target.value as VehicleDocType)}
              className="w-full h-11 rounded-xl bg-surface-700 border border-surface-600 text-white
                px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500
                transition-colors appearance-none cursor-pointer"
            >
              {DOC_TYPES.map((t) => (
                <option key={t} value={t}>
                  {VEHICLE_DOC_LABELS[t]}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Etichetă / Detaliu"
            value={form.label}
            onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
            placeholder={VEHICLE_DOC_LABELS[form.doc_type]}
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">
                Data expirării <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={form.expires_at}
                onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))}
                className="h-11 rounded-xl bg-surface-700 border border-surface-600 text-white
                  px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500
                  transition-colors [color-scheme:dark]"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">Data emiterii</label>
              <input
                type="date"
                value={form.issued_at}
                onChange={(e) => setForm((f) => ({ ...f, issued_at: e.target.value }))}
                className="h-11 rounded-xl bg-surface-700 border border-surface-600 text-white
                  px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500
                  transition-colors [color-scheme:dark]"
              />
            </div>
          </div>

          <Input
            label="Note (opțional)"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Ex: Poliță nr. 12345"
          />

          <div className="flex gap-2">
            <Button type="submit" variant="primary" size="sm" loading={saving} className="gap-1.5 flex-1">
              <Save className="w-3.5 h-3.5" />
              {editId ? "Salvează modificările" : "Adaugă documentul"}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={closeForm}>
              Anulează
            </Button>
          </div>
        </form>
      )}

      {/* Document list */}
      {sorted.length > 0 && (
        <div className="flex flex-col gap-2">
          {sorted.map((doc) => {
            const days = daysUntilExpiry(doc.expires_at);
            const isExpired = days < 0;
            const isWarning = days >= 0 && days <= 30;

            return (
              <div
                key={doc.id}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                  isExpired
                    ? "bg-red-950/30 border-red-900/40"
                    : isWarning
                    ? "bg-amber-950/30 border-amber-900/40"
                    : "bg-surface-800 border-surface-700"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-white">{doc.label}</span>
                    <ExpiryBadge expiresAt={doc.expires_at} />
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Expiră:{" "}
                    <span className={isExpired ? "text-red-400" : isWarning ? "text-amber-400" : "text-slate-300"}>
                      {new Date(doc.expires_at).toLocaleDateString("ro-RO")}
                    </span>
                    {doc.issued_at && (
                      <> · Emis: {new Date(doc.issued_at).toLocaleDateString("ro-RO")}</>
                    )}
                  </p>
                  {doc.notes && (
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{doc.notes}</p>
                  )}
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => openEdit(doc)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400
                      hover:text-white hover:bg-surface-600 transition-colors"
                    title="Editează"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>

                  {confirmDeleteId === doc.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(doc.id)}
                        disabled={deletingId === doc.id}
                        className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded-lg
                          hover:bg-red-950/40 transition-colors"
                      >
                        Confirmă
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-xs text-slate-400 hover:text-slate-300 px-1"
                      >
                        Nu
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400
                        hover:text-red-400 hover:bg-red-950/30 transition-colors"
                      title="Șterge"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {sorted.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center py-6 gap-2 text-center">
          <FileText className="w-8 h-8 text-slate-600" />
          <p className="text-sm text-slate-400">Niciun document înregistrat</p>
          <p className="text-xs text-slate-500">Adaugă RCA, ITP, tahograf etc.</p>
        </div>
      )}
    </Card>
  );
}
