"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowLeft, Truck, Hash } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export default function NewVehiclePage() {
  const router = useRouter();
  const [plateNumber, setPlateNumber] = useState("");
  const [model, setModel] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const newErrors: Record<string, string> = {};
    if (!plateNumber.trim()) newErrors.plateNumber = "Plate number is required";
    if (!model.trim()) newErrors.model = "Vehicle model is required";
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.from("vehicles").insert({
      plate_number: plateNumber.trim().toUpperCase(),
      model: model.trim(),
    });

    setLoading(false);

    if (error) {
      if (error.code === "23505") {
        toast.error("A vehicle with this plate number already exists");
      } else {
        toast.error(error.message);
      }
      return;
    }

    toast.success("Vehicle added successfully");
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
        <h1 className="text-xl font-bold text-white">Add Vehicle</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Register a new vehicle in the fleet.
        </p>
      </div>

      <Card className="flex flex-col gap-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Plate Number"
            type="text"
            placeholder="ABC 123"
            value={plateNumber}
            onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
            error={errors.plateNumber}
            leftIcon={<Hash className="w-4 h-4" />}
            autoComplete="off"
            autoCapitalize="characters"
          />

          <Input
            label="Vehicle Model"
            type="text"
            placeholder="e.g. Mercedes Actros 2023"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            error={errors.model}
            leftIcon={<Truck className="w-4 h-4" />}
          />

          <div className="pt-2 flex flex-col gap-2">
            <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
              Add Vehicle
            </Button>
            <Link href="/admin/vehicles">
              <Button type="button" variant="ghost" size="lg" fullWidth>
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
