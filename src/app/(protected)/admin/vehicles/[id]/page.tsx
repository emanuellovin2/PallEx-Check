import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EditVehicleForm } from "./EditVehicleForm";
import { VehicleDocuments } from "@/components/admin/VehicleDocuments";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditVehiclePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const [vehicleRes, driversRes, docsRes] = await Promise.all([
    supabase
      .from("vehicles")
      .select("id, plate_number, model, assigned_driver_id")
      .eq("id", id)
      .single(),
    supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("role", "driver")
      .order("full_name"),
    supabase
      .from("vehicle_documents")
      .select("id, vehicle_id, doc_type, label, expires_at, issued_at, notes")
      .eq("vehicle_id", id)
      .order("expires_at"),
  ]);

  if (vehicleRes.error || !vehicleRes.data) redirect("/admin/vehicles");

  return (
    <div className="flex flex-col gap-5 max-w-lg">
      <EditVehicleForm
        vehicle={vehicleRes.data}
        drivers={driversRes.data ?? []}
      />
      <VehicleDocuments
        vehicleId={id}
        documents={docsRes.data ?? []}
      />
    </div>
  );
}
