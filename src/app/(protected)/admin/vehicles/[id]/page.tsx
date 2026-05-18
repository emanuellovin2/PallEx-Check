import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EditVehicleForm } from "./EditVehicleForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditVehiclePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: vehicle, error } = await supabase
    .from("vehicles")
    .select("id, plate_number, model, assigned_driver_id")
    .eq("id", id)
    .single();

  if (error || !vehicle) redirect("/admin/vehicles");

  // Fetch all drivers for the assignment selector
  const { data: drivers } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "driver")
    .order("full_name");

  return <EditVehicleForm vehicle={vehicle} drivers={drivers ?? []} />;
}
