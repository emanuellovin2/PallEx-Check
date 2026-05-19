"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Star } from "lucide-react";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  angle: number;
  speed: number;
  opacity: number;
}

const COLORS = ["#f59e0b", "#10b981", "#6366f1", "#ec4899", "#3b82f6", "#f97316"];

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 40 + Math.random() * 20,
    y: 45 + Math.random() * 10,
    size: 6 + Math.random() * 10,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    angle: Math.random() * 360,
    speed: 1.5 + Math.random() * 3,
    opacity: 1,
  }));
}

interface Props {
  points: number;
  reason?: string;
}

export function PointsAnimation({ points, reason }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [particles] = useState(() => generateParticles(22));
  const [visible, setVisible] = useState(true);
  const [countUp, setCountUp] = useState(0);

  const dismiss = useCallback(() => {
    setVisible(false);
    // Remove ?pts param from URL
    router.replace(pathname, { scroll: false });
  }, [router, pathname]);

  // Count-up animation
  useEffect(() => {
    if (countUp >= points) return;
    const step = Math.ceil(points / 18);
    const t = setTimeout(() => setCountUp((v) => Math.min(v + step, points)), 50);
    return () => clearTimeout(t);
  }, [countUp, points]);

  // Auto-dismiss after 3.5s
  useEffect(() => {
    const t = setTimeout(dismiss, 3500);
    return () => clearTimeout(t);
  }, [dismiss]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={dismiss}
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
    >
      {/* Particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            backgroundColor: p.color,
            animation: `particle-burst-${p.id % 6} 1.2s ease-out forwards`,
            animationDelay: `${Math.random() * 0.3}s`,
          }}
        />
      ))}

      {/* Stars floating */}
      {[...Array(6)].map((_, i) => (
        <div
          key={`star-${i}`}
          className="absolute pointer-events-none"
          style={{
            left: `${15 + i * 14}%`,
            top: `${20 + (i % 3) * 20}%`,
            animation: `float-star 2s ease-in-out infinite`,
            animationDelay: `${i * 0.2}s`,
          }}
        >
          <Star
            className="fill-amber-400 text-amber-400"
            style={{ width: 16 + (i % 3) * 8, height: 16 + (i % 3) * 8 }}
          />
        </div>
      ))}

      {/* Main card */}
      <div
        className="relative flex flex-col items-center gap-4 px-10 py-10 rounded-3xl"
        style={{
          background: "linear-gradient(135deg, #1a1f2e 0%, #0f1420 100%)",
          border: "1px solid rgba(99,102,241,0.4)",
          boxShadow: "0 0 60px rgba(99,102,241,0.25), 0 25px 50px rgba(0,0,0,0.5)",
          animation: "pop-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ring */}
        <div
          className="absolute inset-0 rounded-3xl pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.15) 0%, transparent 70%)",
          }}
        />

        {/* Trophy emoji */}
        <div
          className="text-5xl"
          style={{ animation: "bounce-once 0.8s cubic-bezier(0.34,1.56,0.64,1) 0.3s both" }}
        >
          🏆
        </div>

        {/* Points counter */}
        <div className="flex items-end gap-1">
          <span
            className="text-6xl font-black"
            style={{
              background: "linear-gradient(135deg, #f59e0b, #f97316)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            +{countUp}
          </span>
          <span className="text-xl font-bold text-amber-400/80 mb-2">pct</span>
        </div>

        <p className="text-white font-bold text-xl tracking-tight">Puncte câștigate!</p>

        {reason && (
          <p className="text-slate-400 text-sm text-center max-w-48">{reason}</p>
        )}

        <button
          onClick={dismiss}
          className="mt-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
          style={{
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            color: "white",
            boxShadow: "0 4px 15px rgba(99,102,241,0.4)",
          }}
        >
          Super! 🎉
        </button>
      </div>

      <style>{`
        @keyframes pop-in {
          from { transform: scale(0.5) translateY(20px); opacity: 0; }
          to   { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes bounce-once {
          from { transform: scale(0) rotate(-15deg); }
          to   { transform: scale(1) rotate(0deg); }
        }
        @keyframes float-star {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.8; }
          50%       { transform: translateY(-12px) rotate(20deg); opacity: 1; }
        }
        @keyframes particle-burst-0 { to { transform: translate(-80px, -120px) scale(0); opacity: 0; } }
        @keyframes particle-burst-1 { to { transform: translate(80px, -120px) scale(0); opacity: 0; } }
        @keyframes particle-burst-2 { to { transform: translate(-120px, 60px) scale(0); opacity: 0; } }
        @keyframes particle-burst-3 { to { transform: translate(120px, 60px) scale(0); opacity: 0; } }
        @keyframes particle-burst-4 { to { transform: translate(-40px, 130px) scale(0); opacity: 0; } }
        @keyframes particle-burst-5 { to { transform: translate(40px, 130px) scale(0); opacity: 0; } }
      `}</style>
    </div>
  );
}
