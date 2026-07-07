"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

function OAuthCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginFromOAuth } = useAuth();

  useEffect(() => {
    const error = searchParams.get("error");

    if (error) {
      router.replace("/login?error=oauth_failed");
      return;
    }

    loginFromOAuth()
      .then(() => {
        router.replace("/session");
      })
      .catch(() => {
        router.replace("/login?error=oauth_failed");
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
      <p className="text-muted-foreground">Completando inicio de sesion...</p>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-4rem)] flex items-center justify-center"><p className="text-muted-foreground">Cargando...</p></div>}>
      <OAuthCallbackHandler />
    </Suspense>
  );
}