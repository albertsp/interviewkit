"use client";

import { motion } from "framer-motion";
import { Brain, BookOpen, BarChart3, Sparkles } from "lucide-react";
import { BrowserMockup } from "./BrowserMockup";

const MAIN_FEATURES = [
  {
    icon: BookOpen,
    title: "Cards con Q&A explicado",
    description: "Cada pregunta incluye respuesta detallada y explicación. Repasa a tu ritmo con cards guardadas, con ejemplos de código y tags por tema.",
    screenshot: { src: "/screenshots/dashboard-cards.png", alt: "Dashboard con la grid de cards de estudio guardadas en InterviewKit", label: "interviewkit.app/dashboard" },
  },
  {
    icon: BarChart3,
    title: "Sistema de XP y niveles",
    description: "Gana XP con cada sesión. Sube de nivel y trackea tu progreso con estadísticas detalladas: resultados, stacks dominados y sesiones recientes.",
    screenshot: { src: "/screenshots/stats-overview.png", alt: "Página de estadísticas con nivel, XP y gráficas de progreso en InterviewKit", label: "interviewkit.app/stats" },
  },
];

const SUPPORT_FEATURES = [
  {
    icon: Brain,
    title: "Entrevistas con IA",
    description: "Preguntas generadas por IA adaptadas a tu rol, tecnología y nivel. Simula una entrevista real.",
  },
  {
    icon: Sparkles,
    title: "Feedback instantáneo",
    description: "Responde cada pregunta y recibe evaluación inmediata. Aprende de tus errores al momento.",
  },
];

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function Features() {
  return (
    <section id="features" className="w-full px-6 py-24 sm:py-32">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-20"
        >
          <span className="text-primary font-mono text-sm font-medium tracking-wide uppercase mb-4 block">
            Qué consigues
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold text-foreground mb-4 tracking-tight">
            Todo lo que necesitas para preparar tu entrevista
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Una herramienta completa, simple y potenciada por inteligencia artificial.
          </p>
        </motion.div>

        <div className="flex flex-col gap-20 sm:gap-28 mb-20 sm:mb-28">
          {MAIN_FEATURES.map(({ icon: Icon, title, description, screenshot }, index) => (
            <div
              key={title}
              className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5 }}
                className={index % 2 === 1 ? "lg:order-2" : ""}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
                  <Icon className="size-5 text-primary" strokeWidth={1.5} />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 tracking-tight">{title}</h3>
                <p className="text-muted-foreground leading-relaxed text-lg">{description}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6 }}
                className={index % 2 === 1 ? "lg:order-1" : ""}
              >
                <BrowserMockup src={screenshot.src} alt={screenshot.alt} label={screenshot.label} />
              </motion.div>
            </div>
          ))}
        </div>

        <motion.div
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6"
        >
          {SUPPORT_FEATURES.map(({ icon: Icon, title, description }) => (
            <motion.div
              key={title}
              variants={item}
              className="group relative rounded-2xl border border-border bg-card p-6 sm:p-8 hover:border-primary/30 transition-colors duration-300"
            >
              <div className="absolute inset-0 rounded-2xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
                  <Icon className="size-5 text-primary" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
                <p className="text-muted-foreground leading-relaxed">{description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
