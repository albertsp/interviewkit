"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { CheckCircle, BookOpen, Code2 } from "lucide-react";

interface ProgressIndicatorProps {
  currentIndex: number;
  total: number;
  stack: string;
  level: string;
  topic?: string;
  questionType: "theory" | "code";
}

export default function ProgressIndicator({ currentIndex, total, stack, level, topic, questionType }: ProgressIndicatorProps) {
  const blockLabel =
    questionType === "theory"
      ? { text: "Preguntas teóricas", Icon: BookOpen }
      : questionType === "code"
      ? { text: "Preguntas de código", Icon: Code2 }
      : null;

  return (
    <div className="mb-8">
      {blockLabel && (
        <div className="flex items-center justify-center gap-1.5 text-sm font-medium text-primary mb-2">
          <blockLabel.Icon className="size-4" />
          {blockLabel.text}
        </div>
      )}
      <div className="flex items-center justify-center gap-2 text-base text-muted-foreground mb-4">
        <span className="font-semibold text-foreground">
          Pregunta {currentIndex + 1}
        </span>
        <span>de</span>
        <span className="font-semibold">{total}</span>
      </div>

      <div className="flex items-center justify-center">
        {Array.from({ length: total }).map((_, idx) => (
          <div key={idx} className="flex items-center">
            {idx > 0 && (
              <div className="relative w-16 h-1 mx-3 rounded-full bg-border overflow-hidden">
                {idx <= currentIndex && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-primary"
                    style={{ originX: 0 }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  />
                )}
              </div>
            )}
            <div
              className={cn(
                "relative flex items-center justify-center size-10 rounded-full text-sm font-bold transition-colors duration-300",
                idx <= currentIndex && "bg-primary text-primary-foreground",
                idx > currentIndex && "bg-muted text-muted-foreground"
              )}
            >
              {idx === currentIndex && (
                <motion.div
                  layoutId="progressActiveRing"
                  className="absolute inset-0 rounded-full ring-4 ring-primary/20"
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
              )}
              {idx < currentIndex ? (
                <CheckCircle className="size-5" />
              ) : (
                idx + 1
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-sm text-muted-foreground mt-3">
        {stack} · {level}
        {topic && topic !== "General / Mixto" ? ` · ${topic}` : ""}
      </p>
    </div>
  );
}
