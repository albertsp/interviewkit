"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "¿Cómo funciona InterviewKit?",
    a: "Eliges tu rol (frontend o backend), la tecnología que quieres practicar y tu nivel de experiencia. La IA genera 5 preguntas personalizadas, respondes cada una y recibes feedback instantáneo con la respuesta correcta explicada.",
  },
  {
    q: "¿Es gratuito?",
    a: "Sí. Puedes crear una cuenta y empezar a practicar entrevistas de forma completamente gratuita. Todas tus sesiones y cards quedan guardadas.",
  },
  {
    q: "¿Qué tecnologías puedo practicar?",
    a: "Actualmente ofrecemos HTML, CSS, JavaScript, React, Python y SQL. Estamos trabajando en añadir más tecnologías pronto.",
  },
  {
    q: "¿Las preguntas son generadas por IA?",
    a: "Sí. Cada entrevista se genera al instante con IA (Groq + LLMs), adaptándose al rol, tecnología y nivel que eliges. Cada sesión es única.",
  },
  {
    q: "¿Se guardan mis resultados?",
    a: "Sí. Cada sesión y cada card Q&A se guarda en tu cuenta. Puedes revisar tu historial, consultar las cards guardadas y trackear tu progreso con el sistema de XP y niveles.",
  },
  {
    q: "¿Puedo usar mi cuenta desde cualquier dispositivo?",
    a: "Sí. Tu cuenta y todo tu progreso están sincronizados. Inicia sesión desde cualquier dispositivo y continúa donde lo dejaste.",
  },
];

export default function Faq() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section id="faq" className="w-full px-6 py-24 sm:py-32 bg-secondary/30">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <span className="text-primary font-mono text-sm font-medium tracking-wide uppercase mb-4 block">
            FAQ
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold text-foreground mb-4 tracking-tight">
            Preguntas frecuentes
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {FAQS.map(({ q, a }, index) => {
            const isOpen = openIndex === index;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="rounded-xl border border-border bg-card overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left cursor-pointer hover:bg-secondary/50 transition-colors"
                >
                  <span className="font-semibold text-foreground text-sm sm:text-base pr-4">{q}</span>
                  <ChevronDown className={`size-5 text-muted-foreground shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-5 text-muted-foreground leading-relaxed text-sm sm:text-base">
                        {a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}