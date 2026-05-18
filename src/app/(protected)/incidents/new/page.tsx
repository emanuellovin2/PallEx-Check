"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import {
  ChevronLeft,
  MapPin,
  Mic,
  MicOff,
  Camera,
  X,
  Lock,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Info,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Database, IncidentSeverity } from "@/types/database";

// ── Types ────────────────────────────────────────────────────

type GpsState =
  | { status: "idle" }
  | { status: "acquiring" }
  | { status: "acquired"; lat: number; lng: number; accuracy: number }
  | { status: "error"; message: string };

type PhotoPreview = {
  file: File;
  objectUrl: string;
};

const SEVERITIES: { value: IncidentSeverity; label: string; bg: string; border: string; text: string }[] = [
  { value: "low",      label: "Scăzut",  bg: "bg-slate-800",  border: "border-slate-500",  text: "text-slate-300"  },
  { value: "medium",   label: "Mediu",   bg: "bg-amber-900/40",  border: "border-amber-500",  text: "text-amber-300"  },
  { value: "high",     label: "Ridicat", bg: "bg-orange-900/40", border: "border-orange-500", text: "text-orange-300" },
  { value: "critical", label: "Critic",  bg: "bg-red-900/40",    border: "border-red-500",    text: "text-red-300"    },
];

// ── Component ────────────────────────────────────────────────

