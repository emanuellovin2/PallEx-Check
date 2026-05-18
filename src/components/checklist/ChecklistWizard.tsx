"use client";

import { useState, useRef, useCallback, useId } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  ChevronLeft,
  ChevronRight,
  Truck,
  Camera,
  ShieldCheck,
  Package,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Lock,
  Mic,
  MicOff,
  X,
  Image as ImageIcon,
  WifiOff,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { savePendingChecklist, fileToPhotoEntry } from "@/lib/offline/db";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Vehicle {
  id: string;
  plate_number: string;
  model: string;
}

interface ChecklistWizardProps {
  vehicle: Vehicle;
  driverId: string;
}

type PhotoSlot = "front" | "back" | "side";

interface PhotoState {
  front: File | null;
  back: File | null;
  side: File | null;
}

interface SafetyChecks {
  tyre_front_left: boolean;
  tyre_front_right: boolean;
  tyre_rear_left: boolean;
  tyre_rear_right: boolean;
  tyre_spare: boolean;
  headlights: boolean;
  taillights: boolean;
  indicators: boolean;
  brake_lights: boolean;
  foot_brake: boolean;
  handbrake: boolean;
  engine_oil: boolean;
  coolant: boolean;
  fuel_level: boolean;
  windscreen: boolean;
  wipers: boolean;
  mirrors: boolean;
  doors_secure: boolean;
  seatbelts: boolean;
  cargo_secured: boolean;
  fire_extinguisher: boolean;
  first_aid_kit: boolean;
  hi_vis_vest: boolean;
}

const SAFETY_GROUPS = [
  {
    label: "Tyres",
    items: [
      { key: "tyre_front_left", label: "Front Left" },
      { key: "tyre_front_right", label: "Front Right" },
      { key: "tyre_rear_left", label: "Rear Left" },
      { key: "tyre_rear_right", label: "Rear Right" },
      { key: "tyre_spare", label: "Spare" },
    ],
  },
  {
    label: "Lights",
    items: [
      { key: "headlights", label: "Headlights" },
      { key: "taillights", label: "Taillights" },
      { key: "indicators", label: "Indicators" },
      { key: "brake_lights", label: "Brake Lights" },
    ],
  },
  {
    label: "Brakes & Controls",
    items: [
      { key: "foot_brake", label: "Foot Brake" },
      { key: "handbrake", label: "Handbrake" },
    ],
  },
  {
    label: "Fluids & Visibility",
    items: [
      { key: "engine_oil", label: "Engine Oil" },
      { key: "coolant", label: "Coolant" },
      { key: "fuel_level", label: "Fuel Level" },
      { key: "windscreen", label: "Windscreen Clear" },
      { key: "wipers", label: "Wipers OK" },
      { key: "mirrors", label: "Mirrors Adjusted" },
    ],
  },
  {
    label: "Body & Safety",
    items: [
      { key: "doors_secure", label: "Doors Secure" },
      { key: "seatbelts", label: "Seatbelts OK" },
      { key: "cargo_secured", label: "Cargo Secured" },
      { key: "fire_extinguisher", label: "Fire Extinguisher" },
      { key: "first_aid_kit", label: "First Aid Kit" },
      { key: "hi_vis_vest", label: "Hi-Vis Vest" },
    ],
  },
];

const STEP_LABELS = [
  { icon: Truck, label: "Vehicle" },
  { icon: Camera, label: "Photos" },
  { icon: ShieldCheck, label: "Safety" },
  { icon: Package, label: "Cargo" },
  { icon: AlertTriangle, label: "Damage" },
  { icon: CheckCircle2, label: "Submit" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getGPS(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 8000 }
    );
  });
}

// ─── Sub-step components ──────────────────────────────────────────────────────

