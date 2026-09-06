import Link from "next/link";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  variant = "default",
  className,
}) {
  const compact = variant === "compact";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center gap-3",
        compact ? "py-8 px-4" : "py-16 px-6",
        className
      )}
    >
      <div
        className={cn(
          "rounded-full bg-muted flex items-center justify-center",
          compact ? "size-10" : "size-14"
        )}
      >
        <Icon className={cn("text-muted-foreground", compact ? "size-5" : "size-6")} />
      </div>
      <div className="space-y-1">
        <p className={cn("font-medium text-foreground", compact ? "text-sm" : "text-base")}>
          {title}
        </p>
        {description && (
          <p className="text-sm text-muted-foreground max-w-xs">{description}</p>
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
