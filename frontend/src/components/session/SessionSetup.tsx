"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import StackSelector from "@/components/StackSelector";
import { getStacks, type StackResponse } from "@/services/stacksService";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RotateCw } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { LogoMark } from "@/components/Logo";

function Spinner({ label }: { label: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center pt-24 md:pt-28 pb-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <LogoMark className="size-12 animate-pulse" />
        <p role="status" className="display text-2xl text-muted-foreground">{label}</p>
      </motion.div>
    </div>
  );
}

interface SessionSetupProps {
  loading: boolean;
  error?: string | null;
  onSubmit: (selection: { rol: string; stack: string; topic: string; level: string }) => void;
}

export default function SessionSetup({ loading, error, onSubmit }: SessionSetupProps) {
  const [stacks, setStacks] = useState<StackResponse | null>(null);
  const [stacksError, setStacksError] = useState<string | null>(null);
  const [loadingStacks, setLoadingStacks] = useState(true);

  async function loadStacks() {
    setLoadingStacks(true);
    setStacksError(null);
    try {
      const data = await getStacks();
      setStacks(data);
    } catch (err) {
      setStacksError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingStacks(false);
    }
  }

  useEffect(() => {
    loadStacks();
  }, []);

  if (loading) {
    return <Spinner label="Creando sesión…" />;
  }

  if (loadingStacks) {
    return <Spinner label="Cargando opciones…" />;
  }

  if (stacksError) {
    return (
      <PageContainer max="3xl" innerClassName="flex flex-col items-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 md:p-10 flex flex-col items-center text-center gap-4">
            <div>
              <h2 className="display text-2xl font-medium mb-1">
                No se pudieron cargar las opciones
              </h2>
              <p className="text-sm text-muted-foreground">{stacksError}</p>
            </div>
            <Button onClick={loadStacks} className="gap-2">
              <RotateCw className="size-4" />
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer max="3xl">
      <PageHeader
        title="Nueva sesión"
        description="Configura tu entrevista en cuatro pasos."
      />
      {stacks && <StackSelector onSubmit={onSubmit} stacks={stacks} />}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          role="alert"
          className="mt-8 border-l-2 border-destructive pl-3 text-destructive"
        >
          {error}
        </motion.p>
      )}
    </PageContainer>
  );
}
