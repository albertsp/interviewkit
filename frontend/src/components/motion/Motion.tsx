"use client";

import { useRef, type ReactNode } from "react";
import { MotionConfig, motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";

// Strong ease-out: starts fast so the UI feels like it reacted, then settles.
export const EASE_OUT = [0.23, 1, 0.32, 1] as const;

// Honours the OS "reduce motion" setting for every Motion component below it.
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

interface RevealProps {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}

// Fade + small rise when the block scrolls into view. Plays once.
export function Reveal({ children, delay = 0, y = 18, className }: RevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -80px 0px" }}
      transition={{ duration: 0.55, ease: EASE_OUT, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface GrowBarProps {
  value: number; // 0-100
  className?: string;
  barClassName?: string;
  delay?: number;
  label?: string;
}

// Progress bar whose fill grows from the left when it enters the viewport.
export function GrowBar({ value, className, barClassName, delay = 0.15, label }: GrowBarProps) {
  const pct = Math.max(0, Math.min(100, value));
  // Observe the track, not the fill: a zero-width fill never counts as visible.
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -60px 0px" });
  return (
    <div
      ref={ref}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      className={cn("h-2 w-full overflow-hidden bg-muted", className)}
    >
      <motion.div
        className={cn("h-full origin-left bg-primary", barClassName)}
        style={{ width: `${pct}%` }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: inView ? 1 : 0 }}
        transition={{ duration: 0.9, ease: EASE_OUT, delay }}
      />
    </div>
  );
}
