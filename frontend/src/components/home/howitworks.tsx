import { Reveal } from "@/components/motion/Motion";

const STEPS = [
  {
    title: "Define tu perfil",
    description:
      "Elige rol, tecnología, tema y nivel. Cada pregunta se genera a partir de esa combinación.",
  },
  {
    title: "Responde cinco preguntas",
    description:
      "Dos de teoría y tres de código. Redacta la respuesta o escribe tu solución en un editor integrado: lees, escribes o corriges código.",
  },
  {
    title: "Recibe la corrección",
    description:
      "La IA indica qué has resuelto bien, dónde falla y cuál es la solución, y lo convierte en una card de estudio.",
  },
];

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="scroll-mt-20 px-6 py-24 sm:py-32">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 lg:grid-cols-[1fr_1.6fr] lg:gap-20">
        <Reveal className="lg:sticky lg:top-28 lg:self-start">
          <p className="mb-4 font-mono text-xs text-muted-foreground">Cómo funciona</p>
          <h2 className="display text-4xl font-black leading-[0.98] sm:text-5xl lg:text-6xl">
            De la configuración a la corrección en cinco minutos.
          </h2>
        </Reveal>

        <ol className="border-t-2 border-foreground">
          {STEPS.map(({ title, description }, index) => (
            <li key={title} className="border-b border-foreground">
              <Reveal delay={index * 0.08}>
                <div className="group grid grid-cols-[4.5rem_1fr] gap-4 py-8 transition-colors duration-200 sm:grid-cols-[7rem_1fr] sm:py-10">
                  <span
                    aria-hidden="true"
                    className="display text-6xl font-black leading-none text-primary transition-transform duration-300 ease-out group-hover:-translate-y-1 sm:text-8xl"
                  >
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="display text-2xl font-extrabold sm:text-3xl">{title}</h3>
                    <p className="mt-3 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
                      {description}
                    </p>
                  </div>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
