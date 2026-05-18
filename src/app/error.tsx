"use client";

import { Button } from "@/components/ui/Button";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface-950 px-4 gap-5 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-500/15 flex items-center justify-center">
        <AlertTriangle className="w-8 h-8 text-red-400" />
      </div>
      <div>
        <h1 className="text-xl font-bold text-white">Something went wrong</h1>
        <p className="text-slate-400 text-sm mt-2 max-w-xs">
          {process.env.NODE_ENV === "development" ? error.message : "A apărut o eroare neașteptată. Încearcă din nou."}
        </p>
      </div>
      <Button variant="primary" onClick={reset}>Try again</Button>
    </div>
  );
}
