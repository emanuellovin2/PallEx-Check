import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Truck, Plus, User } from "lucide-react";

export default async function AdminVehiclesPage() {
  const supabase = await createClient();

  // Fetch all vehicles with assigned driver name
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("id, plate_number, model, assigned_driver_id, created_at")
    .order("plate_number");

  // Fetch driver names
  const driverIds = vehicles
    ?.map((v) => v.assigned_driver_id)
    .filter(Boolean) as string[];

  let driverMap: Record<string, string> = {};
  if (driverIds.length) {
    const { data: drivers } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", driverIds);

    driverMap = Object.fromEntries(
      (drivers ?? []).map((d) => [d.id, d.full_name || d.email])
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Vehicule</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {vehicles?.length ?? 0} vehicul{vehicles?.length !== 1 ? "e" : ""} în flotă
          </p>
        </div>
        <Link href="/admin/vehicles/new">
          <Button variant="primary" size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Adaugă Vehicul
          </Button>
        </Link>
      </div>

      {/* List */}
      {!vehicles?.length ? (
        <Card className="flex flex-col items-center justify-center py-14 gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl bg-surface-700 flex items-center justify-center">
            <Truck className="w-7 h-7 text-slate-500" />
          </div>
          <div>
            <p className="font-medium text-white">Niciun vehicul înregistrat</p>
            <p className="text-sm text-slate-400 mt-1">Adaugă vehicule pentru a le aloca șoferilor</p>
          </div>
          <Link href="/admin/vehicles/new">
            <Button variant="primary" size="sm" className="gap-2 mt-2">
              <Plus className="w-4 h-4" />
              Adaugă Vehicul
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {vehicles.map((vehicle) => {
            const driverName = vehicle.assigned_driver_id
              ? driverMap[vehicle.assigned_driver_id]
              : null;
            return (
              <Link key={vehicle.id} href={`/admin/vehicles/${vehicle.id}`}>
                <Card
                  noPadding
                  className="flex items-center gap-4 px-4 py-3.5 hover:border-surface-600
                    active:scale-[0.99] transition-all cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                    <Truck className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm">
                      {vehicle.plate_number}
                    </p>
                    <p className="text-xs text-slate-400">{vehicle.model}</p>
                    {driverName && (
                      <div className="flex items-center gap-1 mt-1">
                        <User className="w-3 h-3 text-brand-400" />
                        <span className="text-xs text-brand-400">{driverName}</span>
                      </div>
                    )}
                  </div>
                  <Badge variant={driverName ? "success" : "default"}>
                    {driverName ? "Alocat" : "Disponibil"}
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
