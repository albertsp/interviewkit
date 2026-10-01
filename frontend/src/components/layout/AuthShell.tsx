import type { ReactNode } from "react";
import { LogoMark } from "@/components/Logo";

interface AuthShellProps {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
}

export function AuthShell({ title, description, children, footer }: AuthShellProps) {
  return (
    <div className="grid min-h-screen pt-16 lg:grid-cols-2">
      <aside className="hidden flex-col justify-end bg-foreground px-12 pb-16 text-background lg:flex xl:px-20">
        <LogoMark className="mb-8 size-12 text-primary" />
        <p className="display max-w-md text-4xl leading-[1.05] xl:text-5xl">
          Cada error de hoy es una <span className="italic">corrección</span> que
          no repetirás en la entrevista real.
        </p>
      </aside>

      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <h1 className="display text-4xl font-medium leading-tight sm:text-5xl">{title}</h1>
          <p className="mt-3 text-base text-muted-foreground">{description}</p>
          <div className="mt-8">{children}</div>
          <p className="mt-8 text-sm text-muted-foreground">{footer}</p>
        </div>
      </div>
    </div>
  );
}
