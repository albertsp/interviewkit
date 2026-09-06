"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
const CodeEditor = dynamic(() => import("@/components/CodeEditor"), { ssr: false });
import MarkdownContent from "@/components/MarkdownContent";
import {
  Eye,
  Pencil,
  Lightbulb,
  Plus,
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Tag,
} from "lucide-react";

// Opciones de lenguaje para el selector del code snippet
const LANGUAGE_OPTIONS = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "sql", label: "SQL" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "bash", label: "Bash" },
  { value: "json", label: "JSON" },
];

// Renderiza un bloque de codigo con estilo terminal (reusando el patron de MarkdownContent)
function CodePreview({ code, language }) {
  if (!code) return null;

  const label = language || "Code";

  return (
    <div className="rounded-xl overflow-hidden border bg-[#0d1117] shadow-sm">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#161b22] border-b border-white/5">
        <div className="flex gap-1.5">
          <span className="size-3 rounded-full bg-[#ff5f56]" />
          <span className="size-3 rounded-full bg-[#ffbd2e]" />
          <span className="size-3 rounded-full bg-[#27c93f]" />
        </div>
        <span className="ml-3 text-[11px] font-medium tracking-wider text-white/40 uppercase">
          {label}
        </span>
      </div>
      <pre className="p-4 overflow-x-auto">
        <code className="text-sm font-mono leading-relaxed text-[#c9d1d9] whitespace-pre">
          {code}
        </code>
      </pre>
    </div>
  );
}

// Bloque de tags como chips
function TagChips({ tags, onTagClick }) {
  if (!tags || tags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onTagClick?.(tag)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
        >
          <Tag className="size-3" />
          {tag}
        </button>
      ))}
    </div>
  );
}

// Vista de lectura: muestra la card formateada y bonita
export function CardView({ card, wasEdited }) {
  return (
    <div className="space-y-5">
      {/* Titulo: concepto + definicion */}
      <div>
        <div className="flex items-start gap-2 flex-wrap">
          <h3 className="text-2xl font-bold tracking-tight text-foreground">
            {card.concept || "Sin titulo"}
          </h3>
          {card.code_language && (
            <Badge variant="outline" size="sm" className="uppercase tracking-wider border-primary/20 text-primary/80 mt-1.5">
              {card.code_language}
            </Badge>
          )}
          {wasEdited && (
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 mt-1.5">
              Editado por ti
            </span>
          )}
        </div>
        {card.definition && (
          <p className="text-base text-muted-foreground italic mt-1.5 leading-relaxed">
            {card.definition}
          </p>
        )}
      </div>

      {/* Explicacion */}
      {card.explanation && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Explicacion
          </p>
          <MarkdownContent text={card.explanation} className="text-sm" />
        </div>
      )}

      {/* Usar cuando */}
      {card.use_case && (
        <div className="rounded-lg border-l-4 border-green-500 bg-green-500/5 p-3 space-y-1">
          <p className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5" />
            Usar cuando
          </p>
          <MarkdownContent text={card.use_case} className="text-sm" />
        </div>
      )}

      {/* Evitar cuando */}
      {card.avoid_when && (
        <div className="rounded-lg border-l-4 border-red-500 bg-red-500/5 p-3 space-y-1">
          <p className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wider flex items-center gap-1.5">
            <XCircle className="size-3.5" />
            Evitar cuando
          </p>
          <MarkdownContent text={card.avoid_when} className="text-sm" />
        </div>
      )}

      {/* Code snippet */}
      {card.code && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Ejemplo
          </p>
          <CodePreview code={card.code} language={card.code_language || "code"} />
        </div>
      )}

      {/* Mnemotecnia */}
      {card.mnemonic && (
        <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 flex gap-2.5">
          <Lightbulb className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-0.5">
              Mnemotecnia
            </p>
            <p className="text-sm text-foreground leading-relaxed">{card.mnemonic}</p>
          </div>
        </div>
      )}

      {/* Tags */}
      <TagChips tags={card.tags} />
    </div>
  );
}

