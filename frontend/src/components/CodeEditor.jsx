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
import { githubDarkInit } from "@uiw/codemirror-theme-github";
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

// Tema de sintaxis: GitHub Dark (real, probado, buen contraste) en vez de un
// mapeo casero a colores de charts. Solo se sobreescribe el fondo/caret/
// seleccion para que encaje con la paleta de la app; los colores de token
// (keywords, strings, funciones...) son los propios del tema.
const githubTheme = githubDarkInit({
  settings: {
    background: "var(--background)",
    foreground: "var(--foreground)",
    caret: "var(--foreground)",
    selection: "var(--accent)",
    selectionMatch: "var(--accent)",
    lineHighlight: "transparent",
    gutterBackground: "var(--background)",
    gutterForeground: "var(--muted-foreground)",
  },
});

// Layout/marca propios del editor (bordes, foco, tipografia) que el tema
// de sintaxis no cubre.
const editorTheme = EditorView.theme({
  "&": {
    borderRadius: "var(--radius-xl, 0.75rem)",
    border: "1px solid var(--border)",
    fontSize: "0.875rem",
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
        // Tema GitHub Dark (sintaxis) + layout/marca propios de la app
        githubTheme,
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
