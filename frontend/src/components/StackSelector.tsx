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
                "relative flex flex-col items-start gap-3 rounded-md border p-5 text-left transition-[transform,background-color,border-color] duration-150 ease-out sm:p-6",
                "hover:border-foreground hover:bg-secondary active:scale-[0.985]",
                selected ? "border-primary bg-accent" : "border-border bg-background"
              )}
            >
              {selected && (
                <Check aria-hidden="true" className="absolute top-3 right-3 size-5 animate-[pop_220ms_var(--ease-out)_both] text-primary" strokeWidth={3} />
              )}
              {Icon && <Icon className={cn("size-8 transition-colors", selected ? "text-primary" : "text-muted-foreground")} strokeWidth={1.5} />}
              <span className="display text-xl font-extrabold sm:text-2xl">
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

      <nav aria-label="Pasos de la sesión" className="mb-8 grid grid-cols-4 gap-2 sm:gap-3">
        {steps.map((s, idx) => {
          const done = isCompleted(idx)
          const current = step === idx
          const reachable = done || idx === 0
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => { if (reachable) setStep(idx) }}
              disabled={!reachable}
              aria-current={current ? "step" : undefined}
              className="group text-left disabled:cursor-not-allowed"
            >
              <span
                className={cn(
                  "block h-1.5 transition-colors duration-300",
                  current && "bg-foreground",
                  done && !current && "bg-primary",
                  !done && !current && "bg-border"
                )}
              />
              <span
                className={cn(
                  "mt-2 flex items-baseline gap-1.5 font-mono text-xs transition-colors",
                  current && "text-foreground",
                  done && !current && "text-primary",
                  !done && !current && "text-muted-foreground"
                )}
              >
                <span>{idx + 1}</span>
                <span className="hidden sm:inline">{s.label}</span>
              </span>
            </button>
          )
        })}
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
                <div className="mb-8">
                  <h2 className="display text-3xl font-extrabold">{steps[0].question}</h2>
                  <p className="mt-2 text-base text-muted-foreground">Elige el área que más te interese</p>
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
                <div className="mb-8">
                  <h2 className="display text-3xl font-extrabold">{steps[1].question}</h2>
                  <p className="mt-2 text-base text-muted-foreground">
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
                <div className="mb-8">
                  <h2 className="display text-3xl font-extrabold">{steps[2].question}</h2>
                  <p className="mt-2 text-base text-muted-foreground">
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
                <div className="mb-8">
                  <h2 className="display text-3xl font-extrabold">{steps[3].question}</h2>
                  <p className="mt-2 text-base text-muted-foreground">
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
