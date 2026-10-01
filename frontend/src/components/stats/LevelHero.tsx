"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

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
    <Card className="border border-border bg-secondary/60 overflow-hidden">
      <CardContent className="p-8 md:p-10 flex flex-col items-center text-center">
        <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-3">
          Tu nivel actual
        </span>

        <div className="text-5xl sm:text-7xl display font-medium text-foreground">
          {level}
        </div>
        <span className="text-sm text-muted-foreground mt-1">Nivel</span>

        <div className="w-full max-w-md mt-6">
          <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground font-medium">
            <span>{progressInLevel} / {xpPerLevel} XP</span>
            <span>{xpToNextLevel} XP al Nv {level + 1}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
