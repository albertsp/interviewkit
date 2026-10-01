// Product specimens: real UI rendered as markup instead of screenshots, so they
// follow the active theme, stay sharp at any size and weigh nothing.

const SHEET =
  "border border-border bg-card text-card-foreground shadow-[0_18px_40px_-28px_oklch(0.2_0.02_60/0.45)]";

export function CorrectionSheet() {
  return (
    <figure
      className={`${SHEET} w-full`}
      aria-label="Ejemplo de pregunta de React corregida por la IA"
    >
      <figcaption className="flex items-center justify-between border-b border-border px-5 py-3 font-mono text-xs text-muted-foreground">
        <span>React · Mid</span>
        <span>Pregunta 3 de 5</span>
      </figcaption>

      <div className="space-y-5 px-5 py-6 sm:px-7">
        <p className="display text-xl leading-snug sm:text-2xl">
          ¿Por qué este efecto provoca un bucle infinito?
        </p>

        <pre className="overflow-x-auto bg-code-bg px-4 py-3 font-mono text-[13px] leading-relaxed text-code-text">
          <code>
            {"useEffect(() => {\n  setItems([...items, data]);\n}, ["}
            <span className="underline decoration-primary decoration-wavy decoration-2 underline-offset-4">
              items
            </span>
            {"]);"}
          </code>
        </pre>

        <div className="border-l-2 border-primary pl-4">
          <p className="mb-1 font-mono text-xs font-medium uppercase tracking-wider text-primary">
            Parcial
          </p>
          <p className="text-[15px] leading-relaxed">
            Has visto que el efecto depende de <code className="font-mono text-sm">items</code>,
            pero no que lo modifica: cada render lo vuelve a disparar. Usa la
            forma funcional y quita la dependencia:
          </p>
          <p className="mt-2 font-mono text-[13px]">
            setItems(<span className="mark-highlight">prev =&gt; [...prev, data]</span>)
          </p>
        </div>
      </div>
    </figure>
  );
}

export function IndexCard() {
  return (
    <figure
      className={`${SHEET} w-full`}
      aria-label="Ejemplo de card de estudio guardada"
    >
      <figcaption className="flex items-center justify-between border-b border-border px-5 py-3 font-mono text-xs text-muted-foreground">
        <span>JavaScript</span>
        <span>Closures</span>
      </figcaption>
      <div className="space-y-4 px-5 py-6 sm:px-7">
        <p className="display text-xl leading-snug sm:text-2xl">
          ¿Qué imprime este bucle y por qué?
        </p>
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          Una closure conserva el acceso a las variables de su ámbito. Con{" "}
          <code className="font-mono text-sm text-foreground">var</code> todas las
          iteraciones comparten la misma <code className="font-mono text-sm text-foreground">i</code>.
        </p>
        <pre className="overflow-x-auto bg-code-bg px-4 py-3 font-mono text-[13px] leading-relaxed text-code-text">
          <code>{"for (let i = 0; i < 3; i++) {\n  setTimeout(() => log(i));\n}"}</code>
        </pre>
      </div>
    </figure>
  );
}

export function XpSpecimen() {
  const progress = 62;
  return (
    <figure
      className={`${SHEET} w-full`}
      aria-label="Ejemplo de nivel y progreso de XP"
    >
      <div className="space-y-6 px-5 py-7 sm:px-7">
        <div className="flex items-end justify-between">
          <p className="display text-6xl leading-none sm:text-7xl">
            Nv <span className="mark-highlight">7</span>
          </p>
          <p className="pb-1 font-mono text-xs text-muted-foreground">
            310 / 500 XP
          </p>
        </div>
        <div
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progreso hacia el nivel 8"
          className="h-2 bg-muted"
        >
          <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
        </div>
        <dl className="grid grid-cols-3 divide-x divide-border border-t border-border pt-4 text-center">
          {[
            ["12", "sesiones"],
            ["41", "cards"],
            ["68%", "aciertos"],
          ].map(([value, label]) => (
            <div key={label}>
              <dd className="display text-2xl">{value}</dd>
              <dt className="font-mono text-xs text-muted-foreground">{label}</dt>
            </div>
          ))}
        </dl>
      </div>
    </figure>
  );
}
