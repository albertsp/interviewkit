import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function CTA() {
  return (
    <section
      id="empezar"
      className="bg-foreground px-6 py-24 text-background sm:py-32"
    >
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-10 lg:flex-row lg:items-end lg:justify-between">
        <h2 className="display max-w-2xl text-4xl font-medium leading-[1.02] sm:text-6xl">
          Tu próxima entrevista empieza con{" "}
          <span className="italic">cinco preguntas.</span>
        </h2>
        <div className="flex flex-col items-start gap-4">
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
          <p className="font-mono text-xs opacity-70">
            Sin tarjeta. Tarda menos de un minuto.
          </p>
        </div>
      </div>
    </section>
  );
}
