"use client";

import { motion } from "framer-motion";
import { LogoMark } from "@/components/Logo";

export default function FeedbackLoading() {
  return (
    <motion.div
      key="loading_feedback"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="py-20 text-center"
      role="status"
    >
      <LogoMark className="mx-auto mb-8 size-16 animate-pulse" />
      <p className="display text-3xl font-medium">Corrigiendo tu respuesta…</p>
      <p className="mt-3 text-base text-muted-foreground">
        Puede tardar unos segundos.
      </p>
    </motion.div>
  );
}
