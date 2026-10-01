"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Logo } from "@/components/Logo";

interface NavLink {
  href: string;
  label: string;
}

const PRODUCT_LINKS: NavLink[] = [
    { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#features", label: "Qué te llevas" },
  { href: "#faq", label: "FAQ" },
];

const ACCOUNT_LINKS: NavLink[] = [
  { href: "/login", label: "Iniciar sesión" },
  { href: "/register", label: "Crear cuenta" },
];

export default function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
          <div className="col-span-2">
            <Logo />
            <p className="mt-3 text-sm text-muted-foreground max-w-xs leading-relaxed">
              Simula entrevistas técnicas con IA, recibe feedback al instante y
              repasa con cards personalizadas.
            </p>
          </div>

          <div>
            <h3 className="font-mono text-xs text-muted-foreground mb-4">
              Producto
            </h3>
            <ul className="flex flex-col gap-3">
              {PRODUCT_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <a
                    href={href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-mono text-xs text-muted-foreground mb-4">
              Cuenta
            </h3>
            <ul className="flex flex-col gap-3">
              {ACCOUNT_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href="https://github.com/albertsp/interviewkit"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ExternalLink className="size-3.5" />
                  Código en GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            &copy; 2026 InterviewKit
          </p>
          <p className="text-sm text-muted-foreground">
            Hecho con Next.js y Flask.
          </p>
        </div>
      </div>
    </footer>
  );
}
