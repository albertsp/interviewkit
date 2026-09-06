export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.15 },
  },
};

export const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

// Transición entre fases de un mismo flujo (p.ej. wizard de sesión) dentro de un
// AnimatePresence mode="wait" — slide+fade direccional en vez de un fade plano.
export const phaseVariants = {
  initial: { opacity: 0, x: 16 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.25, ease: "easeOut" } },
  exit: { opacity: 0, x: -16, transition: { duration: 0.15, ease: "easeIn" } },
};
