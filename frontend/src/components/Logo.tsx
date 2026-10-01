import { cn } from "@/lib/utils";

// The brand mark is a cobalt square with a slash: the same "/" that splits
// Interview/Kit in the wordmark. Keep in sync with public/favicon.svg.
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={cn("size-6 text-primary", className)}
    >
      <rect width="32" height="32" fill="currentColor" />
      <path
        d="M12 25 L20.5 7"
        stroke="var(--primary-foreground)"
        strokeWidth="4.4"
        strokeLinecap="butt"
      />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "display text-[1.4rem] font-black leading-none tracking-[-0.06em] sm:text-2xl",
        className
      )}
    >
      Interview<span className="text-primary">/</span>Kit
    </span>
  );
}
