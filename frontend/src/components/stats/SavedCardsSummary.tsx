"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card";

interface SavedCardsSummaryProps {
  total: number;
  topTags: string[];
}

export default function SavedCardsSummary({ total, topTags }: SavedCardsSummaryProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Cards guardadas</CardTitle>
        <CardAction>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-medium underline decoration-border decoration-2 underline-offset-4 transition-colors hover:decoration-primary"
          >
            Ver todas
            <ArrowRight className="size-3.5" />
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p>
          <span className="display text-5xl font-medium tabular-nums">{total}</span>
          <span className="ml-2 text-sm text-muted-foreground">
            {total === 1 ? "card guardada" : "cards guardadas"}
          </span>
        </p>

        {topTags && topTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {topTags.map((tag) => (
              <Badge key={tag} variant="tag">{tag}</Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
