"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function FeedbackLoading() {
  return (
    <motion.div
      key="loading_feedback"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="text-center py-16"
    >
      <div className="relative inline-block mb-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          className="size-20 rounded-full border-4 border-primary/20 border-t-primary"
        />
        <Sparkles className="absolute inset-0 m-auto size-7 text-primary" />
      </div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-xl text-muted-foreground"
      >
        La IA esta evaluando tu respuesta...
      </motion.p>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-sm text-muted-foreground/60 mt-2"
      >
        Esto puede tardar unos segundos
      </motion.p>
    </motion.div>
  );
}
