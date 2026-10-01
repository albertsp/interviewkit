import { IndexCard, XpSpecimen } from "./specimens";

const CORE = [
  {
    title: "Preguntas a tu medida",
    description:
      "Rol, tecnología y nivel deciden qué te preguntan. Dos sesiones nunca son iguales.",
  },
  {
    title: "Feedback al instante",
    description:
      "Qué acertaste, qué falló y cuál es la solución correcta, justo después de responder.",
  },
];

export default function Features() {
  return (
    <section
      id="features"
      className="scroll-mt-20 border-t border-border bg-secondary/60 px-6 py-24 sm:py-32"
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.6fr] lg:gap-20">
          <div>
            <p className="mb-4 font-mono text-xs text-muted-foreground">
              Qué te llevas
            </p>
            <h2 className="display text-4xl font-medium leading-[1.05] sm:text-5xl">
              Lo que practicas hoy, lo repasas mañana.
            </h2>
          </div>

          <dl className="grid grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-2">
            {CORE.map(({ title, description }) => (
              <div key={title} className="border-t-2 border-foreground pt-4">
                <dt className="display text-2xl font-medium">{title}</dt>
                <dd className="mt-2 text-base leading-relaxed text-muted-foreground">
                  {description}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-20 grid grid-cols-1 items-start gap-10 lg:mt-28 lg:grid-cols-[1.6fr_1fr] lg:gap-16">
          <IndexCard />
          <div className="lg:pt-10">
            <h3 className="display text-3xl font-medium sm:text-4xl">
              Cards que no se pierden
            </h3>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              Cada pregunta se convierte en una card con el concepto, una
              definición, un ejemplo de código y cuándo usarlo. Filtra por
              tecnología y repasa a tu ritmo.
            </p>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 items-center gap-10 lg:mt-28 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <div className="lg:order-1">
            <h3 className="display text-3xl font-medium sm:text-4xl">
              Un progreso que se ve
            </h3>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              Ganas XP en cada sesión y subes de nivel. Las estadísticas te
              dicen en qué stacks aciertas más y dónde te falta práctica.
            </p>
          </div>
          <div className="lg:order-2">
            <XpSpecimen />
          </div>
        </div>
      </div>
    </section>
  );
}
