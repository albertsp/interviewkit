"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Card, CardContent, CardFooter } from "./ui/card"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Monitor, Server, ChevronLeft, Check, ArrowRight, type LucideIcon } from "lucide-react"
import type { StackResponse } from "@/services/stacksService"

const roleIcons: Record<string, LucideIcon> = {
  Frontend: Monitor,
  Backend: Server,
}

const steps = [
  { key: "rol", label: "Rol", question: "¿Cuál es tu rol?" },
  { key: "stack", label: "Tecnología", question: "¿Qué tecnología quieres practicar?" },
  { key: "topic", label: "Tema", question: "¿En qué tema quieres enfocarte?" },
  { key: "level", label: "Nivel", question: "¿Qué nivel de dificultad prefieres?" },
] as const

interface Selection {
  rol: string
  stack: string
  topic: string
  level: string
}

interface StackSelectorProps {
  onSubmit: (selection: Selection) => void
  stacks: StackResponse
}

function StackSelector({ onSubmit, stacks }: StackSelectorProps) {
  const [select, setSelect] = useState<Selection>({ rol: "", stack: "", topic: "", level: "" })
  const [step, setStep] = useState(0)

  // Selecting a step's option saves it and advances; changing an earlier step
  // clears the steps that depend on it
  const handleSelect = (type: keyof Selection, value: string) => {
    const newSelect: Selection = { ...select, [type]: value }
    if (type === "rol") { newSelect.stack = ""; newSelect.topic = ""; newSelect.level = "" }
    if (type === "stack") { newSelect.topic = ""; newSelect.level = "" }
    setSelect(newSelect)
    if (step < 3) setStep(step + 1)
  }

  const isCompleted = (idx: number) => select[steps[idx].key] !== ""

  const renderOptions = (items: string[], type: keyof Selection, selectedValue: string, iconMap?: Record<string, LucideIcon>) => {
    const cols = type === "level" ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-2"
    return (
      <div className={cn("grid gap-3 sm:gap-4", cols)}>
        {items.map((item) => {
          const selected = selectedValue === item
          const Icon = iconMap?.[item]
          return (
            <button
              key={item}
              type="button"
              onClick={() => handleSelect(type, item)}
              className={cn(
                "relative flex flex-col items-center gap-3 sm:gap-4 rounded-2xl border-2 p-5 sm:p-8 transition-all duration-200",
                "hover:border-primary/50 hover:bg-accent",
                selected ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-background"
              )}
            >
              {selected && (
                <span className="absolute top-3 right-3 sm:top-4 sm:right-4 size-5 sm:size-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  <Check className="size-3 sm:size-4" />
                </span>
              )}
              {Icon && <Icon className={cn("size-8 sm:size-10 transition-colors", selected ? "text-primary" : "text-muted-foreground")} />}
              <span className={cn("text-base sm:text-lg font-medium transition-colors", selected && "text-primary")}>
                {item}
              </span>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto">

      <nav className="flex items-center justify-center mb-8">
        {steps.map((s, idx) => (
          <div key={s.key} className="flex items-center">
            {idx > 0 && (
              <div
                className={cn(
                  "w-8 sm:w-16 h-1 mx-2 sm:mx-3 rounded-full transition-colors duration-500",
                  isCompleted(idx - 1) ? "bg-primary" : "bg-border"
                )}
              />
            )}
            <button
              type="button"
              onClick={() => { if (isCompleted(idx) || idx === 0) setStep(idx) }}
              disabled={!isCompleted(idx) && idx !== 0}
              className="flex flex-col items-center gap-2"
            >
              <span
                className={cn(
                  "flex items-center justify-center size-10 sm:size-14 rounded-full text-sm sm:text-lg font-bold transition-all duration-300",
                  isCompleted(idx) && "bg-primary text-primary-foreground",
                  step === idx && !isCompleted(idx) && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                  step !== idx && !isCompleted(idx) && "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted(idx) ? <Check className="size-4 sm:size-6" /> : idx + 1}
              </span>
              <span
                className={cn(
                  "text-sm font-medium transition-colors duration-300",
                  step === idx && "text-foreground",
                  isCompleted(idx) && step !== idx && "text-primary",
                  !isCompleted(idx) && step !== idx && "text-muted-foreground"
                )}
              >
                {s.label}
              </span>
            </button>
          </div>
        ))}
      </nav>

      <Card>
        <CardContent className="p-5 sm:p-8 md:p-10">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="rol"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.25 }}
              >
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-semibold">{steps[0].question}</h2>
                  <p className="text-base text-muted-foreground mt-2">Elige el área que más te interese</p>
                </div>
                {renderOptions(Object.keys(stacks.rol), "rol", select.rol, roleIcons)}
              </motion.div>
            )}

            {step === 1 && select.rol && (
              <motion.div
                key="stack"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.25 }}
              >
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-semibold">{steps[1].question}</h2>
                  <p className="text-base text-muted-foreground mt-2">
                    Rol: <span className="font-medium text-foreground">{select.rol}</span>
                  </p>
                </div>
                {renderOptions(stacks.rol[select.rol], "stack", select.stack)}
              </motion.div>
            )}

            {step === 2 && select.stack && (
              <motion.div
                key="topic"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.25 }}
              >
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-semibold">{steps[2].question}</h2>
                  <p className="text-base text-muted-foreground mt-2">
                    {select.rol} · <span className="font-medium text-foreground">{select.stack}</span>
                  </p>
                </div>
                {renderOptions(stacks.topic?.[select.stack] ?? [], "topic", select.topic)}
              </motion.div>
            )}

            {step === 3 && select.topic && (
              <motion.div
                key="level"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.25 }}
              >
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-semibold">{steps[3].question}</h2>
                  <p className="text-base text-muted-foreground mt-2">
                    {select.stack} · <span className="font-medium text-foreground">{select.topic}</span>
                  </p>
                </div>
                {renderOptions(stacks.level, "level", select.level)}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>

        {(step > 0 || select.level) && (
          <CardFooter className="flex items-center justify-between p-5 sm:p-8 md:p-10 pt-0">
            {step > 0 ? (
              <Button variant="ghost" onClick={() => setStep(step - 1)} className="gap-2 text-base">
                <ChevronLeft className="size-5" />
                Atrás
              </Button>
            ) : <div />}
            {select.level && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Button onClick={() => onSubmit({ ...select })} size="lg" className="gap-2 px-10 text-base">
                  Empezar
                  <ArrowRight className="size-5" />
                </Button>
              </motion.div>
            )}
          </CardFooter>
        )}
      </Card>
    </div>
  )
}

export default StackSelector
