import * as React from "react"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border text-xs font-medium whitespace-nowrap transition-colors shrink-0 gap-1 [&_svg]:pointer-events-none [&_svg]:size-3 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive/10 text-destructive dark:bg-destructive/20",
        outline:
          "border-border text-foreground",
        glow:
          "border-transparent bg-primary/10 text-primary shadow-[0_0_8px_oklch(0.72_0.19_195/0.3)]",
        gradient:
          "border-primary/20 bg-gradient-to-r from-primary/20 to-primary/5 text-primary",
      },
      size: {
        default: "px-2.5 py-0.5",
        sm: "px-2 py-0.25 text-[10px]",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  size = "default",
  ...props
}) {
  return (
    <span
      data-slot="badge"
      data-variant={variant}
      data-size={size}
      className={cn(badgeVariants({ variant, size, className }))}
      {...props} />
  );
}

export { Badge, badgeVariants }
