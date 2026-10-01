import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/motion/Motion";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function CTA() {
  return (
    <section id="empezar" className="bg-primary px-6 py-24 text-primary-foreground sm:py-32">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-10 lg:flex-row lg:items-end lg:justify-between">
        <Reveal>
          <h2 className="display max-w-2xl text-4xl font-black leading-[0.98] sm:text-6xl lg:text-7xl">
            Prepara tu próxima entrevista técnica.
          </h2>
          <p className="mt-6 max-w-md text-lg leading-relaxed opacity-85">
            Cinco preguntas, corrección inmediata y cards para repasar.
          </p>
        </Reveal>
        <Reveal delay={0.1} className="flex flex-col items-start gap-4">
          <Link
            href="/register"
            className={cn(
              buttonVariants({ size: "lg" }),
              "group h-12 gap-2.5 bg-primary-foreground px-6 text-base font-bold text-primary hover:bg-primary-foreground/90"
            )}
          >
            Empezar gratis
            <ArrowRight className="size-5 transition-transform duration-200 ease-out group-hover:translate-x-1" />
          </Link>
          <p className="font-mono text-xs opacity-80">Gratis. Sin tarjeta de crédito.</p>
        </Reveal>
      </div>
    </section>
  );
}
