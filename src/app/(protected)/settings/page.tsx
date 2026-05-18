"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { User, LogOut, Bell, Shield } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }

      const { data } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .single();

      setEmail(user.email ?? "");
      setFullName(data?.full_name ?? "");
      setRole(data?.role ?? "driver");
      setLoading(false);
    })();
  }, [router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim(), updated_at: new Date().toISOString() })
      .eq("id", user.id);

    if (error) toast.error("Failed to save");
    else toast.success("Profile updated");
    setSaving(false);
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Signed out");
    router.push("/auth/login");
  }

  return (
    <div className="flex flex-col gap-5 max-w-lg">
      <h1 className="text-xl font-bold text-white">Settings</h1>

      {/* Profile */}
      <Card className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/15 flex items-center justify-center">
            <User className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <p className="font-semibold text-white text-sm">Profile</p>
            <p className="text-xs text-slate-400 capitalize">{role}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-3">
          <Input
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={loading}
          />
          <Input
            label="Email"
            value={email}
            disabled
            className="opacity-60 cursor-not-allowed"
          />
          <Button type="submit" variant="primary" loading={saving} disabled={loading}>
            Save Changes
          </Button>
        </form>
      </Card>

      {/* App info */}
      <Card className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-brand-400" />
          <p className="font-semibold text-white text-sm">App Info</p>
        </div>
        <div className="flex items-center justify-between py-1 border-t border-surface-700">
          <span className="text-sm text-slate-400">Version</span>
          <span className="text-sm text-white font-medium">0.1.0</span>
        </div>
        <div className="flex items-center justify-between py-1 border-t border-surface-700">
          <span className="text-sm text-slate-400">Platform</span>
          <span className="text-sm text-white font-medium">PWA</span>
        </div>
      </Card>

      {/* Sign out */}
      <Button variant="danger" size="lg" fullWidth onClick={handleSignOut}>
        <LogOut className="w-4 h-4" />
        Sign Out
      </Button>
    </div>
  );
}
