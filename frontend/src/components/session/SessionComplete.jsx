"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { phaseVariants } from "@/components/layout/motion-variants";
import {
  CheckCircle,
  Home,
  RotateCcw,
  Star,
  TrendingUp,
} from "lucide-react";

export default function SessionComplete({
  totalQuestions,
  stack,
  onDashboard,
  onNewSession,
  xpEarned = 0,
  totalXp = 0,
  level = 1,
  xpToNextLevel = 0,
  xpPerLevel = 500,
  progressInLevel = 0,
  bonusApplied = false,
  loading = true,
}) {
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
          {/* Icono animado de sesion completada */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 15,
              delay: 0.1,
            }}
            className="size-20 rounded-full bg-primary/10 flex items-center justify-center"
          >
            <CheckCircle className="size-10 text-primary" />
          </motion.div>

          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-2">
              Sesion completada
            </h2>
            <p className="text-base text-muted-foreground">
              Has completado las {totalQuestions} preguntas de{" "}
              <span className="font-medium text-foreground">{stack}</span>.
            </p>
          </div>

          {/* Bloque de gamificacion: XP ganado + nivel actual */}
          {loading ? (
            <div className="w-full max-w-sm h-24 rounded-xl bg-muted animate-pulse" />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="w-full max-w-sm rounded-xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/5 p-5"
            >
              {/* XP ganado en esta sesion */}
              <div className="flex items-center justify-center gap-2 mb-3">
                <Star className="size-6 text-amber-500 fill-amber-500" />
                <span className="text-3xl font-bold text-amber-700 dark:text-amber-400">
                  +{xpEarned}
                </span>
                <span className="text-base font-semibold text-amber-700/70 dark:text-amber-400/70">
                  XP
                </span>
                {bonusApplied && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500 text-white ml-1">
                    Bonus
                  </span>
                )}
              </div>

              {/* Nivel y barra de progreso al siguiente */}
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
                <div className="h-2 w-full rounded-full bg-amber-500/20 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
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
              Nueva sesion
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}