export default function NewIncidentPage() {
  const router = useRouter();

  // Form fields
  const [title, setTitle] = useState("");
  const [severity, setSeverity] = useState<IncidentSeverity>("medium");
  const [hasDamage, setHasDamage] = useState(false);
  const [description, setDescription] = useState("");
  const [voiceText, setVoiceText] = useState("");
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);

  // UI state
  const [gps, setGps] = useState<GpsState>({ status: "idle" });
  const [isListening, setIsListening] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Refs
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── GPS Auto-Capture ────────────────────────────────────────

  useEffect(() => {
    if (!navigator.geolocation) {
      setGps({ status: "error", message: "GPS-ul nu este disponibil pe acest dispozitiv" });
      return;
    }
    setGps({ status: "acquiring" });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps({
          status: "acquired",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
        });
      },
      (err) => {
        setGps({
          status: "error",
          message:
            err.code === err.PERMISSION_DENIED
              ? "Permisiunea de locație a fost refuzată"
              : "Nu s-a putut obține semnalul GPS",
        });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, []);

  // ── Voice Input ─────────────────────────────────────────────

  const startListening = useCallback(() => {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast.error("Introducerea vocală nu este suportată pe acest browser");
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = new SR();
    recognition.lang = "en-GB";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognitionRef.current = recognition;

    setIsListening(true);

    recognition.onresult = (event: any) => {
      const transcript: string = Array.from(event.results as any[])
        .map((r: any) => r[0].transcript)
        .join(" ");
      setVoiceText(transcript);
      setDescription((prev) =>
        prev ? `${prev.trimEnd()} ${transcript}` : transcript
      );
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
      toast.error("Înregistrarea vocală a eșuat — încearcă din nou");
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }, [isListening]);

  // ── Photo Handling ──────────────────────────────────────────

  const handlePhotoChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;

      const newPreviews: PhotoPreview[] = files.map((file) => ({
        file,
        objectUrl: URL.createObjectURL(file),
      }));
      setPhotos((prev) => [...prev, ...newPreviews]);
      // Reset input so the same file can be re-selected
      e.target.value = "";
    },
    []
  );

  const removePhoto = useCallback((idx: number) => {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[idx].objectUrl);
      return prev.filter((_, i) => i !== idx);
    });
  }, []);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      photos.forEach((p) => URL.revokeObjectURL(p.objectUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Validation ──────────────────────────────────────────────

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = "Titlul este obligatoriu";
    if (hasDamage && photos.length === 0)
      errs.photos = "Cel puțin o fotografie este obligatorie când se raportează daune";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ── Submit ──────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    const supabase = createClient();

    try {
      // 1. Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      const gpsLat = gps.status === "acquired" ? gps.lat : null;
      const gpsLng = gps.status === "acquired" ? gps.lng : null;

      // 2. Generate incident ID client-side so photos can be uploaded
      //    to the correct path before the DB row is created.
      const incidentId = crypto.randomUUID();

      // 3. Upload photos to Storage first (before any DB writes)
      const uploadedPaths: string[] = [];
      for (const { file } of photos) {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${user.id}/${incidentId}/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.${ext}`;

        const { error: uploadErr } = await supabase.storage
          .from("incident-photos")
          .upload(path, file, { upsert: false, contentType: file.type });

        if (uploadErr) {
          console.error("Photo upload failed:", uploadErr.message);
          toast.error(`Încărcarea fotografiei a eșuat: ${file.name}`);
          continue;
        }
        uploadedPaths.push(path);
      }

      // 4. Insert incident row with the pre-generated ID
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: incidentErr } = await (supabase as any)
        .from("incidents")
        .insert({
          id: incidentId,
          driver_id: user.id,
          title: title.trim(),
          description: description.trim() || null,
          voice_text: voiceText || null,
          severity,
          has_damage: hasDamage,
          gps_lat: gpsLat,
          gps_lng: gpsLng,
          locked: false,
        });

      if (incidentErr) {
        toast.error("Crearea incidentului a eșuat — încearcă din nou");
        return;
      }

      // 5. Atomically register photos + lock the incident in one DB transaction.
      //    This eliminates the race condition where a crash between photo insert
      //    and lock update could leave the incident permanently unlocked.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: finalizeErr } = await (supabase as any).rpc("finalize_incident", {
        p_incident_id: incidentId,
        p_photo_paths: uploadedPaths,
        p_device_info: {
          ua: navigator.userAgent,
          platform: navigator.platform,
          gps_lat: gpsLat,
          gps_lng: gpsLng,
          severity,
          has_damage: hasDamage,
          photo_count: uploadedPaths.length,
        },
      });

      if (finalizeErr) {
        toast.error("Blocarea incidentului a eșuat — contactează suportul");
        console.error("finalize_incident failed:", finalizeErr.message);
        return;
      }

      toast.success("Incident raportat și blocat");
      router.push("/incidents");
    } finally {
      setSaving(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-5 max-w-lg pb-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/incidents">
          <button className="p-2 rounded-xl bg-surface-800 text-slate-400 hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">Raportează Incident</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Imuabil după trimitere
          </p>
        </div>
      </div>

      {/* GPS Status */}
      <div
        className={[
          "flex items-center gap-3 rounded-xl px-4 py-3 border text-sm",
          gps.status === "acquired"
            ? "border-emerald-800 bg-emerald-950/50 text-emerald-300"
            : gps.status === "error"
            ? "border-red-800 bg-red-950/50 text-red-300"
            : "border-surface-700 bg-surface-800 text-slate-400",
        ].join(" ")}
      >
        {gps.status === "acquiring" ? (
          <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
        ) : gps.status === "acquired" ? (
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
        ) : (
          <MapPin className="w-4 h-4 flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          {gps.status === "idle" && <span>Se așteaptă GPS-ul…</span>}
          {gps.status === "acquiring" && <span>Se obține locația GPS…</span>}
          {gps.status === "acquired" && (
            <span>
              GPS capturat — {gps.lat.toFixed(5)}, {gps.lng.toFixed(5)}{" "}
              <span className="text-emerald-500 text-xs">
                (±{gps.accuracy}m)
              </span>
            </span>
          )}
          {gps.status === "error" && (
            <span>{gps.message} — locația nu va fi înregistrată</span>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Title */}
        <Input
          label="Titlu incident"
          placeholder="ex. Coliziune din spate pe A1"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={errors.title}
        />

        {/* Severity */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-300">
            Nivel severitate
          </label>
          <div className="grid grid-cols-4 gap-2">
            {SEVERITIES.map(({ value, label, bg, border, text }) => (
              <button
                key={value}
                type="button"
                onClick={() => setSeverity(value)}
                className={[
                  "h-12 rounded-xl border text-xs font-semibold transition-all touch-manipulation",
                  severity === value
                    ? `${bg} ${border} ${text} scale-[0.97]`
                    : "border-surface-700 text-slate-500 bg-surface-800 hover:border-surface-600",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Damage Toggle */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-300">
            Daune vehicul / proprietate?
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: false, label: "Fără daune" },
              { value: true, label: "Daune prezente" },
            ].map(({ value, label }) => (
              <button
                key={String(value)}
                type="button"
                onClick={() => setHasDamage(value)}
                className={[
                  "h-12 rounded-xl border text-sm font-semibold transition-all touch-manipulation",
                  hasDamage === value
                    ? value
                      ? "border-red-500 bg-red-900/40 text-red-300"
                      : "border-emerald-500 bg-emerald-900/40 text-emerald-300"
                    : "border-surface-700 text-slate-500 bg-surface-800 hover:border-surface-600",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>
          {hasDamage && (
            <p className="text-xs text-amber-400 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 flex-shrink-0" />
              Fotografiile sunt obligatorii când se raportează daune
            </p>
          )}
        </div>

        {/* Description + Voice */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-300">
              Descriere
            </label>
            <button
              type="button"
              onClick={startListening}
              className={[
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all touch-manipulation",
                isListening
                  ? "bg-red-600 text-white animate-pulse"
                  : "bg-surface-700 text-slate-300 hover:bg-surface-600",
              ].join(" ")}
            >
              {isListening ? (
                <>
                  <MicOff className="w-3.5 h-3.5" />
                  Ascult…
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5" />
                  Input vocal
                </>
              )}
            </button>
          </div>
          <textarea
            placeholder={
              isListening
                ? "Ascult — vorbește acum…"
                : "Descrie ce s-a întâmplat. Apasă 'Input vocal' pentru dictare."
            }
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className="w-full rounded-xl border border-surface-700 bg-surface-800 text-white
              placeholder-slate-500 px-4 py-3 text-sm focus:outline-none focus:ring-2
              focus:ring-brand-500 resize-none transition-colors"
          />
          {voiceText && (
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <Mic className="w-3 h-3" />
              Ultima captură vocală adăugată
            </p>
          )}
        </div>

        {/* Photos */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-300">
              Fotografii{" "}
              {hasDamage && (
                <span className="text-red-400 text-xs ml-1">* obligatoriu</span>
              )}
            </label>
            <span className="text-xs text-slate-500">{photos.length} adăugate</span>
          </div>

          {/* Grid of thumbnails */}
          {photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {photos.map((p, idx) => (
                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-surface-800 border border-surface-700">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.objectUrl}
                    alt={`Fotografie incident ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white
                      flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add photo button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={[
              "flex items-center justify-center gap-2 h-14 rounded-xl border-2 border-dashed",
              "text-sm font-medium transition-all touch-manipulation",
              errors.photos
                ? "border-red-500 text-red-400 bg-red-950/20"
                : "border-surface-600 text-slate-400 bg-surface-800 hover:border-surface-500 hover:text-slate-300",
            ].join(" ")}
          >
            <Camera className="w-4 h-4" />
            {photos.length === 0 ? "Adaugă Foto / Deschide Camera" : "Adaugă Altă Fotografie"}
          </button>
          {errors.photos && (
            <p className="text-xs text-red-400">{errors.photos}</p>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            className="hidden"
            onChange={handlePhotoChange}
          />
        </div>

        {/* Submit */}
        <div className="flex flex-col gap-2 pt-2">
          <div className="flex items-center gap-2 px-1 text-xs text-slate-500">
            <Lock className="w-3.5 h-3.5 flex-shrink-0" />
            Odată trimis, acest raport este blocat permanent și nu poate fi
            editat sau șters.
          </div>
          <Button
            type="submit"
            variant="danger"
            size="lg"
            fullWidth
            loading={saving}
          >
            {saving ? "Se trimite…" : "🚨 Trimite și Blochează Raportul"}
          </Button>
        </div>
      </form>
    </div>
  );
}
