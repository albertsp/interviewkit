"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/layout/AuthShell";
import { useAuth } from "@/context/AuthContext";
import { loginUser } from "@/services/authService";
import { ArrowRight } from "lucide-react";
import { OAuthButtons } from "@/components/OAuthButtons";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const oauthError = searchParams.get("error");
  const [error, setError] = useState<string | null>(
    oauthError === "oauth_failed"
      ? "No se pudo completar el inicio de sesión. Inténtalo de nuevo."
      : oauthError === "email_exists"
      ? "Este email ya está registrado. Inicia sesión."
      : null
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("El email es obligatorio");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("El formato del email no es válido");
      return;
    }
    if (!password) {
      setError("La contraseña es obligatoria");
      return;
    }
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    setLoading(true);

    try {
      const result = await loginUser(email, password);
      localStorage.setItem("access_token", result.token);
      login(result.name);
      router.push("/session");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Inicia sesión"
      description="Accede para seguir practicando donde lo dejaste."
      footer={
        <>
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="font-medium text-foreground underline decoration-primary decoration-2 underline-offset-4">
            Regístrate
          </Link>
        </>
      }
    >
      <OAuthButtons />

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="login-email">Email</Label>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="nombre@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="login-password">Contraseña</Label>
          <Input
            id="login-password"
            type="password"
            autoComplete="current-password"
            placeholder="Mínimo 8 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <p role="alert" className="border-l-2 border-destructive pl-3 text-sm text-destructive">{error}</p>}

        <Button type="submit" disabled={loading} size="lg" className="h-11 w-full gap-2 text-base font-semibold">
          {loading ? "Iniciando sesión..." : "Iniciar sesión"}
          {!loading && <ArrowRight className="size-5" />}
        </Button>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-4rem)] flex items-center justify-center"><p className="text-muted-foreground">Cargando...</p></div>}>
      <LoginForm />
    </Suspense>
  );
}
