import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EditDriverForm } from "./EditDriverForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditDriverPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch driver profile
  const { data: driver, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("id", id)
    .eq("role", "driver")
    .single();

  if (error || !driver) redirect("/admin/drivers");

  // Fetch all vehicles for the assignment selector
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("id, plate_number, model, assigned_driver_id")
    .order("plate_number");

  // Find which vehicle is currently assigned to this driver
  const assignedVehicle = vehicles?.find((v) => v.assigned_driver_id === id) ?? null;

  return (
    <EditDriverForm
      driver={driver}
      vehicles={vehicles ?? []}
      assignedVehicleId={assignedVehicle?.id ?? null}
    />
  );
}
