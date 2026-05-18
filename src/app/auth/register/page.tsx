import Link from "next/link";
import { Truck, ShieldCheck, ArrowLeft } from "lucide-react";

/**
 * Public self-registration is disabled.
 * Only admins can create driver accounts from /admin/drivers/new.
 */
export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-10">
        <div className="w-12 h-12 rounded-2xl bg-brand-500 flex items-center justify-center shadow-lg shadow-brand-500/30">
          <Truck className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white leading-none">PallEx</h1>
          <p className="text-brand-400 text-sm font-semibold">Check</p>
        </div>
      </div>

      <div className="w-full max-w-sm bg-surface-900 border border-surface-700 rounded-2xl p-6 shadow-xl text-center">
        <div className="w-14 h-14 rounded-2xl bg-brand-500/15 flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-7 h-7 text-brand-400" />
        </div>

        <h2 className="text-xl font-bold text-white mb-2">
          Accounts are by invitation only
        </h2>
        <p className="text-slate-400 text-sm leading-relaxed">
          Driver accounts are created by an administrator. Please contact your
          fleet manager to get access.
        </p>

        <Link
          href="/auth/login"
          className="flex items-center justify-center gap-2 mt-6 text-sm font-medium
            text-brand-400 hover:text-brand-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}
