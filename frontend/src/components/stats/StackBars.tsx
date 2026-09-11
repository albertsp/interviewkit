"use client";

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { STACK_COLORS } from "@/data/statsTheme";
import { Layers } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import type { StackStat } from "@/services/sessionService";

const STACK_ICONS: Record<string, string> = {
  JavaScript: "JS",
  React: "Re",
  Python: "Py",
  SQL: "SQL",
  "HTML/CSS": "H/C",
};

const CUSTOM_TOOLTIP_STYLE = {
  backgroundColor: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "0.75rem",
  padding: "0.5rem 0.75rem",
  fontSize: "0.8125rem",
  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.3)",
};

interface ChartDatum {
  stack: string;
  sessions: number;
  cards: number;
  icon: string;
  fill: string;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: ChartDatum }[] }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div style={CUSTOM_TOOLTIP_STYLE}>
      <p className="font-medium">{d.stack}</p>
      <p className="text-muted-foreground">
        {d.sessions} {d.sessions === 1 ? "sesion" : "sesiones"} · {d.cards} {d.cards === 1 ? "card" : "cards"}
      </p>
    </div>
  );
}

export default function StackBars({ stacks }: { stacks: StackStat[] }) {
  if (!stacks || stacks.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="size-5 text-primary" />
            Distribucion por stack
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Layers}
            variant="compact"
            title="Aún no tienes sesiones registradas"
          />
        </CardContent>
      </Card>
    );
  }

  const chartData: ChartDatum[] = stacks.map((s) => ({
    stack: s.stack,
    sessions: s.sessions,
    cards: s.cards,
    icon: STACK_ICONS[s.stack] || s.stack.slice(0, 2).toUpperCase(),
    fill: STACK_COLORS[s.stack]?.bar || "var(--muted-foreground)",
  }));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="size-5 text-primary" />
          Distribucion por stack
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {stacks.map((s) => {
            const colors = STACK_COLORS[s.stack] || {
              bg: "bg-muted",
              text: "text-muted-foreground",
              ring: "ring-border",
            };
            const icon = STACK_ICONS[s.stack] || s.stack.slice(0, 2).toUpperCase();
            return (
              <div key={s.stack} className="flex items-center gap-2 text-sm">
                <span
                  className={`inline-flex size-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold ${colors.bg} ${colors.text} ring-1 ${colors.ring}`}
                >
                  {icon}
                </span>
                <span className="font-medium w-20 sm:w-24 shrink-0 text-xs sm:text-sm">{s.stack}</span>
                <span className="text-muted-foreground tabular-nums ml-auto text-xs sm:text-sm">
                  {s.sessions} {s.sessions === 1 ? "sesion" : "sesiones"} · {s.cards} cards
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-4 h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="icon" width={36} tickLine={false} axisLine={false} tick={{ fontSize: 11, fontWeight: 600 }} />
              <Tooltip content={<CustomTooltip />} wrapperStyle={{ outline: "none" }} cursor={{ fill: "rgba(255,255,255,0.06)", radius: 4 }} />
              <Bar dataKey="sessions" radius={[0, 6, 6, 0]} animationBegin={200} animationDuration={600} barSize={24}>
                {chartData.map((entry) => (
                  <Cell key={entry.stack} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
