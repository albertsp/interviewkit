"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layers, ArrowRight } from "lucide-react";

interface SavedCardsSummaryProps {
  total: number;
  topTags: string[];
}

export default function SavedCardsSummary({ total, topTags }: SavedCardsSummaryProps) {
  const router = useRouter();

  return (
    <motion.div whileHover={{ scale: 1.005 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="size-5 text-primary" />
            Cards guardadas
          </CardTitle>
          <CardAction>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => router.push("/dashboard")}
            >
              Ver todas
              <ArrowRight className="size-3.5" />
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="text-center py-2">
            <span className="text-4xl font-bold tracking-tight">{total}</span>
            <span className="text-sm text-muted-foreground ml-2">
              {total === 1 ? "card" : "cards"} guardadas
            </span>
          </div>

          {topTags && topTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 justify-center">
              {topTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
