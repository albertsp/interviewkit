import { Reveal } from "@/components/motion/Motion";
import { IndexCard, XpSpecimen } from "./specimens";

const CORE = [
  {
    title: "Preguntas a tu medida",
    description:
      "Rol, tecnología, tema y nivel determinan cada pregunta. Dos sesiones nunca son iguales.",
  },
  {
    title: "Corrección inmediata",
    description:
      "Qué has resuelto bien, dónde falla y cuál es la solución, justo después de cada respuesta.",
  },
];

export default function Features() {
  return (
    <section
      id="features"
      className="scroll-mt-20 border-t-2 border-foreground bg-secondary/60 px-6 py-24 sm:py-32"
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.6fr] lg:gap-20">
          <Reveal>
            <p className="mb-4 font-mono text-xs text-muted-foreground">Qué incluye</p>
            <h2 className="display text-4xl font-black leading-[0.98] sm:text-5xl lg:text-6xl">
              Practica hoy. Repasa cuando lo necesites.
            </h2>
          </Reveal>

          <dl className="grid grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-2">
            {CORE.map(({ title, description }, i) => (
              <Reveal key={title} delay={i * 0.08} className="border-t-2 border-foreground pt-4">
                <dt className="display text-2xl font-extrabold">{title}</dt>
                <dd className="mt-2 text-base leading-relaxed text-muted-foreground">{description}</dd>
              </Reveal>
            ))}
          </dl>
        </div>

        <div className="mt-20 grid grid-cols-1 items-start gap-10 lg:mt-28 lg:grid-cols-[1.6fr_1fr] lg:gap-16">
          <Reveal>
            <IndexCard />
          </Reveal>
          <Reveal delay={0.1} className="lg:pt-10">
            <h3 className="display text-3xl font-black leading-tight sm:text-4xl">Cards de estudio</h3>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              Cada pregunta se guarda como una card con el concepto, su definición, un ejemplo de
              código y cuándo usarlo. Filtra por tecnología y repasa a tu ritmo.
            </p>
          </Reveal>
        </div>

        <div className="mt-20 grid grid-cols-1 items-center gap-10 lg:mt-28 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <Reveal>
            <h3 className="display text-3xl font-black leading-tight sm:text-4xl">Progreso medible</h3>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              Ganas XP en cada sesión y subes de nivel. Las estadísticas muestran en qué
              tecnologías aciertas más y dónde te falta práctica.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <XpSpecimen />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
