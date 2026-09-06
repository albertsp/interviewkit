"use client";

import { useEffect, useRef, useState } from "react";
import { EditorView, keymap, placeholder as placeholderExt } from "@codemirror/view";
import { EditorState, Compartment, type Extension } from "@codemirror/state";
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

interface Language {
  id: string;
  label: string;
  extension: () => Extension;
}

// Languages available in the selector, mapped to their CodeMirror extension.
// Covers the stacks practiced in the app (JavaScript/React, Python, Java, SQL, HTML/CSS).
const LANGUAGES: Language[] = [
  { id: "javascript", label: "JavaScript", extension: () => javascript({ jsx: true }) },
  { id: "python", label: "Python", extension: () => python() },
  { id: "java", label: "Java", extension: () => java() },
  { id: "sql", label: "SQL", extension: () => sql() },
  { id: "html", label: "HTML", extension: () => html() },
  { id: "css", label: "CSS", extension: () => css() },
];

const DEFAULT_LANGUAGE = "javascript";

// Derives the initial selector language from the session's stack.
export function languageForStack(stack: string): string {
  const map: Record<string, string> = {
    JavaScript: "javascript",
    React: "javascript",
    Python: "python",
    Java: "java",
    SQL: "sql",
    "HTML/CSS": "html",
  };
  return map[stack] || DEFAULT_LANGUAGE;
}

function findLanguage(id: string): Language {
  return LANGUAGES.find((lang) => lang.id === id) || LANGUAGES[0];
}

// Syntax theme: GitHub Dark (real, battle-tested, good contrast) instead of a
// hand-rolled mapping to chart colors. Only background/caret/selection are
// overridden to match the app palette; token colors (keywords, strings,
// functions...) come from the theme itself.
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

// Editor chrome (borders, focus ring, typography) not covered by the syntax theme.
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

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  stack?: string;
}

export default function CodeEditor({
  value,
  onChange,
  placeholder = "",
  ariaLabel = "Editor de codigo",
  stack = "",
}: CodeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const languageCompartment = useRef(new Compartment());
  const defaultLanguage = languageForStack(stack);
  const [language, setLanguage] = useState(findLanguage(defaultLanguage).id);

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
        // Active language, reconfigurable from the selector without losing content
        languageCompartment.current.of(findLanguage(language).extension()),
        closeBrackets(),
        keymap.of([...defaultKeymap, indentWithTab]),
        githubTheme,
        editorTheme,
        placeholderExt(placeholder),
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

  // Syncs the value when it changes from outside (e.g. loading a saved answer)
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

  useEffect(() => {
    setLanguage(findLanguage(defaultLanguage).id);
  }, [defaultLanguage]);

  // Reconfigures the active language extension without recreating the editor or losing the cursor
  const handleLanguageChange = (id: string) => {
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
