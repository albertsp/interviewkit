"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { registerUser } from "@/services/authService";
import { UserPlus, Mail, Lock, User, ArrowRight } from "lucide-react";
import { OAuthButtons } from "@/components/OAuthButtons";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    if (!email.trim()) {
      setError("El email es obligatorio");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("El formato del email no es valido");
      return;
    }
    if (!password) {
      setError("La contrasena es obligatoria");
      return;
    }
    if (password.length < 8) {
      setError("La contrasena debe tener al menos 8 caracteres");
      return;
    }

    setLoading(true);

    try {
      await registerUser(name, email, password);
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <Card className="border-0 ring-1 ring-foreground/10 shadow-sm">
          <CardHeader className="space-y-1 pb-6 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 mb-2">
              <UserPlus className="size-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              Crear cuenta
            </CardTitle>
            <CardDescription>
              Registrate para empezar a practicar entrevistas
            </CardDescription>
          </CardHeader>

          <CardContent>
            <OAuthButtons dividerLabel="o registrate con email" />

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="register-name">Nombre</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="register-name"
                    type="text"
                    placeholder="Introduce tu nombre"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2"
                >
                  {error}
                </motion.p>
              )}

              <Button
                type="submit"
                disabled={loading}
                size="lg"
                className="w-full gap-2 text-base"
              >
                {loading ? "Creando cuenta..." : "Crear cuenta"}
                {!loading && <ArrowRight className="size-5" />}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Ya tienes cuenta?{" "}
              <Link
                href="/login"
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                Inicia sesion
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
