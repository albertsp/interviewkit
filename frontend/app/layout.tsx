import type { Metadata } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { MotionProvider } from "@/components/motion/Motion";
import "@/index.css";

// Runs before paint to avoid a light/dark flash: the server can't know the
// visitor's stored preference, so the class is applied client-side, first.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("theme");
    var theme = stored === "light" || stored === "dark"
      ? stored
      : (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    if (theme === "dark") document.documentElement.classList.add("dark");
  } catch (e) {}
})();
`;

export const metadata: Metadata = {
  metadataBase: new URL("https://interviewkit.dev"),
  title: "InterviewKit: ensaya tu entrevista técnica con IA",
  description: "Cinco preguntas de código a tu medida, corrección inmediata con IA y cards de estudio para repasar. Gratis.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "InterviewKit: ensaya tu entrevista técnica con IA",
    description: "Cinco preguntas de código a tu medida, corrección inmediata con IA y cards de estudio para repasar. Gratis.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "InterviewKit: ensaya tu entrevista técnica con IA",
    description: "Cinco preguntas de código a tu medida, corrección inmediata con IA y cards de estudio para repasar. Gratis.",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
      </head>
      <body className="font-sans">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-md focus:bg-primary focus:text-primary-foreground focus:text-sm focus:font-medium">
          Saltar al contenido
        </a>
        <ThemeProvider>
          <AuthProvider>
            <MotionProvider>{children}</MotionProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
