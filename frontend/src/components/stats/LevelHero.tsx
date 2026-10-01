"use client";

import { motion } from "framer-motion";

interface LevelHeroProps {
  level: number;
  progressInLevel: number;
  xpPerLevel: number;
  xpToNextLevel: number;
}

export default function LevelHero({ level, progressInLevel, xpPerLevel, xpToNextLevel }: LevelHeroProps) {
  const progressPct =
    xpPerLevel > 0 ? Math.min(100, (progressInLevel / xpPerLevel) * 100) : 0;

  return (
    <section
      aria-label="Tu nivel actual"
      className="rounded-lg border border-border bg-secondary/60 p-6 sm:p-10"
    >
      <p className="font-mono text-xs text-muted-foreground">Tu nivel actual</p>
      <p className="display mt-3 text-7xl font-medium leading-none sm:text-8xl">
        Nv <span className="mark-highlight">{level}</span>
      </p>

      <div className="mt-8 max-w-xl">
        <div
          role="progressbar"
          aria-label={`Progreso hacia el nivel ${level + 1}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progressPct)}
          className="h-2 w-full bg-muted"
        >
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
          />
        </div>
        <div className="mt-2 flex justify-between font-mono text-xs text-muted-foreground">
          <span>{progressInLevel} / {xpPerLevel} XP</span>
          <span>{xpToNextLevel} XP al Nv {level + 1}</span>
        </div>
      </div>
    </section>
  );
}
