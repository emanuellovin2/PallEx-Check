"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowLeft, Truck, Hash, User, Save, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

interface Vehicle {
  id: string;
  plate_number: string;
  model: string;
  assigned_driver_id: string | null;
}

interface Driver {
  id: string;
  full_name: string | null;
  email: string;
}

interface Props {
  vehicle: Vehicle;
  drivers: Driver[];
}

export function EditVehicleForm({ vehicle, drivers }: Props) {
  const router = useRouter();
  const [plateNumber, setPlateNumber] = useState(vehicle.plate_number);
  const [model, setModel] = useState(vehicle.model);
  const [assignedDriverId, setAssignedDriverId] = useState<string | null>(
    vehicle.assigned_driver_id
  );
  const [savingDetails, setSavingDetails] = useState(false);
  const [savingDriver, setSavingDriver] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // ── Update plate + model ─────────────────────────────────────────────────────
  async function handleSaveDetails(e: React.FormEvent) {
    e.preventDefault();
    if (!plateNumber.trim() || !model.trim()) {
      toast.error("Plate number and model are required");
      return;
    }
    setSavingDetails(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("vehicles")
      .update({ plate_number: plateNumber.trim().toUpperCase(), model: model.trim() })
      .eq("id", vehicle.id);
    setSavingDetails(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Vehicle details updated");
    router.refresh();
  }

  // ── Assign driver ─────────────────────────────────────────────────────────────
  async function handleSaveDriver(e: React.FormEvent) {
    e.preventDefault();
    setSavingDriver(true);
    const supabase = createClient();

    // If assigning a new driver, un-assign their previous vehicle first
    if (assignedDriverId && assignedDriverId !== vehicle.assigned_driver_id) {
      await supabase
        .from("vehicles")
        .update({ assigned_driver_id: null })
        .eq("assigned_driver_id", assignedDriverId)
        .neq("id", vehicle.id);
    }

    const { error } = await supabase
      .from("vehicles")
      .update({ assigned_driver_id: assignedDriverId })
      .eq("id", vehicle.id);

    setSavingDriver(false);
    if (error) { toast.error(error.message); return; }
    toast.success(assignedDriverId ? "Driver assigned" : "Driver unassigned");
    router.refresh();
  }

  // ── Delete vehicle ────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase.from("vehicles").delete().eq("id", vehicle.id);
    setDeleting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Vehicle deleted");
    router.push("/admin/vehicles");
  }

  return (
    <div className="flex flex-col gap-5 max-w-lg">
      <Link
        href="/admin/vehicles"
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Vehicles
      </Link>

      <div>
        <h1 className="text-xl font-bold text-white">{vehicle.plate_number}</h1>
        <p className="text-slate-400 text-sm mt-0.5">{vehicle.model}</p>
      </div>

      {/* ── Vehicle Details ── */}
      <Card className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center">
            <Truck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="font-semibold text-white text-sm">Vehicle Details</p>
        </div>
        <form onSubmit={handleSaveDetails} className="flex flex-col gap-3">
          <Input
            label="Plate Number"
            value={plateNumber}
            onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
            leftIcon={<Hash className="w-4 h-4" />}
            autoCapitalize="characters"
          />
          <Input
            label="Vehicle Model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            leftIcon={<Truck className="w-4 h-4" />}
          />
          <Button type="submit" variant="primary" size="sm" loading={savingDetails} className="gap-2 self-start">
            <Save className="w-3.5 h-3.5" />
            Save Details
          </Button>
        </form>
      </Card>

      {/* ── Driver Assignment ── */}
      <Card className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-500/15 flex items-center justify-center">
            <User className="w-4 h-4 text-brand-400" />
          </div>
          <div>
            <p className="font-semibold text-white text-sm">Assigned Driver</p>
            <p className="text-xs text-slate-400">Only this driver will see the vehicle</p>
          </div>
        </div>
        <form onSubmit={handleSaveDriver} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Driver</label>
            <select
              value={assignedDriverId ?? ""}
              onChange={(e) => setAssignedDriverId(e.target.value || null)}
              className="w-full h-11 rounded-xl bg-surface-800 border border-surface-700 text-white
                px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500
                transition-colors appearance-none cursor-pointer"
            >
              <option value="">— No driver assigned —</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.full_name || d.email}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" variant="primary" size="sm" loading={savingDriver} className="gap-2 self-start">
            <User className="w-3.5 h-3.5" />
            Save Assignment
          </Button>
        </form>
      </Card>

      {/* ── Danger Zone ── */}
      <Card className="flex flex-col gap-3 border-red-900/40">
        <p className="font-semibold text-red-400 text-sm">Danger Zone</p>
        <p className="text-xs text-slate-400">
          Deleting this vehicle will unassign it from any driver. Checklists referencing
          this vehicle will be kept but the vehicle field will be cleared.
        </p>
        <Button
          type="button"
          variant="danger"
          size="sm"
          loading={deleting}
          onClick={handleDelete}
          className="gap-2 self-start"
        >
          <Trash2 className="w-3.5 h-3.5" />
          {confirmDelete ? "Confirm Delete" : "Delete Vehicle"}
        </Button>
        {confirmDelete && !deleting && (
          <button
            onClick={() => setConfirmDelete(false)}
            className="text-xs text-slate-400 hover:text-slate-300 self-start"
          >
            Cancel
          </button>
        )}
      </Card>
    </div>
  );
}
