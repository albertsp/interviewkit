import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const MAX_WIDTH = {
  "3xl": "max-w-3xl",
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
} as const;

interface PageContainerProps {
  children: ReactNode;
  max?: keyof typeof MAX_WIDTH;
  className?: string;
  innerClassName?: string;
}

export function PageContainer({ children, max = "6xl", className, innerClassName }: PageContainerProps) {
  return (
    <div className={cn("min-h-screen px-4 sm:px-6 pt-24 md:pt-28 pb-12 md:pb-16", className)}>
      <div className={cn("mx-auto", MAX_WIDTH[max] ?? MAX_WIDTH["6xl"], innerClassName)}>
        {children}
      </div>
    </div>
  );
}
