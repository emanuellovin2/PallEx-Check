import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EditDriverForm } from "./EditDriverForm";
import { DriverPointsManager } from "@/components/admin/DriverPointsManager";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditDriverPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const [driverRes, vehiclesRes, pointsRes, eventsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .eq("id", id)
      .eq("role", "driver")
      .single(),
    supabase
      .from("vehicles")
      .select("id, plate_number, model, assigned_driver_id")
      .order("plate_number"),
    supabase
      .from("point_events")
      .select("amount")
      .eq("driver_id", id),
    supabase
      .from("point_events")
      .select("id, amount, reason, source, created_at")
      .eq("driver_id", id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  if (driverRes.error || !driverRes.data) redirect("/admin/drivers");

  const assignedVehicle = vehiclesRes.data?.find((v) => v.assigned_driver_id === id) ?? null;
  const totalPoints = (pointsRes.data ?? []).reduce((s, e) => s + (e.amount as number), 0);

  return (
    <div className="flex flex-col gap-5 max-w-lg">
      <EditDriverForm
        driver={driverRes.data}
        vehicles={vehiclesRes.data ?? []}
        assignedVehicleId={assignedVehicle?.id ?? null}
      />
      <DriverPointsManager
        driverId={id}
        driverName={driverRes.data.full_name || driverRes.data.email}
        totalPoints={totalPoints}
        recentEvents={(eventsRes.data ?? []) as { id: string; amount: number; reason: string; source: string; created_at: string }[]}
      />
    </div>
  );
}
