"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { STACK_COLORS, LEVEL_BADGES } from "@/data/statsTheme";
import { EmptyState } from "@/components/ui/empty-state";
import type { RecentSession } from "@/services/sessionService";

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  });
}

interface MiniBarProps {
  correct: number;
  partially_correct: number;
  incorrect: number;
  total: number;
}

function MiniBar({ correct, partially_correct, incorrect, total }: MiniBarProps) {
  if (total === 0) return null;
  const cPct = (correct / total) * 100;
  const pPct = (partially_correct / total) * 100;
  const iPct = (incorrect / total) * 100;

  return (
    <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-muted">
      <div className="bg-green-500 rounded-l-full" style={{ width: `${cPct}%` }} />
      <div className="bg-amber-500" style={{ width: `${pPct}%` }} />
      <div className="bg-red-500 rounded-r-full" style={{ width: `${iPct}%` }} />
    </div>
  );
}

export default function RecentSessions({ sessions }: { sessions: RecentSession[] }) {
  if (!sessions || sessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="size-5 text-primary" />
            Actividad reciente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Calendar}
            variant="compact"
            title="Aún no tienes sesiones completadas"
            description="Inicia una sesión de entrevista para ver tu actividad aquí."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="size-5 text-primary" />
          Actividad reciente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sessions.slice(0, 5).map((session, i) => {
          const colors = STACK_COLORS[session.stack] || {
            bg: "bg-muted",
            text: "text-muted-foreground",
            ring: "ring-border",
          };
          const levelBadge = LEVEL_BADGES[session.level] || "bg-muted text-muted-foreground border-border";

          return (
            <motion.div
              key={session.created_at}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.25 }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ring-1 ${colors.bg} ${colors.text} ${colors.ring}`}
                  >
                    {session.stack}
                  </span>
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium border ${levelBadge}`}
                  >
                    {session.level}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {session.created_at ? formatDate(session.created_at) : ""}
                  </span>
                </div>
                <div className="mt-1.5">
                  <MiniBar
                    correct={session.correct}
                    partially_correct={session.partially_correct}
                    incorrect={session.incorrect}
                    total={session.total_questions}
                  />
                  <div className="flex justify-between text-[11px] text-muted-foreground mt-1 tabular-nums">
                    <span className="text-green-500">{session.correct} correctas</span>
                    <span>
                      {session.correct}/{session.total_questions} aciertos
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}
