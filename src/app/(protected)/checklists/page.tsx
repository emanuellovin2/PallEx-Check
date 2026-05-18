import Link from "next/link";
import { Plus, ClipboardList, Lock, Truck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

function fmtRo(ts: string) {
  return new Date(ts).toLocaleDateString("ro-RO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  } as Intl.DateTimeFormatOptions);
}

export default async function ChecklistsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();

  const isAdmin = profile?.role === "admin";

  const query = supabase
    .from("checklists")
    .select("*, vehicles(plate_number, model)")
    .order("created_at", { ascending: false })
    .limit(50);

  if (!isAdmin) query.eq("driver_id", user.id);

  const { data: checklists } = await query;

  return (
    <div className="flex flex-col gap-5 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Checklist-uri</h1>
          {checklists && checklists.length > 0 && (
            <p className="text-xs text-surface-400 mt-0.5">{checklists.length} înregistrări</p>
          )}
        </div>
        {!isAdmin && (
          <Link href="/checklists/new">
            <Button size="sm" variant="primary">
              <Plus className="w-4 h-4" />
              Nou
            </Button>
          </Link>
        )}
      </div>

      {!checklists?.length ? (
        <Card className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface-700 flex items-center justify-center">
            <ClipboardList className="w-8 h-8 text-surface-500" />
          </div>
          <div>
            <p className="font-semibold text-white">Niciun checklist încă</p>
            <p className="text-sm text-surface-400 mt-1">Pornește prima inspecție de vehicul</p>
          </div>
          {!isAdmin && (
            <Link href="/checklists/new">
              <Button variant="primary" size="lg">Pornește Checklist</Button>
            </Link>
          )}
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {checklists.map((c) => {
            const vehicle = c.vehicles as { plate_number: string; model: string } | null;
            const isSubmitted = c.status === "submitted";
            return (
              <Link key={c.id} href={`/checklists/${c.id}`}>
                <Card
                  noPadding
                  className="flex items-center gap-3 px-4 py-4 hover:border-surface-600 active:scale-[0.99] transition-all cursor-pointer"
                >
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isSubmitted ? "bg-emerald-500/15" : "bg-surface-700"
                    }`}
                  >
                    {isSubmitted ? (
                      <Lock className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <ClipboardList className="w-5 h-5 text-surface-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-surface-500 flex-shrink-0" />
                      <p className="font-bold text-white text-sm truncate">
                        {vehicle?.plate_number ?? "—"}
                      </p>
                      {vehicle?.model && (
                        <span className="text-surface-500 text-xs truncate">{vehicle.model}</span>
                      )}
                    </div>
                    <p className="text-xs text-surface-400 mt-0.5">{fmtRo(c.created_at)}</p>
                  </div>

                  <Badge variant={isSubmitted ? "success" : "warning"}>
                    {isSubmitted ? "Trimis" : "Draft"}
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