function StepIndicator({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5 justify-center">
      {STEP_LABELS.map((s, i) => {
        const Icon = s.icon;
        const done = i < step;
        const active = i === step;
        return (
          <div key={i} className="flex items-center gap-1">
            <div
              className={[
                "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200",
                done ? "bg-emerald-500" : active ? "bg-brand-500" : "bg-surface-700",
              ].join(" ")}
            >
              {done ? (
                <CheckCircle2 className="w-4 h-4 text-white" />
              ) : (
                <Icon className={`w-4 h-4 ${active ? "text-white" : "text-slate-500"}`} />
              )}
            </div>
            {i < total - 1 && (
              <div className={`h-0.5 w-4 rounded-full transition-all ${done ? "bg-emerald-500" : "bg-surface-700"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Photo upload slot
function PhotoSlotCard({
  slot,
  file,
  onCapture,
}: {
  slot: PhotoSlot;
  file: File | null;
  onCapture: (slot: PhotoSlot, file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const preview = file ? URL.createObjectURL(file) : null;

  const labels: Record<PhotoSlot, string> = {
    front: "Front View",
    back: "Rear View",
    side: "Side View",
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{labels[slot]}</p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={[
          "relative w-full aspect-video rounded-2xl border-2 border-dashed overflow-hidden",
          "flex flex-col items-center justify-center gap-2 transition-all duration-150",
          "touch-manipulation active:scale-[0.98]",
          file
            ? "border-emerald-500/50 bg-emerald-500/5"
            : "border-surface-600 bg-surface-800 hover:border-brand-500/50",
        ].join(" ")}
      >
        {preview ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt={labels[slot]} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute bottom-2 right-2 bg-emerald-500 rounded-full p-1">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-2xl bg-surface-700 flex items-center justify-center">
              <Camera className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm text-slate-400">Tap to capture</p>
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onCapture(slot, f);
        }}
      />
    </div>
  );
}

// Safety toggle row
function SafetyToggle({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={[
        "flex items-center justify-between w-full px-4 py-3.5 rounded-xl border",
        "transition-all duration-150 touch-manipulation active:scale-[0.99]",
        checked
          ? "bg-emerald-500/10 border-emerald-500/30"
          : "bg-surface-800 border-surface-700 hover:border-surface-600",
      ].join(" ")}
    >
      <span className={`text-sm font-medium ${checked ? "text-emerald-300" : "text-white"}`}>
        {label}
      </span>
      <div
        className={[
          "w-12 h-6 rounded-full transition-all duration-200 relative flex-shrink-0",
          checked ? "bg-emerald-500" : "bg-surface-600",
        ].join(" ")}
      >
        <div
          className={[
            "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200",
            checked ? "left-[26px]" : "left-0.5",
          ].join(" ")}
        />
      </div>
    </button>
  );
}

// ─── Main wizard ──────────────────────────────────────────────────────────────

export function ChecklistWizard({ vehicle, driverId }: ChecklistWizardProps) {
  const router = useRouter();
  const isOnline = useOnlineStatus();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Stable local ID for this wizard session — used as idempotency key offline
  const rawId = useId();
  const localId = rawId.replace(/:/g, "");

  // Step 2 — Photos
  const [photos, setPhotos] = useState<PhotoState>({ front: null, back: null, side: null });
  const [damagePhoto, setDamagePhoto] = useState<File | null>(null);
  const damagePhotoRef = useRef<HTMLInputElement>(null);

  // Step 3 — Safety
  const [safety, setSafety] = useState<SafetyChecks>(() =>
    Object.fromEntries(
      SAFETY_GROUPS.flatMap((g) => g.items.map((i) => [i.key, false]))
    ) as SafetyChecks
  );

  // Step 4 — Cargo
  const [cargoType, setCargoType] = useState("");
  const [cargoQty, setCargoQty] = useState("");
  const [cargoNotes, setCargoNotes] = useState("");

  // Step 5 — Damage
  const [hasDamage, setHasDamage] = useState(false);
  const [damageDesc, setDamageDesc] = useState("");
  const [voiceText, setVoiceText] = useState("");
  const [recording, setRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // ── Validation per step ──
  const canProceed = useCallback((): boolean => {
    if (step === 1) {
      return !!photos.front && !!photos.back && !!photos.side;
    }
    if (step === 3) {
      return cargoType.trim().length > 0;
    }
    return true;
  }, [step, photos, cargoType]);

  // ── Voice recording ──
  function startVoice() {
    const SpeechRecognition =
      (window as Window & { SpeechRecognition?: typeof window.SpeechRecognition; webkitSpeechRecognition?: typeof window.SpeechRecognition }).SpeechRecognition ||
      (window as Window & { webkitSpeechRecognition?: typeof window.SpeechRecognition }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Voice input not supported on this browser");
      return;
    }
    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = "en-GB";

    rec.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join(" ");
      setVoiceText(transcript);
      if (!damageDesc) setDamageDesc(transcript);
    };
    rec.onend = () => setRecording(false);
    rec.onerror = () => { setRecording(false); toast.error("Voice recognition error"); };

    rec.start();
    recognitionRef.current = rec;
    setRecording(true);
  }

  function stopVoice() {
    recognitionRef.current?.stop();
    setRecording(false);
  }

  // ── Upload photo to Supabase storage ──
  async function uploadPhoto(
    supabase: ReturnType<typeof createClient>,
    file: File,
    checklistId: string,
    slot: string
  ): Promise<string | null> {
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${driverId}/${checklistId}/${slot}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("checklist-photos")
      .upload(path, file, { upsert: false });
    if (error) return null;
    const { data } = supabase.storage.from("checklist-photos").getPublicUrl(path);
    return data.publicUrl;
  }

  // ── Offline save handler ──
  async function handleOfflineSave(gps: { lat: number; lng: number } | null) {
    try {
      const safetyPayload = Object.fromEntries(
        SAFETY_GROUPS.flatMap((g) =>
          g.items.map((i) => [i.key, safety[i.key as keyof SafetyChecks]])
        )
      );

      const photoEntries = await Promise.all([
        photos.front ? fileToPhotoEntry(photos.front, "front") : null,
        photos.back  ? fileToPhotoEntry(photos.back,  "back")  : null,
        photos.side  ? fileToPhotoEntry(photos.side,  "side")  : null,
        hasDamage && damagePhoto ? fileToPhotoEntry(damagePhoto, "damage") : null,
      ]);

      await savePendingChecklist({
        local_id: localId,
        driver_id: driverId,
        vehicle_id: vehicle.id,
        vehicle_plate: vehicle.plate_number,
        vehicle_model: vehicle.model,
        gps_lat: gps?.lat ?? null,
        gps_lng: gps?.lng ?? null,
        safety: safetyPayload,
        cargo_type: cargoType,
        cargo_quantity: cargoQty ? parseInt(cargoQty) : null,
        cargo_notes: cargoNotes || null,
        has_damage: hasDamage,
        damage_description: hasDamage ? damageDesc || null : null,
        damage_voice_text: hasDamage ? voiceText || null : null,
        photos: photoEntries.filter(Boolean) as Awaited<ReturnType<typeof fileToPhotoEntry>>[],
      });

      toast("Salvat local — va fi trimis când revii online", {
        icon: "📥",
        duration: 4000,
      });
      router.push("/dashboard");
    } catch {
      toast.error("Nu s-a putut salva local. Verifică spațiul disponibil.");
    }
  }

  // ── Submit handler ──
  async function handleSubmit() {
    setSubmitting(true);
    try {
      // 1. Get GPS
      const gps = await getGPS();

      // Offline path — save to IndexedDB and exit
      if (!isOnline) {
        await handleOfflineSave(gps);
        return;
      }

      const supabase = createClient();

      // 2. Create checklist row
      const { data: checklist, error: clErr } = await supabase
        .from("checklists")
        .insert({
          driver_id: driverId,
          vehicle_id: vehicle.id,
          gps_lat: gps?.lat ?? null,
          gps_lng: gps?.lng ?? null,
          status: "draft",
        })
        .select()
        .single();

      if (clErr || !checklist) {
        toast.error("Eroare la crearea checklist-ului. Încearcă din nou.");
        return;
      }

      // 3. Upload mandatory photos
      const photoResults: { slot: string; url: string }[] = [];
      for (const slot of ["front", "back", "side"] as PhotoSlot[]) {
        const file = photos[slot];
        if (!file) continue;
        const url = await uploadPhoto(supabase, file, checklist.id, slot);
        if (url) photoResults.push({ slot, url });
      }

      // 4. Upload damage photo if exists
      if (hasDamage && damagePhoto) {
        const url = await uploadPhoto(supabase, damagePhoto, checklist.id, "damage");
        if (url) photoResults.push({ slot: "damage", url });
      }

      // 5. Insert photos metadata
      if (photoResults.length > 0) {
        await supabase.from("checklist_photos").insert(
          photoResults.map(({ slot, url }) => ({
            checklist_id: checklist.id,
            url,
            type: slot as "front" | "back" | "side" | "damage",
          }))
        );
      }

      // 6. Insert checklist_checks
      const safetyPayload = Object.fromEntries(
        SAFETY_GROUPS.flatMap((g) =>
          g.items.map((i) => [i.key, safety[i.key as keyof SafetyChecks]])
        )
      );

      const { error: chkErr } = await supabase.from("checklist_checks").insert({
        checklist_id: checklist.id,
        ...safetyPayload,
        cargo_type: cargoType || null,
        cargo_quantity: cargoQty ? parseInt(cargoQty) : null,
        cargo_notes: cargoNotes || null,
        has_damage: hasDamage,
        damage_description: hasDamage ? damageDesc || null : null,
        damage_voice_text: hasDamage ? voiceText || null : null,
      });

      if (chkErr) {
        toast.error("Eroare la salvarea verificărilor. Încearcă din nou.");
        await supabase.from("checklists").delete().eq("id", checklist.id);
        return;
      }

      // 7. Submit (triggers auto-lock via DB trigger)
      const { error: submitErr } = await supabase
        .from("checklists")
        .update({ status: "submitted" })
        .eq("id", checklist.id);

      if (submitErr) {
        toast.error("Eroare la trimiterea checklist-ului. Încearcă din nou.");
        return;
      }

      // 8. Audit log — non-critical, nu blocăm submit-ul dacă eșuează
      try {
        await supabase.rpc("log_audit", {
          p_action: "submit_checklist",
          p_entity: "checklists",
          p_entity_id: checklist.id,
          p_device_info: {
            ua: navigator.userAgent,
            platform: navigator.platform,
            gps_captured: !!gps,
          },
        });
      } catch { /* audit log failure is non-fatal */ }

      toast.success("Checklist trimis și blocat ✓");
      router.push(`/checklists/${checklist.id}`);
    } catch {
      toast.error("Eroare neașteptată. Încearcă din nou.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Navigation ──
  const totalSteps = STEP_LABELS.length;

  function next() {
    if (!canProceed()) {
      if (step === 1) toast.error("Please capture all 3 mandatory photos");
      if (step === 3) toast.error("Cargo type is required");
      return;
    }
    if (step < totalSteps - 1) setStep((s) => s + 1);
  }

  function prev() {
    if (step > 0) setStep((s) => s - 1);
  }

  const allSafety = Object.values(safety).every(Boolean);
  const safetyCount = Object.values(safety).filter(Boolean).length;
  const safetyTotal = Object.values(safety).length;

  // ── Render steps ──
  return (
    <div className="flex flex-col gap-5 max-w-lg mx-auto pb-8">
      {/* Step indicator */}
      <StepIndicator step={step} total={totalSteps} />

      {/* Step label */}
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          Step {step + 1} of {totalSteps}
        </p>
        <h2 className="text-xl font-bold text-white mt-0.5">
          {STEP_LABELS[step].label}
        </h2>
      </div>

      {/* ── Step 0: Vehicle Info ── */}
      {step === 0 && (
        <Card className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
            <Truck className="w-7 h-7 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Assigned Vehicle</p>
              <Lock className="w-3 h-3 text-slate-600" />
            </div>
            <p className="text-2xl font-bold text-white tracking-wide">{vehicle.plate_number}</p>
            <p className="text-sm text-slate-400">{vehicle.model}</p>
          </div>
        </Card>
      )}

      {/* ── Step 1: Photos ── */}
      {step === 1 && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-slate-400 text-center">
            Capture <span className="text-white font-semibold">3 mandatory photos</span> of the vehicle before departure.
          </p>
          {(["front", "back", "side"] as PhotoSlot[]).map((slot) => (
            <PhotoSlotCard
              key={slot}
              slot={slot}
              file={photos[slot]}
              onCapture={(s, f) => setPhotos((p) => ({ ...p, [s]: f }))}
            />
          ))}
          <div className="flex justify-center gap-6 mt-1">
            {(["front", "back", "side"] as PhotoSlot[]).map((slot) => (
              <div key={slot} className="flex items-center gap-1.5">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${photos[slot] ? "bg-emerald-400" : "bg-surface-600"}`}
                />
                <span className={`text-xs capitalize ${photos[slot] ? "text-emerald-400" : "text-slate-500"}`}>
                  {slot}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Step 2: Safety ── */}
      {step === 2 && (
        <div className="flex flex-col gap-4">
          {/* Progress bar */}
          <Card noPadding className="overflow-hidden">
            <div className="px-4 py-2.5 flex items-center justify-between">
              <span className="text-sm text-slate-400">Safety checks</span>
              <span className={`text-sm font-bold ${allSafety ? "text-emerald-400" : "text-brand-400"}`}>
                {safetyCount}/{safetyTotal}
              </span>
            </div>
            <div className="h-1.5 bg-surface-700">
              <div
                className={`h-full transition-all duration-300 rounded-full ${allSafety ? "bg-emerald-500" : "bg-brand-500"}`}
                style={{ width: `${(safetyCount / safetyTotal) * 100}%` }}
              />
            </div>
          </Card>

          {/* Tap all button */}
          <button
            type="button"
            onClick={() => {
              const allOn = Object.values(safety).every(Boolean);
              const newVal = !allOn;
              setSafety(
                Object.fromEntries(
                  SAFETY_GROUPS.flatMap((g) => g.items.map((i) => [i.key, newVal]))
                ) as SafetyChecks
              );
            }}
            className="text-sm text-brand-400 font-semibold text-center w-full py-1 hover:text-brand-300 transition-colors"
          >
            {allSafety ? "Deselect All" : "Mark All OK"}
          </button>

          {SAFETY_GROUPS.map((group) => (
            <div key={group.label} className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 px-1">
                {group.label}
              </p>
              {group.items.map((item) => (
                <SafetyToggle
                  key={item.key}
                  label={item.label}
                  checked={safety[item.key as keyof SafetyChecks]}
                  onToggle={() =>
                    setSafety((prev) => ({ ...prev, [item.key]: !prev[item.key as keyof SafetyChecks] }))
                  }
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* ── Step 3: Cargo ── */}
      {step === 3 && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Cargo Type <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={cargoType}
              onChange={(e) => setCargoType(e.target.value)}
              placeholder="e.g. Palletised goods, Refrigerated, Hazmat…"
              className="w-full h-12 rounded-xl border border-surface-700 bg-surface-800 text-white
                placeholder-slate-500 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Quantity (pallets / units)
            </label>
            <input
              type="number"
              min="0"
              value={cargoQty}
              onChange={(e) => setCargoQty(e.target.value)}
              placeholder="0"
              className="w-full h-12 rounded-xl border border-surface-700 bg-surface-800 text-white
                placeholder-slate-500 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Notes (optional)
            </label>
            <textarea
              value={cargoNotes}
              onChange={(e) => setCargoNotes(e.target.value)}
              placeholder="Special handling instructions, delivery ref…"
              rows={3}
              className="w-full rounded-xl border border-surface-700 bg-surface-800 text-white
                placeholder-slate-500 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>
        </div>
      )}

      {/* ── Step 4: Damage ── */}
      {step === 4 && (
        <div className="flex flex-col gap-4">
          {/* Damage toggle */}
          <button
            type="button"
            onClick={() => setHasDamage((v) => !v)}
            className={[
              "flex items-center gap-4 w-full rounded-2xl px-5 py-4 border-2 transition-all duration-200 touch-manipulation",
              hasDamage
                ? "bg-amber-500/10 border-amber-500/50"
                : "bg-surface-800 border-surface-700 hover:border-surface-600",
            ].join(" ")}
          >
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                hasDamage ? "bg-amber-500/20" : "bg-surface-700"
              }`}
            >
              <AlertTriangle className={`w-6 h-6 ${hasDamage ? "text-amber-400" : "text-slate-500"}`} />
            </div>
            <div className="flex-1 text-left">
              <p className={`font-bold text-base ${hasDamage ? "text-amber-300" : "text-white"}`}>
                {hasDamage ? "Damage Reported" : "No Damage"}
              </p>
              <p className={`text-sm mt-0.5 ${hasDamage ? "text-amber-400/70" : "text-slate-400"}`}>
                {hasDamage ? "Fill in damage details below" : "Tap to report damage"}
              </p>
            </div>
            {hasDamage ? (
              <CheckCircle2 className="w-6 h-6 text-amber-400 flex-shrink-0" />
            ) : (
              <Circle className="w-6 h-6 text-slate-600 flex-shrink-0" />
            )}
          </button>

          {hasDamage && (
            <div className="flex flex-col gap-4">
              {/* Damage photo */}
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Damage Photo</p>
                <button
                  type="button"
                  onClick={() => damagePhotoRef.current?.click()}
                  className={[
                    "relative w-full aspect-video rounded-2xl border-2 border-dashed overflow-hidden",
                    "flex flex-col items-center justify-center gap-2 transition-all touch-manipulation active:scale-[0.98]",
                    damagePhoto
                      ? "border-amber-500/50 bg-amber-500/5"
                      : "border-surface-600 bg-surface-800 hover:border-amber-500/40",
                  ].join(" ")}
                >
                  {damagePhoto ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={URL.createObjectURL(damagePhoto)}
                        alt="Damage"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setDamagePhoto(null); }}
                        className="absolute top-2 right-2 bg-surface-900/80 rounded-full p-1"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-2xl bg-surface-700 flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-slate-400" />
                      </div>
                      <p className="text-sm text-slate-400">Tap to capture damage photo</p>
                    </>
                  )}
                </button>
                <input
                  ref={damagePhotoRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setDamagePhoto(f);
                  }}
                />
              </div>

              {/* Description + voice */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Description
                  </label>
                  <button
                    type="button"
                    onClick={recording ? stopVoice : startVoice}
                    className={[
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                      recording
                        ? "bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse"
                        : "bg-surface-700 text-slate-300 border border-surface-600 hover:border-brand-500/50",
                    ].join(" ")}
                  >
                    {recording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                    {recording ? "Stop" : "Voice"}
                  </button>
                </div>
                <textarea
                  value={damageDesc}
                  onChange={(e) => setDamageDesc(e.target.value)}
                  placeholder="Describe the damage… (or use voice input)"
                  rows={4}
                  className="w-full rounded-xl border border-surface-700 bg-surface-800 text-white
                    placeholder-slate-500 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                />
                {voiceText && voiceText !== damageDesc && (
                  <p className="text-xs text-slate-500">
                    Voice: <span className="text-slate-400 italic">"{voiceText}"</span>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Step 5: Review & Submit ── */}
      {step === 5 && (
        <div className="flex flex-col gap-3">
          <Card noPadding className="overflow-hidden">
            {/* Vehicle */}
            <div className="px-4 py-3 flex items-center gap-3 border-b border-surface-700">
              <Truck className="w-4 h-4 text-brand-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500">Vehicle</p>
                <p className="text-sm font-semibold text-white">{vehicle.plate_number} — {vehicle.model}</p>
              </div>
            </div>
            {/* Photos */}
            <div className="px-4 py-3 flex items-center gap-3 border-b border-surface-700">
              <Camera className="w-4 h-4 text-brand-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500">Mandatory Photos</p>
                <p className="text-sm font-semibold text-white">
                  {[photos.front, photos.back, photos.side].filter(Boolean).length}/3 captured
                </p>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            </div>
            {/* Safety */}
            <div className="px-4 py-3 flex items-center gap-3 border-b border-surface-700">
              <ShieldCheck className="w-4 h-4 text-brand-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500">Safety Checks</p>
                <p className={`text-sm font-semibold ${allSafety ? "text-emerald-300" : "text-amber-300"}`}>
                  {safetyCount}/{safetyTotal} passed
                </p>
              </div>
              {allSafety ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              )}
            </div>
            {/* Cargo */}
            <div className="px-4 py-3 flex items-center gap-3 border-b border-surface-700">
              <Package className="w-4 h-4 text-brand-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500">Cargo</p>
                <p className="text-sm font-semibold text-white">
                  {cargoType || "—"}{cargoQty ? ` · ${cargoQty} units` : ""}
                </p>
              </div>
            </div>
            {/* Damage */}
            <div className="px-4 py-3 flex items-center gap-3">
              <AlertTriangle className={`w-4 h-4 flex-shrink-0 ${hasDamage ? "text-amber-400" : "text-slate-500"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500">Damage Report</p>
                <p className={`text-sm font-semibold ${hasDamage ? "text-amber-300" : "text-emerald-300"}`}>
                  {hasDamage ? "Damage noted" : "No damage"}
                </p>
              </div>
            </div>
          </Card>

          <Card className="flex items-start gap-3 bg-amber-500/5 border-amber-500/20">
            <Lock className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-amber-300/80">
              Once submitted this checklist will be <span className="font-semibold text-amber-300">permanently locked</span> and cannot be edited. GPS coordinates will be captured automatically.
            </p>
          </Card>

          {!isOnline && (
            <Card className="flex items-start gap-3 bg-slate-500/5 border-slate-600/40">
              <WifiOff className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-slate-400">
                Ești <span className="font-semibold text-slate-300">offline</span>. Checklist-ul va fi salvat local și trimis automat când revii online.
              </p>
            </Card>
          )}
        </div>
      )}

      {/* ── Navigation buttons ── */}
      <div className="flex gap-3 pt-2">
        {step > 0 && (
          <Button
            variant="secondary"
            size="lg"
            onClick={prev}
            disabled={submitting}
            className="flex-1"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </Button>
        )}
        {step < totalSteps - 1 ? (
          <Button
            variant="primary"
            size="lg"
            onClick={next}
            className={step === 0 ? "w-full" : "flex-1"}
          >
            Next
            <ChevronRight className="w-5 h-5" />
          </Button>
        ) : (
          <Button
            variant="primary"
            size="lg"
            fullWidth={step === 0}
            loading={submitting}
            onClick={handleSubmit}
            className="flex-1"
          >
            {isOnline ? (
              <>
                <Lock className="w-5 h-5" />
                Submit & Lock
              </>
            ) : (
              <>
                <WifiOff className="w-5 h-5" />
                Salvează Local
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
