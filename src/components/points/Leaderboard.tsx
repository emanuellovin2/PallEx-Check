"use client";

import { Trophy, Medal } from "lucide-react";
import { Card } from "@/components/ui/Card";

export interface LeaderboardEntry {
  driver_id: string;
  full_name: string | null;
  email: string;
  total_points: number;
  rank: number;
}

interface Props {
  entries: LeaderboardEntry[];
  currentDriverId?: string;
  showNames?: boolean;
}

const MEDAL_COLORS = ["text-amber-400", "text-slate-300", "text-amber-600"];
const MEDAL_BG = ["bg-amber-400/15", "bg-slate-400/15", "bg-amber-700/15"];
const RANK_LABELS = ["🥇", "🥈", "🥉"];

export function Leaderboard({ entries, currentDriverId, showNames = true }: Props) {
  if (!entries.length) {
    return (
      <Card className="flex flex-col items-center justify-center py-8 gap-2 text-center">
        <Trophy className="w-8 h-8 text-slate-600" />
        <p className="text-sm text-slate-400">Niciun punct înregistrat încă</p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {entries.map((entry, i) => {
        const isMe = entry.driver_id === currentDriverId;
        const isTop3 = entry.rank <= 3;
        const name = showNames
          ? entry.full_name || entry.email.split("@")[0]
          : isMe
          ? "Tu"
          : `Șofer #${entry.rank}`;

        return (
          <div
            key={entry.driver_id}
            className={[
              "flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all",
              isMe
                ? "bg-brand-500/10 border-brand-500/30 shadow-sm shadow-brand-500/10"
                : isTop3
                ? "bg-surface-800 border-surface-700"
                : "bg-surface-800/60 border-surface-700/60",
            ].join(" ")}
          >
            {/* Rank badge */}
            <div
              className={[
                "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg",
                isTop3 ? MEDAL_BG[entry.rank - 1] : "bg-surface-700",
              ].join(" ")}
            >
              {isTop3 ? (
                <span>{RANK_LABELS[entry.rank - 1]}</span>
              ) : (
                <span className="text-sm font-bold text-slate-500">#{entry.rank}</span>
              )}
            </div>

            {/* Name */}
            <div className="flex-1 min-w-0">
              <p
                className={[
                  "font-semibold text-sm truncate",
                  isMe ? "text-brand-300" : "text-white",
                ].join(" ")}
              >
                {name}
                {isMe && (
                  <span className="ml-1.5 text-xs text-brand-400/70 font-normal">(tu)</span>
                )}
              </p>
              {isTop3 && (
                <p className={`text-xs ${MEDAL_COLORS[entry.rank - 1]}`}>
                  {entry.rank === 1 ? "Lider" : entry.rank === 2 ? "Locul 2" : "Locul 3"}
                </p>
              )}
            </div>

            {/* Points */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span
                className={[
                  "text-lg font-black tabular-nums",
                  isTop3 ? MEDAL_COLORS[entry.rank - 1] : isMe ? "text-brand-400" : "text-slate-300",
                ].join(" ")}
              >
                {entry.total_points}
              </span>
              <span className="text-xs text-slate-500 font-medium">pct</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
