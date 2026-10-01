const STEPS = [
  {
    title: "Configura tu sesión",
    description:
      "Elige rol, tecnología y nivel. Todo lo que viene después se ajusta a esa elección.",
  },
  {
    title: "Responde cinco preguntas de código",
    description:
      "La IA las genera al momento, sin teoría de manual: cada una te pide leer, escribir o arreglar código.",
  },
  {
    title: "Aprende de la corrección",
    description:
      "Ves qué has hecho bien, qué falla y cómo se resuelve. Cada concepto se guarda como una card para repasar.",
  },
];

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="scroll-mt-20 px-6 py-24 sm:py-32">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 lg:grid-cols-[1fr_1.6fr] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="mb-4 font-mono text-xs text-muted-foreground">
            Cómo funciona
          </p>
          <h2 className="display text-4xl font-medium leading-[1.05] sm:text-5xl">
            Tres pasos, una entrevista.
          </h2>
          <p className="mt-5 max-w-xs text-lg text-muted-foreground">
            De configurar la sesión a leer la corrección en menos de cinco
            minutos.
          </p>
        </div>

        <ol className="border-t border-border">
          {STEPS.map(({ title, description }, index) => (
            <li
              key={title}
              className="grid grid-cols-[4.5rem_1fr] gap-4 border-b border-border py-8 sm:grid-cols-[6.5rem_1fr] sm:py-10"
            >
              <span
                aria-hidden="true"
                className="display text-5xl leading-none text-primary sm:text-7xl"
              >
                {index + 1}
              </span>
              <div>
                <h3 className="display text-2xl font-medium sm:text-3xl">
                  {title}
                </h3>
                <p className="mt-3 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
                  {description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
