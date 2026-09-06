"use client";

import { motion } from "framer-motion";
import { FileCode2, Paintbrush, Braces, Atom, Code2, Database } from "lucide-react";

const TECHS = [
  { name: "HTML", Icon: FileCode2, color: "text-orange-400" },
  { name: "CSS", Icon: Paintbrush, color: "text-blue-400" },
  { name: "JavaScript", Icon: Braces, color: "text-yellow-400" },
  { name: "React", Icon: Atom, color: "text-cyan-400" },
  { name: "Python", Icon: Code2, color: "text-emerald-400" },
  { name: "SQL", Icon: Database, color: "text-violet-400" },
];

const duplicated = [...TECHS, ...TECHS];

export default function Techs() {
  return (
    <section id="tecnologias" className="w-full py-10 sm:py-14 overflow-hidden border-y border-border/50">
      <div className="max-w-6xl mx-auto">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center text-sm text-muted-foreground font-mono mb-6 px-4"
        >
          Practica con las tecnologías más demandadas — frontend, backend o datos
        </motion.p>

        <div className="relative [mask-image:linear-gradient(to_right,transparent_0%,black_10%,black_90%,transparent_100%)]">
          <motion.div
            className="flex gap-5"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
          >
            {duplicated.map(({ name, Icon, color }, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-3 flex-shrink-0 w-32 sm:w-40 py-7 rounded-2xl border border-border bg-card hover:border-primary/30 hover:bg-primary/5 transition-all duration-300"
              >
                <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center">
                  <Icon className={`size-5 ${color}`} strokeWidth={1.5} />
                </div>
                <span className="text-sm font-semibold text-foreground">{name}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}