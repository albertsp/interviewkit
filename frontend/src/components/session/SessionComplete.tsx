"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { phaseVariants } from "@/components/layout/motion-variants";
import { LogoMark } from "@/components/Logo";
import {
  Home,
  RotateCcw,
  Star,
  TrendingUp,
} from "lucide-react";

interface SessionCompleteProps {
  totalQuestions: number;
  stack: string;
  onDashboard: () => void;
  onNewSession: () => void;
  xpEarned?: number;
  totalXp?: number;
  level?: number;
  xpToNextLevel?: number;
  xpPerLevel?: number;
  progressInLevel?: number;
  bonusApplied?: boolean;
  loading?: boolean;
}

export default function SessionComplete({
  totalQuestions,
  stack,
  onDashboard,
  onNewSession,
  xpEarned = 0,
  xpToNextLevel = 0,
  level = 1,
  xpPerLevel = 500,
  progressInLevel = 0,
  bonusApplied = false,
  loading = true,
}: SessionCompleteProps) {
  const progressPct = xpPerLevel > 0
    ? Math.min(100, Math.max(0, Math.round((progressInLevel / xpPerLevel) * 100)))
    : 0;

  return (
    <motion.div
      key="complete"
      variants={phaseVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <Card>
        <CardContent className="p-8 md:p-10 flex flex-col items-center text-center gap-6">
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
          >
            <LogoMark className="size-16" />
          </motion.div>

          <div>
            <h2 className="display text-4xl font-extrabold mb-2">
              Sesión completada
            </h2>
            <p className="text-base text-muted-foreground">
              Has completado las {totalQuestions} preguntas de{" "}
              <span className="font-medium text-foreground">{stack}</span>.
            </p>
          </div>

          {loading ? (
            <div className="w-full max-w-sm h-24 rounded-md bg-muted animate-pulse" />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="w-full max-w-sm rounded-md border border-border bg-secondary/60 p-5"
            >
              <div className="flex items-center justify-center gap-2 mb-3">
                <Star className="size-6 text-primary fill-primary" />
                <span className="display text-4xl font-extrabold text-foreground">
                  +{xpEarned}
                </span>
                <span className="text-base font-semibold text-muted-foreground">
                  XP
                </span>
                {bonusApplied && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm bg-highlight text-highlight-foreground ml-1">
                    Bonus
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1 text-foreground">
                    <TrendingUp className="size-3" />
                    Nivel {level}
                  </span>
                  <span className="text-muted-foreground">
                    {progressInLevel} / {xpPerLevel} XP
                  </span>
                </div>
                <div className="h-2 w-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                  />
                </div>
                {xpToNextLevel > 0 && (
                  <p className="text-xs text-muted-foreground text-center pt-1">
                    {xpToNextLevel} XP para Nv {level + 1}
                  </p>
                )}
              </div>
            </motion.div>
          )}

          <p className="text-sm text-muted-foreground">
            Revisa las cards guardadas en tu dashboard para repasar los conceptos
            clave.
          </p>

          <div className="flex flex-col-reverse sm:flex-row gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              size="lg"
              onClick={onDashboard}
              className="gap-2 w-full sm:w-auto"
            >
              <Home className="size-5" />
              Ir al dashboard
            </Button>
            <Button
              size="lg"
              onClick={onNewSession}
              className="gap-2 w-full sm:w-auto"
            >
              <RotateCcw className="size-5" />
              Nueva sesión
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
