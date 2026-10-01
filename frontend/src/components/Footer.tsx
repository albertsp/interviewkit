import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Logo } from "@/components/Logo";

interface NavLink {
  href: string;
  label: string;
}

const PRODUCT_LINKS: NavLink[] = [
  { href: "/#como-funciona", label: "Cómo funciona" },
  { href: "/#features", label: "Qué incluye" },
  { href: "/#faq", label: "FAQ" },
];

const ACCOUNT_LINKS: NavLink[] = [
  { href: "/login", label: "Iniciar sesión" },
  { href: "/register", label: "Crear cuenta" },
];

const LINK = "link-underline inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground";

export default function Footer() {
  return (
    <footer className="border-t-2 border-foreground bg-background">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          <div className="col-span-2">
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Entrevistas técnicas simuladas con corrección por IA y cards de repaso.
            </p>
          </div>

          <div>
            <h3 className="mb-4 font-mono text-xs text-muted-foreground">Producto</h3>
            <ul className="flex flex-col gap-3">
              {PRODUCT_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className={LINK}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-mono text-xs text-muted-foreground">Cuenta</h3>
            <ul className="flex flex-col gap-3">
              {ACCOUNT_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className={LINK}>
                    {label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href="https://github.com/albertsp/interviewkit"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={LINK}
                >
                  <ExternalLink className="size-3.5" />
                  Código en GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-xs text-muted-foreground">&copy; 2026 InterviewKit</p>
          <p className="font-mono text-xs text-muted-foreground">Next.js · Flask · PostgreSQL</p>
        </div>
      </div>
    </footer>
  );
}
