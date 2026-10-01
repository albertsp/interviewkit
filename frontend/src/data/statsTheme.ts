type Color = {
  bg: string;
  text: string;
  ring: string;
  bar: string;
};

// Stacks are told apart by name, not by brand colour: a rainbow of language
// logos would fight the one-accent palette. Keys stay so lookups still work.
const NEUTRAL: Color = {
  bg: "bg-secondary",
  text: "text-foreground",
  ring: "ring-border",
  bar: "var(--foreground)",
};

export const STACK_COLORS: Record<string, Color> = {
  JavaScript: NEUTRAL,
  React: NEUTRAL,
  Python: NEUTRAL,
  SQL: NEUTRAL,
  "HTML/CSS": NEUTRAL,
  Java: NEUTRAL,
};

const LEVEL_NEUTRAL = "border-border text-muted-foreground";

export const LEVEL_BADGES: Record<string, string> = {
  Basico: LEVEL_NEUTRAL,
  "Básico": LEVEL_NEUTRAL,
  Intermedio: LEVEL_NEUTRAL,
  Avanzado: LEVEL_NEUTRAL,
};
