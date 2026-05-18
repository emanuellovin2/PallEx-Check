"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  User,
  Lock,
  Truck,
  Eye,
  EyeOff,
  Trash2,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";

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
  role: string;
}

interface Props {
  driver: Driver;
  vehicles: Vehicle[];
  assignedVehicleId: string | null;
}

export function EditDriverForm({ driver, vehicles, assignedVehicleId }: Props) {
  const router = useRouter();
  const [fullName, setFullName] = useState(driver.full_name ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(
    assignedVehicleId
  );
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingVehicle, setSavingVehicle] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // ── Update name ──────────────────────────────────────────────────────────────
  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) { toast.error("Name cannot be empty"); return; }
    setSavingProfile(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: driver.id, fullName: fullName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to update"); return; }
      toast.success("Name updated");
      router.refresh();
    } finally {
      setSavingProfile(false);
    }
  }

  // ── Set new password ─────────────────────────────────────────────────────────
  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setSavingPassword(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: driver.id, password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to set password"); return; }
      toast.success("Password updated successfully");
      setNewPassword("");
    } finally {
      setSavingPassword(false);
    }
  }

  // ── Assign / unassign vehicle ─────────────────────────────────────────────────
  async function handleSaveVehicle(e: React.FormEvent) {
    e.preventDefault();
    setSavingVehicle(true);
    const supabase = createClient();
    try {
      // Un-assign previous vehicle if it's a different one
      if (assignedVehicleId && assignedVehicleId !== selectedVehicleId) {
        await supabase
          .from("vehicles")
          .update({ assigned_driver_id: null })
          .eq("id", assignedVehicleId);
      }

      if (selectedVehicleId) {
        // If selected vehicle was assigned to another driver, un-assign it first
        const prev = vehicles.find((v) => v.id === selectedVehicleId);
        if (prev?.assigned_driver_id && prev.assigned_driver_id !== driver.id) {
          await supabase
            .from("vehicles")
            .update({ assigned_driver_id: null })
            .eq("id", selectedVehicleId);
        }

        const { error } = await supabase
          .from("vehicles")
          .update({ assigned_driver_id: driver.id })
          .eq("id", selectedVehicleId);

        if (error) { toast.error("Failed to assign vehicle"); return; }
        toast.success("Vehicle assigned");
      } else {
        // Unassign current vehicle
        const { error } = await supabase
          .from("vehicles")
          .update({ assigned_driver_id: null })
          .eq("assigned_driver_id", driver.id);

        if (error) { toast.error("Failed to unassign vehicle"); return; }
        toast.success("Vehicle unassigned");
      }
      router.refresh();
    } finally {
      setSavingVehicle(false);
    }
  }

  // ── Delete driver ────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: driver.id }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to delete"); return; }
      toast.success("Driver deleted");
      router.push("/admin/drivers");
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 max-w-lg">
      {/* Back */}
      <Link
        href="/admin/drivers"
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Drivers
      </Link>

      <div>
        <h1 className="text-xl font-bold text-white">
          {driver.full_name || driver.email}
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">{driver.email}</p>
      </div>

      {/* ── Profile ── */}
      <Card className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-500/15 flex items-center justify-center">
            <User className="w-4 h-4 text-brand-400" />
          </div>
          <p className="font-semibold text-white text-sm">Profile</p>
        </div>

        <form onSubmit={handleSaveName} className="flex flex-col gap-3">
          <Input
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            leftIcon={<User className="w-4 h-4" />}
          />
          <Input label="Email" value={driver.email} disabled className="opacity-60 cursor-not-allowed" />
          <Button type="submit" variant="primary" size="sm" loading={savingProfile} className="gap-2 self-start">
            <Save className="w-3.5 h-3.5" />
            Save Name
          </Button>
        </form>
      </Card>

      {/* ── Password ── */}
      <Card className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center">
            <Lock className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <p className="font-semibold text-white text-sm">Set New Password</p>
            <p className="text-xs text-slate-400">Driver will use this to log in</p>
          </div>
        </div>

        <form onSubmit={handleSetPassword} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Input
              label="New Password"
              type={showPassword ? "text" : "password"}
              placeholder="Min. 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-300 w-fit"
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showPassword ? "Hide" : "Show"} password
            </button>
          </div>
          <Button type="submit" variant="primary" size="sm" loading={savingPassword} className="gap-2 self-start">
            <Lock className="w-3.5 h-3.5" />
            Update Password
          </Button>
        </form>
      </Card>

      {/* ── Vehicle Assignment ── */}
      <Card className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center">
            <Truck className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <p className="font-semibold text-white text-sm">Assigned Vehicle</p>
            <p className="text-xs text-slate-400">Driver only sees this vehicle</p>
          </div>
        </div>

        <form onSubmit={handleSaveVehicle} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Vehicle</label>
            <select
              value={selectedVehicleId ?? ""}
              onChange={(e) => setSelectedVehicleId(e.target.value || null)}
              className="w-full h-11 rounded-xl bg-surface-800 border border-surface-700 text-white
                px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500
                transition-colors appearance-none cursor-pointer"
            >
              <option value="">— No vehicle assigned —</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plate_number} · {v.model}
                  {v.assigned_driver_id && v.assigned_driver_id !== driver.id
                    ? " (assigned to another driver)"
                    : ""}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" variant="primary" size="sm" loading={savingVehicle} className="gap-2 self-start">
            <Truck className="w-3.5 h-3.5" />
            Save Assignment
          </Button>
        </form>
      </Card>

      {/* ── Danger Zone ── */}
      <Card className="flex flex-col gap-3 border-red-900/40">
        <p className="font-semibold text-red-400 text-sm">Danger Zone</p>
        <p className="text-xs text-slate-400">
          Deleting a driver removes their account and all associated data permanently.
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
          {confirmDelete ? "Confirm Delete" : "Delete Driver"}
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
