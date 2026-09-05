import Providers from "./providers";
import "@/index.css";

export const metadata = {
  title: "InterviewKit",
  description: "Practica para tu próxima entrevista técnica",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className="dark font-sans">
      <body className="dark font-sans">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-md focus:bg-primary focus:text-primary-foreground focus:text-sm focus:font-medium">
          Saltar al contenido
        </a>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
