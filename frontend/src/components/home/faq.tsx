import { Plus } from "lucide-react";

const FAQS = [
  {
    q: "¿Cómo funciona InterviewKit?",
    a: "Eliges tu rol (frontend o backend), la tecnología y tu nivel. La IA genera 5 preguntas de código, respondes cada una y recibes feedback con la respuesta correcta explicada.",
  },
  {
    q: "¿Es gratuito?",
    a: "Sí. Puedes crear una cuenta y practicar sin pagar. Todas tus sesiones y cards quedan guardadas.",
  },
  {
    q: "¿Qué tecnologías puedo practicar?",
    a: "HTML, CSS, JavaScript, React, Python y SQL. Iremos añadiendo más.",
  },
  {
    q: "¿Las preguntas las genera una IA?",
    a: "Sí. Cada entrevista se genera al momento con modelos de lenguaje (vía Groq), adaptada al rol, la tecnología y el nivel que elijas. Cada sesión es distinta.",
  },
  {
    q: "¿Se guardan mis resultados?",
    a: "Sí. Cada sesión y cada card se guardan en tu cuenta, junto con tu XP y tu nivel.",
  },
  {
    q: "¿Puedo usar mi cuenta desde cualquier dispositivo?",
    a: "Sí. Tu progreso está sincronizado: inicia sesión donde quieras y sigue donde lo dejaste.",
  },
];

export default function Faq() {
  return (
    <section id="faq" className="scroll-mt-20 px-6 py-24 sm:py-32">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 lg:grid-cols-[1fr_1.6fr] lg:gap-20">
        <div>
          <p className="mb-4 font-mono text-xs text-muted-foreground">FAQ</p>
          <h2 className="display text-4xl font-medium leading-[1.05] sm:text-5xl">
            Preguntas frecuentes
          </h2>
        </div>

        <div className="border-t border-border">
          {FAQS.map(({ q, a }) => (
            <details key={q} className="group border-b border-border">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-lg font-medium marker:hidden [&::-webkit-details-marker]:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                {q}
                <Plus
                  aria-hidden="true"
                  className="size-5 shrink-0 text-primary transition-transform duration-200 group-open:rotate-45"
                />
              </summary>
              <p className="max-w-xl pb-6 text-base leading-relaxed text-muted-foreground">
                {a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
