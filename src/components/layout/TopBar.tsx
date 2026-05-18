"use client";

import { Truck, LogOut, WifiOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface TopBarProps {
  title?: string;
  userName: string;
}

export function TopBar({ title = "PallEx Check", userName }: TopBarProps) {
  const router = useRouter();
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    const on  = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online",  on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Deconectat");
    router.push("/auth/login");
    router.refresh();
  }

  return (
    <header
      className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 h-14 bg-surface-900/98 backdrop-blur-xl border-b border-surface-700/80"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-brand-500 flex items-center justify-center shadow-sm shadow-brand-500/40">
          <Truck className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-white text-[15px] tracking-tight">{title}</span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1.5">
        {!online ? (
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/10 text-red-400 text-xs font-semibold">
            <WifiOff className="w-3.5 h-3.5" />
            <span>Offline</span>
          </div>
        ) : (
          <span className="w-2 h-2 rounded-full bg-emerald-400 mr-1" aria-label="Online" />
        )}

        <span className="text-xs text-surface-400 max-w-[90px] truncate">
          {userName.split(" ")[0]}
        </span>

        <button
          onClick={handleSignOut}
          className="p-2 rounded-xl text-surface-500 hover:text-red-400 hover:bg-surface-800 transition-colors touch-manipulation"
          aria-label="Deconectare"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
