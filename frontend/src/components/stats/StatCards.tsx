"use client";

import type { StatsResponse } from "@/services/sessionService";

type StatsWithSessionsCount = Pick<StatsResponse, "level" | "total_xp" | "xp_to_next_level"> & {
  sessions_count: number;
};

interface StatDef {
  key: string;
  label: string;
  value: (s: StatsWithSessionsCount) => string | number;
}

const STATS: StatDef[] = [
  { key: "level", label: "Tu nivel", value: (s) => s.level },
  { key: "total_xp", label: "XP total", value: (s) => s.total_xp.toLocaleString("es-ES") },
  { key: "xp_to_next", label: "Al siguiente nivel", value: (s) => s.xp_to_next_level.toLocaleString("es-ES") },
  { key: "sessions", label: "Sesiones completadas", value: (s) => s.sessions_count },
];

interface StatCardsProps {
  stats: Pick<StatsResponse, "level" | "total_xp" | "xp_to_next_level">;
  sessionsCount: number;
}

// Four numbers in a ruled strip instead of four cards: the figures are the
// content, the borders only keep them apart.
export default function StatCards({ stats, sessionsCount }: StatCardsProps) {
  const extended: StatsWithSessionsCount = { ...stats, sessions_count: sessionsCount };

  return (
    <dl className="grid grid-cols-2 border-t border-border lg:grid-cols-4">
      {STATS.map(({ key, label, value }) => (
        <div
          key={key}
          className="border-b border-r border-border p-4 sm:p-6 even:border-r-0 lg:border-b-0 lg:even:border-r lg:last:border-r-0"
        >
          <dd className="display text-4xl font-medium tabular-nums sm:text-5xl">
            {value(extended)}
          </dd>
          <dt className="mt-1 font-mono text-xs text-muted-foreground">{label}</dt>
        </div>
      ))}
    </dl>
  );
}
