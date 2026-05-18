"use client";

import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { BottomNav } from "@/components/layout/BottomNav";
import { OfflineBanner } from "@/components/offline/OfflineBanner";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import type { Role } from "@/types/database";

interface Props {
  role: Role;
  userName: string;
  children: React.ReactNode;
}

export function ProtectedLayoutClient({ role, userName, children }: Props) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Ai fost deconectat");
    router.push("/auth/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-surface-950">
      {/* Desktop sidebar */}
      <Sidebar role={role} userName={userName} onSignOut={handleSignOut} />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <TopBar userName={userName} />

        {/* Offline status banner */}
        <OfflineBanner />

        {/* Page content */}
        <main className="flex-1 px-4 py-5 pb-24 md:px-6 md:py-6 md:pb-6 max-w-5xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <BottomNav role={role} />
    </div>
  );
}
