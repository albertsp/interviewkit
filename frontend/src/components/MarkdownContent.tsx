"use client";

import { cn } from "@/lib/utils";

interface Block {
  type: "text" | "code";
  content: string;
  language?: string;
}

// Splits text into code/text blocks by detecting ```language ... ``` fences
function parseMarkdownBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  // The language tag is normally followed by a real newline, but the AI
  // occasionally over-escapes JSON and the fence is followed directly by
  // the code instead (no newline at all) - match that too so the snippet
  // still renders instead of falling back to a plain-text block.
  const regex = /```(\w*)\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      blocks.push({
        type: "text",
        content: text.slice(lastIndex, match.index),
      });
    }

    blocks.push({
      type: "code",
      language: match[1] || "code",
      content: match[2].trimEnd(),
    });

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    blocks.push({
      type: "text",
      content: text.slice(lastIndex),
    });
  }

  return blocks.length > 0 ? blocks : [{ type: "text", content: text }];
}

const LANG_LABELS: Record<string, string> = {
  javascript: "JS",
  js: "JS",
  jsx: "JSX",
  typescript: "TS",
  ts: "TS",
  tsx: "TSX",
  python: "PY",
  py: "PY",
  sql: "SQL",
  html: "HTML",
  css: "CSS",
  bash: "Bash",
  sh: "Bash",
  shell: "Shell",
  json: "JSON",
  yaml: "YAML",
  xml: "XML",
  code: "Code",
};

interface MarkdownContentProps {
  text?: string;
  className?: string;
}

export default function MarkdownContent({ text, className }: MarkdownContentProps) {
  const blocks = parseMarkdownBlocks(text || "");

  return (
    <div className={cn("space-y-4", className)}>
      {blocks.map((block, idx) => {
        if (block.type === "code") {
          return <CodeSnippet key={idx} code={block.content} language={block.language ?? "code"} />;
        }
        return (
          <p key={idx} className="whitespace-pre-wrap leading-relaxed">
            <InlineText text={block.content} />
          </p>
        );
      })}
    </div>
  );
}

// Renders `inline code` and **bold** inside a text block; anything else stays
// plain text, so unexpected AI output can never inject markup.
export function InlineText({ text }: { text: string }) {
  const parts = text.split(/(`[^`\n]+`|\*\*[^*\n]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.length > 2 && part.startsWith("`") && part.endsWith("`")) {
          return (
            <code key={i} className="rounded-sm bg-secondary px-1.5 py-0.5 font-mono text-[0.9em] text-foreground">
              {part.slice(1, -1)}
            </code>
          );
        }
        if (part.length > 4 && part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
        }
        return part;
      })}
    </>
  );
}

function CodeSnippet({ code, language }: { code: string; language: string }) {
  const label = LANG_LABELS[language.toLowerCase()] || language || "Code";

  return (
    <div className="overflow-hidden rounded-md bg-code-bg">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-code-header border-b border-code-text/10">
        <span className="font-mono text-[11px] tracking-wider text-code-text/60 uppercase">
          {label}
        </span>
      </div>
      <pre className="p-4 overflow-x-auto">
        <code className="text-sm font-mono leading-relaxed text-code-text whitespace-pre">
          {code}
        </code>
      </pre>
    </div>
  );
}
