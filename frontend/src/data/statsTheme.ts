type Color = {
  bg: string;
  text: string;
  ring: string;
  bar: string;
};

export const STACK_COLORS: Record<string, Color> = {
  JavaScript: { bg: "bg-yellow-500/10", text: "text-yellow-600 dark:text-yellow-400", ring: "ring-yellow-500/30", bar: "#f7df1e" },
  React: { bg: "bg-cyan-500/10", text: "text-cyan-600 dark:text-cyan-400", ring: "ring-cyan-500/30", bar: "#61dafb" },
  Python: { bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", ring: "ring-emerald-500/30", bar: "#3776ab" },
  SQL: { bg: "bg-violet-500/10", text: "text-violet-600 dark:text-violet-400", ring: "ring-violet-500/30", bar: "#336791" },
  "HTML/CSS": { bg: "bg-orange-500/10", text: "text-orange-600 dark:text-orange-400", ring: "ring-orange-500/30", bar: "#e34f26" },
  Java: { bg: "bg-red-600/10", text: "text-red-700 dark:text-red-400", ring: "ring-red-600/30", bar: "#ea2d2e" },
};

export const LEVEL_BADGES: Record<string, string> = {
  Basico: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30",
  "Básico": "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30",
  Intermedio: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
  Avanzado: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
};
