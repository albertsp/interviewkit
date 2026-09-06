"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

export default function CTA() {
  const router = useRouter();

  return (
    <section id="empezar" className="w-full px-6 py-24 sm:py-32">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="relative max-w-4xl mx-auto rounded-3xl border border-border bg-card overflow-hidden"
      >
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-primary/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col items-center text-center px-8 py-16 sm:py-20">
          <h2 className="text-3xl sm:text-5xl font-bold text-foreground mb-4 tracking-tight max-w-lg">
            ¿Listo para tu próxima entrevista?
          </h2>
          <p className="text-muted-foreground text-lg mb-10 max-w-md leading-relaxed">
            Configura tu sesión en segundos y empieza a practicar con IA ahora.
          </p>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push("/register")}
            className="group inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-primary text-primary-foreground text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-shadow cursor-pointer"
          >
            <span>Empezar ahora</span>
            <ArrowRight className="size-5 transition-transform duration-300 group-hover:translate-x-1" />
          </motion.button>
          <p className="text-xs text-muted-foreground/70 font-mono mt-6">
            Gratis · Sin tarjeta de crédito · Cancela cuando quieras
          </p>
        </div>
      </motion.div>
    </section>
  );
}