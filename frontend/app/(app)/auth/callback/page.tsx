"use client";

import { useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { exchangeOAuthCode } from "@/services/authService";

function OAuthCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, loginFromOAuth } = useAuth();
  // Strict Mode runs effects twice in development; the code is read (and
  // removed from the address bar) on the first run only.
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const error = searchParams.get("error");

    if (error) {
      router.replace("/login?error=oauth_failed");
      return;
    }

    // The backend sends a one-time code in the URL fragment. Trading it for a
    // token (kept in localStorage, like an email login) works in browsers that
    // block third-party cookies, where the API-domain cookie never arrives.
    const code = new URLSearchParams(window.location.hash.replace(/^#/, "")).get("code");
    window.history.replaceState(null, "", window.location.pathname + window.location.search);

    const signIn = code
      ? exchangeOAuthCode(code).then(({ name, token }) => login(name, token))
      : loginFromOAuth();

    signIn
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
      <p className="text-muted-foreground">Completando inicio de sesión…</p>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-4rem)] flex items-center justify-center"><p className="text-muted-foreground">Cargando…</p></div>}>
      <OAuthCallbackHandler />
    </Suspense>
  );
}
