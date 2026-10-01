import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  eyebrow?: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

// Every in-app page opens the same way: a serif title on the left, optional
// actions on the right, and a hairline underneath. It answers "where am I?"
// before anything else on the screen.
export function PageHeader({ title, eyebrow, description, actions, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        "mb-8 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div>
        {eyebrow && (
          <p className="mb-2 font-mono text-xs text-muted-foreground">{eyebrow}</p>
        )}
        <h1 className="display text-4xl font-medium leading-tight sm:text-5xl">{title}</h1>
        {description && (
          <p className="mt-2 max-w-xl text-base text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </header>
  );
}
