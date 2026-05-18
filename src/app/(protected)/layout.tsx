import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/types/database";
import { ProtectedLayoutClient } from "./ProtectedLayoutClient";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  const role: Role = profile?.role ?? "driver";
  const userName = profile?.full_name ?? user.email ?? "User";

  return (
    <ProtectedLayoutClient role={role} userName={userName}>
      {children}
    </ProtectedLayoutClient>
  );
}
