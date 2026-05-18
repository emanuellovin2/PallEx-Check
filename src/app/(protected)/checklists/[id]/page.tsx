import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Truck,
  Camera,
  ShieldCheck,
  Package,
  AlertTriangle,
  Lock,
  CheckCircle2,
  XCircle,
  MapPin,
  Clock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ChecklistDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // Fetch checklist with vehicle and driver info
  const { data: checklist } = await supabase
    .from("checklists")
    .select(`
      *,
      vehicles (plate_number, model),
      profiles (full_name, email)
    `)
    .eq("id", id)
    .single();

  if (!checklist) notFound();

  // Access control: driver can only see own checklists
  if (profile?.role !== "admin" && checklist.driver_id !== user.id) {
    redirect("/checklists");
  }

  // Fetch checks
  const { data: checks } = await supabase
    .from("checklist_checks")
    .select("*")
    .eq("checklist_id", id)
    .single();

  // Fetch photos
  const { data: photos } = await supabase
    .from("checklist_photos")
    .select("*")
    .eq("checklist_id", id);

  const vehicle = checklist.vehicles as { plate_number: string; model: string } | null;
  const driver = checklist.profiles as { full_name: string; email: string } | null;
  const isLocked = checklist.locked;
  const isSubmitted = checklist.status === "submitted";

  const SAFETY_FIELDS: [string, string][] = [
    ["tyre_front_left", "Anvelopă față stânga"],
    ["tyre_front_right", "Anvelopă față dreapta"],
    ["tyre_rear_left", "Anvelopă spate stânga"],
    ["tyre_rear_right", "Anvelopă spate dreapta"],
    ["tyre_spare", "Roată de rezervă"],
    ["headlights", "Faruri față"],
    ["taillights", "Stopuri spate"],
    ["indicators", "Semnalizatoare"],
    ["brake_lights", "Lumini de frână"],
    ["foot_brake", "Frână de picior"],
    ["handbrake", "Frână de mână"],
    ["engine_oil", "Ulei motor"],
    ["coolant", "Lichid răcire"],
    ["fuel_level", "Nivel combustibil"],
    ["windscreen", "Parbriz"],
    ["wipers", "Ștergătoare"],
    ["mirrors", "Oglinzi"],
    ["doors_secure", "Uși asigurate"],
    ["seatbelts", "Centuri"],
    ["cargo_secured", "Marfă asigurată"],
    ["fire_extinguisher", "Extinctor"],
    ["first_aid_kit", "Trusă prim ajutor"],
    ["hi_vis_vest", "Vestă reflectorizantă"],
  ];

  const photosByType = (type: string) =>
    photos?.filter((p) => p.type === type) ?? [];

  const passCount = SAFETY_FIELDS.filter(([key]) => checks?.[key as keyof typeof checks] === true).length;
  const failCount = SAFETY_FIELDS.filter(([key]) => checks?.[key as keyof typeof checks] === false).length;

  return (
    <div className="flex flex-col gap-5 max-w-lg pb-8">
      {/* Top bar */}
      <div className="flex items-center gap-3">
        <Link href="/checklists">
          <button className="p-2 rounded-xl bg-surface-800 text-slate-400 hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-white truncate">Checklist</h1>
          <p className="text-xs text-slate-500 truncate">{id.slice(0, 8)}…</p>
        </div>
        {isLocked && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-700 border border-surface-600">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-400 font-medium">Blocat</span>
          </div>
        )}
      </div>

      {/* Status + timestamp */}
      <Card noPadding className="overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between border-b border-surface-700">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Status</span>
          <Badge variant={isSubmitted ? "success" : "warning"}>
            {isSubmitted ? "Trimis" : "Ciornă"}
          </Badge>
        </div>
        {checklist.submitted_at && (
          <div className="px-4 py-3 flex items-center gap-2 border-b border-surface-700">
            <Clock className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <div>
              <p className="text-xs text-slate-500">Trimis</p>
              <p className="text-sm text-white font-medium">
                {new Date(checklist.submitted_at).toLocaleString("ro-RO", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        )}
        {(checklist.gps_lat || checklist.gps_lng) && (
          <div className="px-4 py-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <div>
              <p className="text-xs text-slate-500">Locație GPS</p>
              <p className="text-sm text-white font-medium font-mono">
                {Number(checklist.gps_lat).toFixed(6)}, {Number(checklist.gps_lng).toFixed(6)}
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Vehicle & Driver */}
      <SectionHeader icon={<Truck className="w-4 h-4" />} label="Vehicul" />
      <Card noPadding className="overflow-hidden">
        <div className="px-4 py-3 flex items-center gap-3 border-b border-surface-700">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
            <Truck className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="font-bold text-white">{vehicle?.plate_number ?? "—"}</p>
            <p className="text-sm text-slate-400">{vehicle?.model ?? "—"}</p>
          </div>
        </div>
        {profile?.role === "admin" && (
          <div className="px-4 py-3">
            <p className="text-xs text-slate-500">Șofer</p>
            <p className="text-sm text-white font-medium">{driver?.full_name || driver?.email || "—"}</p>
          </div>
        )}
      </Card>

      {/* Mandatory Photos */}
      <SectionHeader icon={<Camera className="w-4 h-4" />} label="Poze obligatorii" />
      <div className="grid grid-cols-3 gap-2">
        {(["front", "back", "side"] as const).map((slot) => {
          const slotPhotos = photosByType(slot);
          const photo = slotPhotos[0];
          return (
            <div key={slot} className="flex flex-col gap-1">
              <p className="text-xs text-center capitalize text-slate-500">{slot}</p>
              <div
                className={[
                  "aspect-square rounded-xl overflow-hidden border",
                  photo ? "border-emerald-500/30" : "border-surface-600 bg-surface-800",
                ].join(" ")}
              >
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photo.url} alt={slot} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Camera className="w-5 h-5 text-slate-600" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Safety Checks */}
      <SectionHeader
        icon={<ShieldCheck className="w-4 h-4" />}
        label="Verificări siguranță"
        badge={`${passCount}/${SAFETY_FIELDS.length} trecute`}
        badgeVariant={passCount === SAFETY_FIELDS.length ? "success" : "warning"}
      />
      {checks ? (
        <Card noPadding className="overflow-hidden">
          {SAFETY_FIELDS.map(([key, label], i) => {
            const val = checks[key as keyof typeof checks] as boolean | null;
            return (
              <div
                key={key}
                className={[
                  "px-4 py-3 flex items-center justify-between",
                  i < SAFETY_FIELDS.length - 1 ? "border-b border-surface-700" : "",
                ].join(" ")}
              >
                <span className="text-sm text-white">{label}</span>
                {val === true ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                ) : val === false ? (
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                ) : (
                  <span className="text-xs text-slate-600">—</span>
                )}
              </div>
            );
          })}
          {checks.notes && (
            <div className="px-4 py-3 border-t border-surface-700">
              <p className="text-xs text-slate-500 mb-1">Note</p>
              <p className="text-sm text-white">{checks.notes}</p>
            </div>
          )}
        </Card>
      ) : (
        <Card>
          <p className="text-sm text-slate-500 text-center">Nicio verificare de siguranță înregistrată</p>
        </Card>
      )}

      {/* Cargo */}
      <SectionHeader icon={<Package className="w-4 h-4" />} label="Detalii marfă" />
      <Card noPadding className="overflow-hidden">
        <InfoRow label="Tip" value={checks?.cargo_type ?? null} />
        <InfoRow
          label="Cantitate"
          value={checks?.cargo_quantity != null ? String(checks.cargo_quantity) : null}
          bordered
        />
        {checks?.cargo_notes && (
          <div className="px-4 py-3 border-t border-surface-700">
            <p className="text-xs text-slate-500 mb-1">Note</p>
            <p className="text-sm text-white">{checks.cargo_notes}</p>
          </div>
        )}
      </Card>

      {/* Damage */}
      <SectionHeader
        icon={<AlertTriangle className="w-4 h-4" />}
        label="Raport daune"
        badge={checks?.has_damage ? "Daune notate" : "Fără daune"}
        badgeVariant={checks?.has_damage ? "warning" : "success"}
      />
      {checks?.has_damage ? (
        <div className="flex flex-col gap-3">
          {photosByType("damage").length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {photosByType("damage").map((p) => (
                <div key={p.id} className="aspect-video rounded-xl overflow-hidden border border-amber-500/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt="Damage" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
          {(checks?.damage_description || checks?.damage_voice_text) && (
            <Card>
              {checks?.damage_description && (
                <p className="text-sm text-white">{checks.damage_description}</p>
              )}
              {checks?.damage_voice_text && checks.damage_voice_text !== checks.damage_description && (
                <p className="text-xs text-slate-500 mt-2 italic">
                  Transcriere vocală: "{checks.damage_voice_text}"
                </p>
              )}
            </Card>
          )}
        </div>
      ) : (
        <Card className="bg-emerald-500/5 border-emerald-500/20">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <p className="text-sm text-emerald-300">Nicio daună raportată</p>
          </div>
        </Card>
      )}
    </div>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function SectionHeader({
  icon,
  label,
  badge,
  badgeVariant,
}: {
  icon: React.ReactNode;
  label: string;
  badge?: string;
  badgeVariant?: "success" | "warning" | "info";
}) {
  return (
    <div className="flex items-center justify-between px-1">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
      </div>
      {badge && <Badge variant={badgeVariant ?? "info"}>{badge}</Badge>}
    </div>
  );
}

function InfoRow({
  label,
  value,
  bordered,
}: {
  label: string;
  value: string | null | undefined;
  bordered?: boolean;
}) {
  return (
    <div className={`px-4 py-3 flex items-center justify-between ${bordered ? "border-t border-surface-700" : ""}`}>
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-sm text-white font-medium">{value ?? "—"}</span>
    </div>
  );
}
