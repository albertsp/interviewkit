"use client";

import { cn } from "@/lib/utils";
import { BookOpen, Code2 } from "lucide-react";

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
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <p className="display text-2xl font-extrabold">
          Pregunta {currentIndex + 1}{" "}
          <span className="text-muted-foreground">de {total}</span>
        </p>
        <p className="text-right font-mono text-xs text-muted-foreground">
          {stack} · {level}
          {topic && topic !== "General / Mixto" ? ` · ${topic}` : ""}
        </p>
      </div>

      <div
        role="progressbar"
        aria-label="Progreso de la sesión"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={currentIndex + 1}
        className="flex gap-1.5"
      >
        {Array.from({ length: total }).map((_, idx) => (
          <div key={idx} className="h-1.5 flex-1 overflow-hidden bg-border">
            <div
              className={cn(
                "h-full origin-left transition-transform duration-500 ease-out",
                idx < currentIndex ? "bg-primary" : "bg-foreground",
                idx <= currentIndex ? "scale-x-100" : "scale-x-0"
              )}
            />
          </div>
        ))}
      </div>

      {blockLabel && (
        <p className="mt-3 flex items-center gap-1.5 font-mono text-xs text-primary">
          <blockLabel.Icon className="size-3.5" />
          {blockLabel.text}
        </p>
      )}
    </div>
  );
}
