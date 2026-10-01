import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CorrectionSheet } from "./specimens";

const TECHS = ["HTML", "CSS", "JavaScript", "React", "Python", "SQL"];

export default function Hero() {
  return (
    <section className="px-6 pt-32 sm:pt-40">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-14 pb-20 lg:grid-cols-[1.05fr_1fr] lg:gap-16 sm:pb-28">
        <div className="animate-in fade-in slide-in-from-bottom-3 duration-700">
          <h1 className="display tracking-[-0.025em] text-[2.75rem] font-medium leading-[1.02] sm:text-6xl lg:text-[4.75rem]">
            Practica la entrevista técnica{" "}
            <span className="mark-highlight">antes</span> de que cuente.
          </h1>

          <p className="mt-7 max-w-md text-lg leading-relaxed text-muted-foreground">
            Cinco preguntas de código a tu medida, corregidas por IA al
            instante, y cada concepto guardado como una card para repasar.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
            <Link
              href="/register"
              className={cn(
                buttonVariants({ size: "lg" }),
                "group h-12 gap-2.5 px-6 text-base font-semibold"
              )}
            >
              Empezar gratis
              <ArrowRight className="size-5 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
            <Link
              href="/login"
              className="text-base font-medium text-foreground underline decoration-border decoration-2 underline-offset-[6px] transition-colors hover:decoration-primary"
            >
              Ya tengo cuenta
            </Link>
          </div>

          <p className="mt-5 font-mono text-xs text-muted-foreground">
            Sin tarjeta. Sin instalar nada.
          </p>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-3 duration-1000 delay-150 fill-mode-both">
          <CorrectionSheet />
        </div>
      </div>

      <div className="border-y border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-baseline gap-x-8 gap-y-2 py-5">
          <span className="font-mono text-xs text-muted-foreground">
            Practica con
          </span>
          <ul className="display flex flex-wrap gap-x-8 gap-y-1 text-xl sm:text-2xl">
            {TECHS.map((tech) => (
              <li key={tech}>{tech}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
