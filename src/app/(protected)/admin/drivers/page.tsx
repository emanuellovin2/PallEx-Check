import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Users, User, Plus, Truck } from "lucide-react";

export default async function AdminDriversPage() {
  const supabase = await createClient();

  // Fetch all drivers with their assigned vehicle
  const { data: drivers } = await supabase
    .from("profiles")
    .select("id, full_name, email, created_at")
    .eq("role", "driver")
    .order("created_at", { ascending: false });

  // Fetch vehicles to map driver → vehicle
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("id, plate_number, model, assigned_driver_id")
    .not("assigned_driver_id", "is", null);

  const vehicleByDriver = Object.fromEntries(
    (vehicles ?? []).map((v) => [v.assigned_driver_id!, v])
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Drivers</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {drivers?.length ?? 0} driver{drivers?.length !== 1 ? "s" : ""} registered
          </p>
        </div>
        <Link href="/admin/drivers/new">
          <Button variant="primary" size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Add Driver
          </Button>
        </Link>
      </div>

      {/* List */}
      {!drivers?.length ? (
        <Card className="flex flex-col items-center justify-center py-14 gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl bg-surface-700 flex items-center justify-center">
            <Users className="w-7 h-7 text-slate-500" />
          </div>
          <div>
            <p className="font-medium text-white">No drivers yet</p>
            <p className="text-sm text-slate-400 mt-1">Add your first driver to get started</p>
          </div>
          <Link href="/admin/drivers/new">
            <Button variant="primary" size="sm" className="gap-2 mt-2">
              <Plus className="w-4 h-4" />
              Add Driver
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {drivers.map((driver) => {
            const vehicle = vehicleByDriver[driver.id];
            return (
              <Link key={driver.id} href={`/admin/drivers/${driver.id}`}>
                <Card
                  noPadding
                  className="flex items-center gap-4 px-4 py-3.5 hover:border-surface-600
                    active:scale-[0.99] transition-all cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-brand-500/15 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-brand-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm">
                      {driver.full_name || "—"}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{driver.email}</p>
                    {vehicle && (
                      <div className="flex items-center gap-1 mt-1">
                        <Truck className="w-3 h-3 text-emerald-400" />
                        <span className="text-xs text-emerald-400">
                          {vehicle.plate_number} · {vehicle.model}
                        </span>
                      </div>
                    )}
                  </div>
                  <Badge variant={vehicle ? "success" : "warning"}>
                    {vehicle ? "Assigned" : "No vehicle"}
                  </Badge>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
