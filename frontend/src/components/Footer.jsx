"use client"

import Link from "next/link"
import { ExternalLink, Terminal } from "lucide-react"

const PRODUCT_LINKS = [
  { href: "#tecnologias", label: "Tecnologías" },
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#features", label: "Funcionalidades" },
  { href: "#faq", label: "Preguntas frecuentes" },
]

const ACCOUNT_LINKS = [
  { href: "/login", label: "Iniciar sesión" },
  { href: "/register", label: "Crear cuenta" },
]

export default function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
          <div className="col-span-2">
            <span className="text-2xl font-bold tracking-tight">InterviewKit</span>
            <p className="mt-3 text-sm text-muted-foreground max-w-xs leading-relaxed">
              Simula entrevistas técnicas con IA, recibe feedback al instante y repasa con cards personalizadas.
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-medium font-mono">
              <Terminal className="size-3" />
              Potenciado por IA
            </span>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Producto</h3>
            <ul className="flex flex-col gap-3">
              {PRODUCT_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <a href={href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Cuenta</h3>
            <ul className="flex flex-col gap-3">
              {ACCOUNT_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href="https://github.com/albertsp/interview-prep-app"
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
          <p className="text-sm text-muted-foreground">&copy; 2026 InterviewKit. Proyecto final de bootcamp.</p>
          <p className="text-sm text-muted-foreground">Hecho con Next.js, Flask y mucho café.</p>
        </div>
      </div>
    </footer>
  )
}
