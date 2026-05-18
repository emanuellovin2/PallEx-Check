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
    if (!fullName.trim()) newErrors.fullName = "Numele complet este obligatoriu";
    if (!email.trim()) newErrors.email = "Email-ul este obligatoriu";
    if (password.length < 8) newErrors.password = "Parola trebuie să aibă cel puțin 8 caractere";
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
        toast.error(data.error ?? "Crearea șoferului a eșuat");
        return;
      }

      toast.success(`Șoferul "${fullName}" a fost creat cu succes`);
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
        Înapoi la Șoferi
      </Link>

      <div>
        <h1 className="text-xl font-bold text-white">Adaugă Șofer</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Șoferul va putea să se autentifice imediat cu aceste credențiale.
        </p>
      </div>

      <Card className="flex flex-col gap-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Nume complet"
            type="text"
            placeholder="Ion Ionescu"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            error={errors.fullName}
            leftIcon={<User className="w-4 h-4" />}
            autoComplete="name"
          />

          <Input
            label="Adresă email"
            type="email"
            placeholder="sofer@exemplu.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            leftIcon={<Mail className="w-4 h-4" />}
            autoComplete="email"
            inputMode="email"
          />

          <div className="flex flex-col gap-1.5">
            <Input
              label="Parolă"
              type={showPassword ? "text" : "password"}
              placeholder="Min. 8 caractere"
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
              {showPassword ? "Ascunde parola" : "Afișează parola"}
            </button>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
              Creează cont șofer
            </Button>
            <Link href="/admin/drivers">
              <Button type="button" variant="ghost" size="lg" fullWidth>
                Anulează
              </Button>
            </Link>
          </div>
        </form>
      </Card>

      <div className="bg-surface-800/50 border border-surface-700 rounded-xl px-4 py-3">
        <p className="text-xs text-slate-400">
          <span className="text-brand-400 font-medium">Notă:</span> Confirmarea prin email este
          omisă — șoferii se pot autentifica imediat. Distribuie credențialele în mod securizat.
        </p>
      </div>
    </div>
  );
}
