import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Truck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ChecklistWizard } from "@/components/checklist/ChecklistWizard";
import { Card } from "@/components/ui/Card";

export default async function NewChecklistPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Must be a driver
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (profile?.role === "admin") redirect("/dashboard");

  // Fetch assigned vehicle (read-only — admin pre-assigns)
  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("id, plate_number, model")
    .eq("assigned_driver_id", user.id)
    .single();

  return (
    <div className="flex flex-col gap-5 max-w-lg">
      {/* Top bar */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard">
          <button className="p-2 rounded-xl bg-surface-800 text-slate-400 hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
        </Link>
        <h1 className="text-xl font-bold text-white">Pre-Departure Check</h1>
      </div>

      {/* No vehicle assigned */}
      {!vehicle ? (
        <Card className="flex flex-col items-center justify-center py-14 gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface-700 flex items-center justify-center">
            <Truck className="w-8 h-8 text-slate-500" />
          </div>
          <div>
            <p className="font-bold text-white text-lg">No Vehicle Assigned</p>
            <p className="text-sm text-slate-400 mt-1 max-w-xs mx-auto">
              Your fleet manager needs to assign a vehicle to your account before you can start a checklist.
            </p>
          </div>
          <Link href="/dashboard">
            <button className="mt-2 px-5 py-2.5 rounded-xl bg-surface-700 text-white text-sm font-semibold hover:bg-surface-600 transition-colors">
              Back to Dashboard
            </button>
          </Link>
        </Card>
      ) : (
        <ChecklistWizard vehicle={vehicle} driverId={user.id} />
      )}
    </div>
  );
}
