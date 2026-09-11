"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles, Terminal } from "lucide-react";

const HERO_TEXT = "Prepárate para tu próxima entrevista técnica";
const CHAR_INTERVAL = 50;

export default function Hero() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    setIsTyping(true);
    if (textRef.current) textRef.current.textContent = "";
    let i = 0;
    let lastTime = 0;
    let rafId: number;

    function step(timestamp: number) {
      if (!lastTime) lastTime = timestamp;
      const elapsed = timestamp - lastTime;
      if (elapsed >= CHAR_INTERVAL) {
        i++;
        lastTime = timestamp - (elapsed - CHAR_INTERVAL);
        if (textRef.current) {
          textRef.current.textContent = HERO_TEXT.slice(0, i);
        }
      }
      if (i < HERO_TEXT.length) {
        rafId = requestAnimationFrame(step);
      } else {
        setIsTyping(false);
      }
    }

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [mounted]);

  return (
    <section className="relative flex flex-col items-center justify-center px-4 sm:px-6 min-h-screen overflow-hidden pt-28 sm:pt-0">
      <div className="absolute inset-0 [background-image:linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] [background-size:64px_64px] opacity-40" />

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary/8 rounded-full blur-3xl" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/5 rounded-full blur-2xl" />

      <div className="relative z-10 flex flex-col items-center text-center max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="relative inline-flex items-center gap-1.5 mb-8 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm font-medium overflow-hidden font-mono"
        >
          <span className="relative z-10 flex items-center gap-1.5">
            <Terminal className="size-3.5" />
            Potenciado por IA
          </span>
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent"
            animate={{ x: ["-100%", "200%"] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut", repeatDelay: 4 }}
          />
        </motion.div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-foreground leading-[1.08] mb-6 max-w-5xl tracking-tight">
          <span ref={textRef}>{mounted ? "" : HERO_TEXT}</span>
          {isTyping && (
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut" }}
              className="inline-block w-[3px] h-[0.85em] bg-primary ml-1 align-middle rounded-full"
            />
          )}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: HERO_TEXT.length * 0.05 + 0.1, duration: 0.6, ease: "easeOut" }}
          className="text-muted-foreground text-lg sm:text-xl max-w-lg mb-10 leading-relaxed"
        >
          Simula entrevistas reales con IA. Recibe feedback instantáneo y repasa con cards personalizadas.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: HERO_TEXT.length * 0.05 + 0.25, duration: 0.5 }}
          className="flex flex-wrap gap-3 justify-center"
        >
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push("/register")}
            className="group inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-primary text-primary-foreground text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-shadow cursor-pointer"
          >
            <span>Empezar ahora</span>
            <ArrowRight className="size-5 transition-transform duration-300 group-hover:translate-x-1" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push("/login")}
            className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-border bg-secondary text-secondary-foreground text-base font-medium hover:bg-muted transition-colors cursor-pointer"
          >
            <Sparkles className="size-4 text-primary" />
            <span>Iniciar sesión</span>
          </motion.button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: HERO_TEXT.length * 0.05 + 0.6, duration: 0.8 }}
          className="mt-16 w-full max-w-xl"
        >
          <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-secondary/50">
              <div className="size-2.5 rounded-full bg-destructive/60" />
              <div className="size-2.5 rounded-full bg-yellow-500/60" />
              <div className="size-2.5 rounded-full bg-emerald-500/60" />
              <span className="ml-2 text-xs text-muted-foreground font-mono">session.interview</span>
            </div>
            <div className="px-4 py-3 font-mono text-sm text-left leading-relaxed">
              <p><span className="text-emerald-400">$</span> <span className="text-muted-foreground">interviewkit start</span> <span className="text-primary">--stack</span> <span className="text-amber-400">react</span> <span className="text-primary">--level</span> <span className="text-amber-400">mid</span></p>
              <p className="text-muted-foreground mt-1">Generando 5 preguntas personalizadas...</p>
              <p className="text-emerald-400 mt-1">✓ Listo. ¡Comienza tu entrevista!</p>
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
                className="inline-block w-2 h-4 bg-primary ml-0.5 align-middle"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
