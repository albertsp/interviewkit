import { Plus } from "lucide-react";
import { Reveal } from "@/components/motion/Motion";

const FAQS = [
  {
    q: "¿Cómo funciona InterviewKit?",
    a: "Eliges rol, tecnología, tema y nivel. La IA genera cinco preguntas (dos de teoría y tres de código), respondes cada una y recibes una corrección con la solución explicada. Cada pregunta se guarda como una card de estudio.",
  },
  {
    q: "¿Es gratuito?",
    a: "Sí. Crear una cuenta y practicar no tiene coste.",
  },
  {
    q: "¿Qué tecnologías puedo practicar?",
    a: "HTML, CSS, JavaScript, React, Python, Java y SQL. Iremos incorporando más.",
  },
  {
    q: "¿Cómo se generan las preguntas?",
    a: "Con modelos de lenguaje, a partir del rol, la tecnología, el tema y el nivel que elijas. Cada sesión es distinta.",
  },
  {
    q: "¿Cómo se evalúan mis respuestas?",
    a: "La IA compara tu respuesta con la solución esperada y la clasifica como correcta, parcial o incorrecta, con una explicación. Es una guía de estudio, no una evaluación oficial.",
  },
  {
    q: "¿Se guardan mis resultados?",
    a: "Sí. Tus sesiones, cards, XP y nivel se guardan en tu cuenta y están disponibles desde cualquier dispositivo.",
  },
];

export default function Faq() {
  return (
    <section id="faq" className="scroll-mt-20 px-6 py-24 sm:py-32">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 lg:grid-cols-[1fr_1.6fr] lg:gap-20">
        <Reveal>
          <p className="mb-4 font-mono text-xs text-muted-foreground">FAQ</p>
          <h2 className="display text-4xl font-black leading-[0.98] sm:text-5xl lg:text-6xl">
            Preguntas frecuentes
          </h2>
        </Reveal>

        <Reveal delay={0.08} className="border-t-2 border-foreground">
          {FAQS.map(({ q, a }) => (
            <details key={q} className="group border-b border-border">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-lg font-bold transition-colors duration-150 marker:hidden hover:text-primary [&::-webkit-details-marker]:hidden">
                {q}
                <Plus
                  aria-hidden="true"
                  className="size-5 shrink-0 text-primary transition-transform duration-300 ease-out group-open:rotate-45"
                />
              </summary>
              <p className="max-w-xl pb-6 text-base leading-relaxed text-muted-foreground">{a}</p>
            </details>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
