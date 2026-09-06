import type { Variants } from "framer-motion";

export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.15 },
  },
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

// Transition between phases of the same flow (e.g. the session wizard) inside an
// AnimatePresence mode="wait" — directional slide+fade instead of a flat fade.
export const phaseVariants: Variants = {
  initial: { opacity: 0, x: 16 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.25, ease: "easeOut" } },
  exit: { opacity: 0, x: -16, transition: { duration: 0.15, ease: "easeIn" } },
};
