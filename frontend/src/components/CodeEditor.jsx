"use client";

import { useEffect, useRef, useState } from "react";
import { EditorView, keymap, placeholder as placeholderExt } from "@codemirror/view";
import { EditorState, Compartment } from "@codemirror/state";
import { defaultKeymap, indentWithTab } from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { sql } from "@codemirror/lang-sql";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { closeBrackets } from "@codemirror/autocomplete";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

// Lenguajes disponibles en el selector, mapeados a su extension de CodeMirror.
// Cubren los stacks practicados en la app (JavaScript/React, Python, Java, SQL, HTML/CSS).
const LANGUAGES = [
  { id: "javascript", label: "JavaScript", extension: () => javascript({ jsx: true }) },
  { id: "python", label: "Python", extension: () => python() },
  { id: "java", label: "Java", extension: () => java() },
  { id: "sql", label: "SQL", extension: () => sql() },
  { id: "html", label: "HTML", extension: () => html() },
  { id: "css", label: "CSS", extension: () => css() },
];

const DEFAULT_LANGUAGE = "javascript";

// Deriva el lenguaje inicial del selector a partir del stack de la sesion.
export function languageForStack(stack) {
  const map = {
    JavaScript: "javascript",
    React: "javascript",
    Python: "python",
    Java: "java",
    SQL: "sql",
    "HTML/CSS": "html",
  };
  return map[stack] || DEFAULT_LANGUAGE;
}

function findLanguage(id) {
  return LANGUAGES.find((lang) => lang.id === id) || LANGUAGES[0];
}

// Paleta de resaltado de sintaxis basada en las variables de color de la app
// (las mismas --chart-* que usan los graficos de stats), para que el editor
// se sienta parte del mismo sistema de diseno en vez de un tema importado.
const syntaxTheme = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.operatorKeyword, t.definitionKeyword, t.moduleKeyword], color: "var(--chart-4)" },
  { tag: [t.string, t.special(t.string)], color: "var(--chart-2)" },
  { tag: [t.number, t.bool, t.null], color: "var(--chart-3)" },
  { tag: [t.comment, t.lineComment, t.blockComment], color: "var(--muted-foreground)", fontStyle: "italic" },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], color: "var(--primary)" },
  { tag: [t.className, t.typeName], color: "var(--chart-5)" },
  { tag: [t.propertyName, t.attributeName], color: "var(--chart-1)" },
  { tag: [t.tagName], color: "var(--chart-4)" },
  { tag: [t.variableName, t.definition(t.variableName)], color: "var(--foreground)" },
  { tag: [t.operator, t.punctuation, t.bracket, t.angleBracket], color: "var(--muted-foreground)" },
  { tag: [t.invalid], color: "var(--destructive)" },
]);

// Estilo visual del editor, integrado con los tokens de color de la app
// en vez de un tema fijo tipo "Atom One Dark".
const editorTheme = EditorView.theme({
  "&": {
    borderRadius: "var(--radius-xl, 0.75rem)",
    border: "1px solid var(--border)",
    fontSize: "0.875rem",
    backgroundColor: "var(--background)",
    color: "var(--foreground)",
  },
  "&.cm-focused": {
    outline: "none",
    borderColor: "var(--ring)",
    boxShadow: "0 0 0 3px var(--ring)",
  },
  ".cm-scroller": {
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
    lineHeight: "1.6",
  },
  ".cm-content": {
    padding: "0.75rem 1rem",
    minHeight: "200px",
    caretColor: "var(--foreground)",
  },
  ".cm-cursor": {
    borderLeftColor: "var(--foreground)",
  },
  ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
    backgroundColor: "var(--accent)",
  },
  ".cm-gutters": {
    display: "none",
  },
  ".cm-placeholder": {
    color: "var(--muted-foreground)",
  },
});

export default function CodeEditor({
  value,
  onChange,
  placeholder = "",
  ariaLabel = "Editor de codigo",
  stack,
}) {
  const editorRef = useRef(null);
  const viewRef = useRef(null);
  const languageCompartment = useRef(new Compartment());
  const defaultLanguage = languageForStack(stack);
  const [language, setLanguage] = useState(findLanguage(defaultLanguage).id);

  // Crea el editor de CodeMirror al montar el componente
  useEffect(() => {
    if (!editorRef.current || viewRef.current) return;

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        const content = update.state.doc.toString();
        onChange(content);
      }
    });

    const state = EditorState.create({
      doc: value,
      extensions: [
        // Lenguaje activo, reconfigurable desde el selector sin perder el contenido
        languageCompartment.current.of(findLanguage(language).extension()),
        // Cierre automatico de parentesis, corchetes y llaves
        closeBrackets(),
        // Keybindings por defecto + tab para indentar
        keymap.of([...defaultKeymap, indentWithTab]),
        // Resaltado de sintaxis y tema visual propios de la app
        syntaxHighlighting(syntaxTheme),
        editorTheme,
        // Placeholder en el editor
        placeholderExt(placeholder),
        // Listener para notificar cambios al padre
        updateListener,
      ],
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sincroniza el valor cuando cambia desde fuera (ej. al cargar una respuesta guardada)
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const currentContent = view.state.doc.toString();
    if (value !== currentContent) {
      view.dispatch({
        changes: {
          from: 0,
          to: currentContent.length,
          insert: value,
        },
      });
    }
  }, [value]);

  // Sigue el lenguaje por defecto de la sesion (ej. al cambiar de stack)
  useEffect(() => {
    setLanguage(findLanguage(defaultLanguage).id);
  }, [defaultLanguage]);

  // Reconfigura la extension de lenguaje activa sin recrear el editor ni perder el cursor
  const handleLanguageChange = (id) => {
    setLanguage(id);
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: languageCompartment.current.reconfigure(findLanguage(id).extension()),
    });
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-end mb-2">
        <div className="relative">
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            aria-label="Lenguaje del editor de codigo"
            className={cn(
              "appearance-none rounded-lg border border-input bg-background text-xs font-medium",
              "pl-3 pr-7 py-1.5 outline-none cursor-pointer",
              "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            )}
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        </div>
      </div>
      <div ref={editorRef} className="w-full" role="textbox" aria-label={ariaLabel} aria-multiline="true" />
    </div>
  );
}
