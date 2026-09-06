import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AuthProvider } from "@/context/AuthContext";
import "@/index.css";

export const metadata: Metadata = {
  title: "InterviewKit",
  description: "Practica para tu próxima entrevista técnica",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body className="dark font-sans">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-md focus:bg-primary focus:text-primary-foreground focus:text-sm focus:font-medium">
          Saltar al contenido
        </a>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
