"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { CheckCircle2, AlertTriangle, XCircle, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

const RESULT_ITEMS = [
  { key: "correct", label: "Correctas", Icon: CheckCircle2, color: "#22c55e" },
  { key: "partially_correct", label: "Parciales", Icon: AlertTriangle, color: "#f59e0b" },
  { key: "incorrect", label: "Incorrectas", Icon: XCircle, color: "#ef4444" },
];

const CUSTOM_TOOLTIP_STYLE = {
  backgroundColor: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "0.75rem",
  padding: "0.5rem 0.75rem",
  fontSize: "0.8125rem",
  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.3)",
};

function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const { name, value } = payload[0];
  return (
    <div style={CUSTOM_TOOLTIP_STYLE}>
      <p className="font-medium">{name}: {value}</p>
    </div>
  );
}

export default function ResultsDonut({ results }) {
  const { correct = 0, partially_correct = 0, incorrect = 0 } = results;
  const total = correct + partially_correct + incorrect;

  if (total === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="size-5 text-primary" />
            Resultados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={BarChart3}
            variant="compact"
            title="Aún no tienes respuestas registradas"
            description="Completa una sesión para ver tus estadísticas."
          />
        </CardContent>
      </Card>
    );
  }

  const accuracyRate = Math.round((correct / total) * 100);

  const pieData = [
    { name: "Correctas", value: correct, color: "#22c55e" },
    { name: "Parciales", value: partially_correct, color: "#f59e0b" },
    { name: "Incorrectas", value: incorrect, color: "#ef4444" },
  ];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="size-5 text-primary" />
          Resultados
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div className="relative w-full max-w-[220px] aspect-square">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="100%"
                paddingAngle={2}
                dataKey="value"
                animationBegin={200}
                animationDuration={800}
              >
                {pieData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-3xl font-bold tracking-tight">{accuracyRate}%</span>
            <span className="text-xs text-muted-foreground">aciertos</span>
          </div>
        </div>

        <div className="w-full space-y-2">
          {RESULT_ITEMS.map((item) => {
            const count = results[item.key] || 0;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={item.key} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="size-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground">{item.label}</span>
                </div>
                <div className="flex items-center gap-2 font-medium tabular-nums">
                  <span>{count}</span>
                  <span className="text-muted-foreground text-xs">({pct}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}