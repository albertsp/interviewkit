import type { CSSProperties } from "react";
import { GrowBar } from "@/components/motion/Motion";

// Product specimens: real UI rendered as markup instead of screenshots, so they
// follow the active theme, stay sharp at any size and weigh nothing.

const SHEET = "border border-foreground bg-card text-card-foreground";
const CAPTION =
  "flex items-center justify-between border-b border-foreground px-5 py-3 font-mono text-xs text-muted-foreground";

const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

// Hero specimen. The pieces appear in the order a real correction unfolds:
// question, code, then the verdict, with the faulty dependency underlined last.
export function CorrectionSheet() {
  return (
    <figure
      className={`${SHEET} w-full shadow-[6px_6px_0_var(--primary)]`}
      aria-label="Ejemplo de pregunta de React corregida por la IA"
    >
      <figcaption className={`${CAPTION} rise`} style={delay(450)}>
        <span>React · Intermedio</span>
        <span>Pregunta 3 de 5</span>
      </figcaption>

      <div className="space-y-5 px-5 py-6 sm:px-7">
        <p className="display rise text-xl font-extrabold leading-snug sm:text-2xl" style={delay(600)}>
          ¿Por qué este efecto provoca un bucle infinito?
        </p>

        <pre
          className="rise overflow-x-auto bg-code-bg px-4 py-3 font-mono text-[13px] leading-relaxed text-code-text"
          style={delay(780)}
        >
          <code>
            {"useEffect(() => {\n  setItems([...items, data]);\n}, ["}
            <span className="squiggle" style={delay(1500)}>
              items
            </span>
            {"]);"}
          </code>
        </pre>

        <div className="rise border-l-[3px] border-primary pl-4" style={delay(1050)}>
          <p className="mb-1 font-mono text-xs font-medium uppercase tracking-wider text-primary">
            Parcial
          </p>
          <p className="text-[15px] leading-relaxed">
            Has detectado la dependencia, pero no que el efecto{" "}
            <code className="font-mono text-sm">modifica</code> ese mismo estado: cada
            render lo vuelve a disparar.
          </p>
          <p className="mt-2 font-mono text-[13px] text-primary">
            setItems(prev =&gt; [...prev, data])
          </p>
        </div>
      </div>
    </figure>
  );
}

export function IndexCard() {
  return (
    <figure className={`${SHEET} w-full`} aria-label="Ejemplo de card de estudio guardada">
      <figcaption className={CAPTION}>
        <span>JavaScript</span>
        <span>Closures</span>
      </figcaption>
      <div className="space-y-4 px-5 py-6 sm:px-7">
        <p className="display text-xl font-extrabold leading-snug sm:text-2xl">
          ¿Qué imprime este bucle y por qué?
        </p>
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          Una closure conserva el acceso a las variables de su ámbito. Con{" "}
          <code className="font-mono text-sm text-foreground">var</code>, todas las
          iteraciones comparten la misma{" "}
          <code className="font-mono text-sm text-foreground">i</code>.
        </p>
        <pre className="overflow-x-auto bg-code-bg px-4 py-3 font-mono text-[13px] leading-relaxed text-code-text">
          <code>{"for (let i = 0; i < 3; i++) {\n  setTimeout(() => log(i));\n}"}</code>
        </pre>
      </div>
    </figure>
  );
}

export function XpSpecimen() {
  return (
    <figure
      className={`${SHEET} w-full shadow-[6px_6px_0_var(--primary)]`}
      aria-label="Ejemplo de nivel y progreso de XP"
    >
      <div className="space-y-6 px-5 py-7 sm:px-7">
        <div className="flex items-end justify-between">
          <p className="display text-6xl font-black leading-none sm:text-7xl">
            Nv <span className="mark-highlight">7</span>
          </p>
          <p className="pb-1 font-mono text-xs text-muted-foreground">310 / 500 XP</p>
        </div>
        <GrowBar value={62} label="Progreso hacia el nivel 8" />
        <dl className="grid grid-cols-3 divide-x divide-border border-t border-foreground pt-4 text-center">
          {[
            ["12", "sesiones"],
            ["41", "cards"],
            ["68%", "aciertos"],
          ].map(([value, label]) => (
            <div key={label}>
              <dd className="display text-3xl font-black">{value}</dd>
              <dt className="font-mono text-xs text-muted-foreground">{label}</dt>
            </div>
          ))}
        </dl>
      </div>
    </figure>
  );
}
