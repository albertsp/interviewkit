"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const { user, initialized } = useAuth();
  const router = useRouter();

  // Don't redirect until AuthContext has verified the session
  useEffect(() => {
    if (initialized && !user) router.replace("/");
  }, [initialized, user, router]);

  if (!initialized) return null;
  if (!user) return null;
  return <>{children}</>;
}
