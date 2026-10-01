import { cn } from "@/lib/utils";

// The brand mark is a red-pen tick, the same stroke a teacher uses to mark an
// answer as correct. Keep it in sync with public/favicon.svg.
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={cn("size-6 text-primary", className)}
    >
      <path
        d="M4.5 17.5c2.2 1.6 4.6 4.6 6.6 8.2C14.6 15.6 20.4 8.4 27.5 4.8"
        stroke="currentColor"
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      <span className="display text-xl font-semibold leading-none sm:text-2xl">
        Interview<span className="italic font-normal">Kit</span>
      </span>
    </span>
  );
}
