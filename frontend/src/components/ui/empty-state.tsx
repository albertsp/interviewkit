import Link from "next/link";
import { Inbox, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick?: () => void; href?: string };
  variant?: "default" | "compact";
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  variant = "default",
  className,
}: EmptyStateProps) {
  const compact = variant === "compact";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 border border-dashed border-border text-center",
        compact ? "px-4 py-8" : "px-6 py-16",
        className
      )}
    >
      <Icon
        aria-hidden="true"
        className={cn("text-muted-foreground", compact ? "size-5" : "size-7")}
        strokeWidth={1.5}
      />
      <div className="space-y-1">
        <p className={cn("display text-foreground", compact ? "text-base" : "text-2xl")}>
          {title}
        </p>
        {description && (
          <p className="mx-auto max-w-xs text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && (
        <Button size="sm" className="mt-1" onClick={action.onClick} asChild={!!action.href}>
          {action.href ? <Link href={action.href}>{action.label}</Link> : action.label}
        </Button>
      )}
    </div>
  );
}