// Vista de edicion: todos los campos editables
function CardEdit({ card, onChange }) {
  if (!card) return null;

  const updateField = (field, value) => {
    onChange({ ...card, [field]: value });
  };

  const updateTag = (index, value) => {
    const newTags = [...(card.tags || [])];
    newTags[index] = value;
    updateField("tags", newTags);
  };

  const addTag = () => {
    updateField("tags", [...(card.tags || []), ""]);
  };

  const removeTag = (index) => {
    const newTags = [...(card.tags || [])];
    newTags.splice(index, 1);
    updateField("tags", newTags);
  };

  return (
    <div className="space-y-4">
      {/* Concepto */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Concepto
        </Label>
        <Input
          value={card.concept || ""}
          onChange={(e) => updateField("concept", e.target.value)}
          maxLength={120}
          placeholder="Nombre del concepto..."
        />
      </div>

      {/* Definicion */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Definicion
          <span className="text-muted-foreground/60 normal-case font-normal ml-1">
            (1 frase)
          </span>
        </Label>
        <Input
          value={card.definition || ""}
          onChange={(e) => updateField("definition", e.target.value)}
          placeholder="Definicion tecnica en una frase..."
        />
      </div>

      {/* Explicacion */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Explicacion
        </Label>
        <textarea
          value={card.explanation || ""}
          onChange={(e) => updateField("explanation", e.target.value)}
          rows={3}
          placeholder="Aclaracion profunda del concepto..."
          aria-label="Explicacion del concepto"
          className={cn(
            "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-y transition-colors outline-none",
            "placeholder:text-muted-foreground",
            "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          )}
        />
      </div>

      {/* Usar cuando */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wider flex items-center gap-1.5">
          <CheckCircle2 className="size-3.5" />
          Usar cuando
        </Label>
        <textarea
          value={card.use_case || ""}
          onChange={(e) => updateField("use_case", e.target.value)}
          rows={2}
          placeholder="Caso de uso practico..."
          aria-label="Caso de uso"
          className={cn(
            "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-y transition-colors outline-none",
            "placeholder:text-muted-foreground",
            "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          )}
        />
      </div>

      {/* Evitar cuando */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wider flex items-center gap-1.5">
          <XCircle className="size-3.5" />
          Evitar cuando
          <span className="text-muted-foreground/60 normal-case font-normal ml-1">
            (opcional)
          </span>
        </Label>
        <textarea
          value={card.avoid_when || ""}
          onChange={(e) => updateField("avoid_when", e.target.value)}
          rows={2}
          placeholder="Cuando NO usarlo..."
          aria-label="Evitar cuando"
          className={cn(
            "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-y transition-colors outline-none",
            "placeholder:text-muted-foreground",
            "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          )}
        />
      </div>

      {/* Codigo */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Codigo
          </Label>
          <div className="flex items-center gap-2">
            <Label htmlFor="code-language-select" className="text-xs text-muted-foreground">Lenguaje:</Label>
            <select
              value={card.code_language || "javascript"}
              onChange={(e) => updateField("code_language", e.target.value)}
              id="code-language-select"
              aria-label="Lenguaje de programacion"
              className="px-2 py-1 rounded-md border border-input bg-background text-xs outline-none focus-visible:border-ring"
            >
              {LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <CodeEditor
          value={card.code || ""}
          onChange={(value) => updateField("code", value)}
          placeholder="Pega tu snippet de codigo aqui..."
        />
      </div>

      {/* Mnemotecnia */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
          <Lightbulb className="size-3.5" />
          Mnemotecnia
          <span className="text-muted-foreground/60 normal-case font-normal ml-1">
            (opcional)
          </span>
        </Label>
        <Input
          value={card.mnemonic || ""}
          onChange={(e) => updateField("mnemonic", e.target.value)}
          maxLength={200}
          placeholder="Truco para recordar..."
        />
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Tag className="size-3.5" />
          Tags
        </Label>
        <div className="space-y-2">
          {(card.tags || []).map((tag, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={tag}
                onChange={(e) => updateTag(i, e.target.value)}
                placeholder="tag-slug"
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeTag(i)}
                aria-label="Eliminar tag"
              >
                <X className="size-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addTag}
            className="gap-2"
          >
            <Plus className="size-4" />
            Anadir tag
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function CardEditor({ card, onChange, originalCard }) {
  // Modo por defecto: VIEW. El usuario entra a EDIT solo si lo decide.
  const [isEditing, setIsEditing] = useState(false);

  // Detectar si el usuario ha editado la card comparando con el original
  const wasEdited = (() => {
    if (!originalCard) return false;
    const fields = ["concept", "definition", "explanation", "use_case", "avoid_when", "mnemonic", "code", "code_language"];
    for (const f of fields) {
      if ((card?.[f] || "") !== (originalCard?.[f] || "")) return true;
    }
    if (JSON.stringify(card?.tags || []) !== JSON.stringify(originalCard?.tags || [])) return true;
    return false;
  })();

  return (
    <Card className="mb-6 border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            {isEditing && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400"
              >
                <AlertTriangle className="size-3 inline mr-0.5" />
                Editando
              </motion.span>
            )}
          </div>

          {/* Toggle VIEW / EDIT */}
          <div className="flex rounded-lg border border-border bg-background p-0.5">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                !isEditing
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Eye className="size-3.5" />
              Ver
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                isEditing
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Pencil className="size-3.5" />
              Editar
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-6">
        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div
              key="edit"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <CardEdit card={card} onChange={onChange} />
            </motion.div>
          ) : (
            <motion.div
              key="view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <CardView card={card} wasEdited={wasEdited} />
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
