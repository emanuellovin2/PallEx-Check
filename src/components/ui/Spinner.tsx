import { Loader2 } from "lucide-react";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
}

const sizes = { sm: "w-4 h-4", md: "w-8 h-8", lg: "w-12 h-12" };

export function Spinner({ size = "md", label = "Loading…" }: SpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
      <Loader2 className={`${sizes[size]} animate-spin text-brand-400`} />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}

export function PageSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-950">
      <Spinner size="lg" />
    </div>
  );
}
