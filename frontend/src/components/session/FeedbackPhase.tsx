"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import MarkdownContent from "@/components/MarkdownContent";
import CardEditor from "@/components/session/CardEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmEditDialog } from "@/components/dashboard/ConfirmEditDialog";
import { phaseVariants, containerVariants, itemVariants } from "@/components/layout/motion-variants";
import {
  Trash2,
  Save,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Star,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Card as SessionCard, Result } from "@/reducers/sessionReducer";

interface ResultConfig {
  label: string;
  icon: LucideIcon;
  classes: string;
  iconClasses: string;
  xp: number;
}

// Visual config per result: color, icon, label, XP
const RESULT_CONFIG: Record<Result, ResultConfig> = {
  CORRECT: {
    label: "Correcto",
    icon: CheckCircle2,
    classes: "bg-green-500/10 text-green-700 border-green-500/30 dark:text-green-400",
    iconClasses: "text-green-600 dark:text-green-400",
    xp: 100,
  },
  PARTIALLY_CORRECT: {
    label: "Parcial",
    icon: AlertTriangle,
    classes: "bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-400",
    iconClasses: "text-amber-600 dark:text-amber-400",
    xp: 50,
  },
  INCORRECT: {
    label: "Incorrecto",
    icon: XCircle,
    classes: "bg-red-500/10 text-red-700 border-red-500/30 dark:text-red-400",
    iconClasses: "text-red-600 dark:text-red-400",
    xp: 10,
  },
};

function ResultBadge({ result }: { result: Result | null }) {
  if (!result || !RESULT_CONFIG[result]) return null;
  const config = RESULT_CONFIG[result];
  const Icon = config.icon;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 220, damping: 18 }}
      className={cn(
        "inline-flex items-center gap-2.5 rounded-full border-2 px-4 py-1.5 text-sm font-semibold",
        config.classes
      )}
    >
      <Icon className={cn("size-5", config.iconClasses)} />
      <span>{config.label}</span>
      <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-background/60 px-2 py-0.5 text-xs">
        <Star className={cn("size-3", config.iconClasses)} />
        +{config.xp} XP
      </span>
    </motion.div>
  );
}

interface FeedbackPhaseProps {
  feedback: string | null;
  card: SessionCard | null;
  result: Result | null;
  onCardChange: (card: SessionCard) => void;
  onDiscard: () => void;
  onSave: () => void;
  originalCard: SessionCard | null;
}

export default function FeedbackPhase({
  feedback,
  card,
  result,
  onCardChange,
  onDiscard,
  onSave,
  originalCard,
}: FeedbackPhaseProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  return (
    <motion.div
      key="waiting_action"
      variants={phaseVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <motion.div variants={itemVariants} className="mb-4 flex justify-center">
          <ResultBadge result={result} />
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="size-5 text-primary" />
                Feedback
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-6">
              <MarkdownContent
                text={feedback ?? undefined}
                className="text-base text-muted-foreground"
              />
            </CardContent>
          </Card>
        </motion.div>

        {card && (
          <motion.div variants={itemVariants}>
            <CardEditor
              card={card}
              onChange={onCardChange}
              originalCard={originalCard}
            />
          </motion.div>
        )}
      </motion.div>

      <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
        <Button
          variant="outline"
          size="lg"
          onClick={onDiscard}
          className="gap-2 w-full sm:w-auto"
        >
          <Trash2 className="size-5" />
          Descartar
        </Button>
        <Button onClick={() => setIsConfirmOpen(true)} size="lg" className="gap-2 w-full sm:w-auto">
          <Save className="size-5" />
          Guardar card
        </Button>
      </div>

      <ConfirmEditDialog isConfirmOpen={isConfirmOpen} setIsConfirmOpen={setIsConfirmOpen} onSave={onSave} />
    </motion.div>
  );
}
