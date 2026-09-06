"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import MarkdownContent from "@/components/MarkdownContent";
import dynamic from "next/dynamic";
const CodeEditor = dynamic(() => import("@/components/CodeEditor"), { ssr: false });
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { phaseVariants } from "@/components/layout/motion-variants";
import { Send, Code, AlignLeft } from "lucide-react";

interface QuestionPhaseProps {
  question: string;
  questionType: "theory" | "code";
  stack: string;
  answer: string;
  error?: string | null;
  onAnswerChange: (value: string) => void;
  onSubmit: () => void;
}

export default function QuestionPhase({
  question,
  questionType,
  stack,
  answer,
  error,
  onAnswerChange,
  onSubmit,
}: QuestionPhaseProps) {
  // Toggles between text mode (textarea) and code mode (CodeMirror)
  // Defaults to the mode that best fits the question type
  const [isCodeMode, setIsCodeMode] = useState(questionType === "code");

  // Each question may want a different default input mode
  useEffect(() => {
    setIsCodeMode(questionType === "code");
  }, [question, questionType]);

  return (
    <motion.div
      key="answering"
      variants={phaseVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <Card className="mb-6">
        <CardContent className="p-8 md:p-10">
          <MarkdownContent text={question} className="text-xl leading-relaxed" />
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-1 mb-3">
        <span className="text-xs text-muted-foreground mr-2">
          {isCodeMode ? "Editor de codigo" : "Texto"}
        </span>
        <div className="flex rounded-lg border border-border bg-muted p-0.5">
          <button
            type="button"
            onClick={() => setIsCodeMode(false)}
            className={cn(
              "relative flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              !isCodeMode ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {!isCodeMode && (
              <motion.span
                layoutId="questionModePill"
                className="absolute inset-0 -z-10 rounded-md bg-background shadow-sm"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <AlignLeft className="size-3.5" />
            Texto
          </button>
          <button
            type="button"
            onClick={() => setIsCodeMode(true)}
            className={cn(
              "relative flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              isCodeMode ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {isCodeMode && (
              <motion.span
                layoutId="questionModePill"
                className="absolute inset-0 -z-10 rounded-md bg-background shadow-sm"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <Code className="size-3.5" />
            Codigo
          </button>
        </div>
      </div>

      {isCodeMode ? (
        <CodeEditor
          value={answer}
          onChange={onAnswerChange}
          placeholder="Escribe tu codigo aqui..."
          ariaLabel="Editor de codigo para tu respuesta"
          stack={stack}
        />
      ) : (
        <textarea
          className={cn(
            "w-full min-h-[200px] rounded-xl border border-input bg-background px-5 py-4 text-base resize-y transition-colors outline-none",
            "placeholder:text-muted-foreground",
            "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
            "disabled:pointer-events-none disabled:opacity-50"
          )}
          placeholder="Escribe tu respuesta aqui..."
          value={answer}
          onChange={(e) => onAnswerChange(e.target.value)}
          aria-label="Escribe tu respuesta"
        />
      )}

      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-destructive text-base mt-3"
        >
          {error}
        </motion.p>
      )}

      <div className="mt-6 flex justify-end">
        <Button
          onClick={onSubmit}
          disabled={!answer.trim()}
          size="lg"
          className="gap-2 px-6 sm:px-10 text-base w-full sm:w-auto"
        >
          Enviar respuesta
          <Send className="size-5" />
        </Button>
      </div>
    </motion.div>
  );
}
