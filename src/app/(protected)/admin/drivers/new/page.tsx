"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowLeft, User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export default function NewDriverPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) newErrors.fullName = "Full name is required";
    if (!email.trim()) newErrors.email = "Email is required";
    if (password.length < 8) newErrors.password = "Password must be at least 8 characters";
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, fullName, role: "driver" }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to create driver");
        return;
      }

      toast.success(`Driver "${fullName}" created successfully`);
      router.push("/admin/drivers");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 max-w-lg">
      {/* Back */}
      <Link
        href="/admin/drivers"
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Drivers
      </Link>

      <div>
        <h1 className="text-xl font-bold text-white">Add Driver</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          The driver will be able to log in immediately with these credentials.
        </p>
      </div>

      <Card className="flex flex-col gap-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Full Name"
            type="text"
            placeholder="John Driver"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            error={errors.fullName}
            leftIcon={<User className="w-4 h-4" />}
            autoComplete="name"
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="driver@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            leftIcon={<Mail className="w-4 h-4" />}
            autoComplete="email"
            inputMode="email"
          />

          <div className="flex flex-col gap-1.5">
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              leftIcon={<Lock className="w-4 h-4" />}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-300 w-fit"
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showPassword ? "Hide password" : "Show password"}
            </button>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
              Create Driver Account
            </Button>
            <Link href="/admin/drivers">
              <Button type="button" variant="ghost" size="lg" fullWidth>
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </Card>

      <div className="bg-surface-800/50 border border-surface-700 rounded-xl px-4 py-3">
        <p className="text-xs text-slate-400">
          <span className="text-brand-400 font-medium">Note:</span> Email confirmation is
          skipped — drivers can log in immediately. Share credentials securely.
        </p>
      </div>
    </div>
  );
}
