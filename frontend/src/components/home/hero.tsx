import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CorrectionSheet } from "./specimens";

const H1_WORDS = ["Ensaya", "la", "entrevista", "técnica", "antes", "de", "la", "real."];
const HIGHLIGHT = "antes";
const TECHS = ["HTML", "CSS", "JavaScript", "React", "Python", "Java", "SQL"];

const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

export default function Hero() {
  return (
    <section className="px-6 pt-28 sm:pt-36">
      <div className="relative mx-auto max-w-6xl">
        {/* 12-column grid, drawn once on load. Decorative: it is the layout made visible. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden grid-cols-12 sm:grid">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="origin-top border-l border-border/70 last:border-r"
              style={{ animation: `grow-y 900ms var(--ease-out) ${i * 45}ms both` }}
            />
          ))}
        </div>

        <div className="relative grid grid-cols-1 items-center gap-14 pb-20 lg:grid-cols-[1.15fr_1fr] lg:gap-16 sm:pb-28">
          <div>
            <h1 className="display text-[2.9rem] font-black leading-[0.97] tracking-[-0.055em] sm:text-7xl lg:text-[5.4rem]">
              {H1_WORDS.map((word, i) => (
                <span key={`${word}-${i}`}>
                  <span className="word">
                    <span className="word-inner" style={delay(120 + i * 70)}>
                      {word === HIGHLIGHT ? <span className="mark-sweep">{word}</span> : word}
                    </span>
                  </span>{" "}
                </span>
              ))}
            </h1>

            <p className="rise mt-8 max-w-lg text-lg leading-relaxed text-muted-foreground" style={delay(750)}>
              InterviewKit genera cinco preguntas (dos de teoría y tres de código) según tu rol y tu nivel, corrige cada
              respuesta con IA y guarda lo aprendido en cards de repaso.
            </p>

            <div className="rise mt-10 flex flex-wrap items-center gap-x-8 gap-y-4" style={delay(900)}>
              <Link
                href="/register"
                className={cn(buttonVariants({ size: "lg" }), "group h-12 gap-2.5 px-6 text-base font-bold")}
              >
                Empezar gratis
                <ArrowRight className="size-5 transition-transform duration-200 ease-out group-hover:translate-x-1" />
              </Link>
              <Link href="/login" className="link-underline text-base font-semibold">
                Ya tengo cuenta
              </Link>
            </div>

            <p className="rise mt-5 font-mono text-xs text-muted-foreground" style={delay(1000)}>
              Gratis. Sin tarjeta de crédito.
            </p>
          </div>

          <CorrectionSheet />
        </div>
      </div>

      <div className="border-y-2 border-foreground">
        <div className="mx-auto flex max-w-6xl flex-wrap items-baseline gap-x-6 gap-y-2 py-5">
          <span className="font-mono text-xs text-muted-foreground">Tecnologías</span>
          <ul className="display flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xl font-extrabold sm:text-2xl">
            {TECHS.map((tech, i) => (
              <li key={tech} className="flex items-baseline gap-3">
                {tech}
                {i < TECHS.length - 1 && (
                  <span aria-hidden="true" className="text-primary">
                    /
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
