"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import StackSelector from "@/components/StackSelector";
import { getStacks } from "@/services/stacksService";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, RotateCw } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";

function Spinner({ label }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center pt-24 md:pt-28 pb-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <svg
          className="animate-spin h-10 w-10 text-primary"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <p className="text-muted-foreground text-xl">{label}</p>
      </motion.div>
    </div>
  );
}

export default function SessionSetup({ loading, error, onSubmit }) {
  const [stacks, setStacks] = useState(null);
  const [stacksError, setStacksError] = useState(null);
  const [loadingStacks, setLoadingStacks] = useState(true);

  async function loadStacks() {
    setLoadingStacks(true);
    setStacksError(null);
    try {
      const data = await getStacks();
      setStacks(data);
    } catch (err) {
      setStacksError(err.message);
    } finally {
      setLoadingStacks(false);
    }
  }

  useEffect(() => {
    loadStacks();
  }, []);

  if (loading) {
    return <Spinner label="Creando sesion..." />;
  }

  if (loadingStacks) {
    return <Spinner label="Cargando opciones..." />;
  }

  if (stacksError) {
    return (
      <PageContainer max="3xl" innerClassName="flex flex-col items-center">
        <Card className="w-full max-w-md border-0 ring-1 ring-foreground/10 shadow-sm">
          <CardContent className="p-8 md:p-10 flex flex-col items-center text-center gap-4">
            <div className="size-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="size-6 text-destructive" />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-1">
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
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Nueva sesion</h1>
        <p className="text-muted-foreground mt-1">
          Configura tu entrevista personalizada en cuatro pasos
        </p>
      </div>
      <StackSelector onSubmit={onSubmit} stacks={stacks} />
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-destructive text-center mt-8"
        >
          {error}
        </motion.p>
      )}
    </PageContainer>
  );
}
