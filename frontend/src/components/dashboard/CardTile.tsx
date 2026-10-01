import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DifficultyDots } from "@/components/session/CardEditor"
import type { CardDTO } from "@/services/cardService"

interface CardTileProps {
  card: CardDTO
  onOpen: (card: CardDTO) => void
}

// Preview tile for the dashboard grid: a compact bento-style peek at the
// full flashcard (title, code snippet, tags, difficulty) that opens SingleCard.
export function CardTile({ card, onOpen }: CardTileProps) {
  const codePreview = card.code ? card.code.split("\n").slice(0, 3).join("\n") : null
  const tags = card.tags || []
  const visibleTags = tags.slice(0, 2)
  const extraTagCount = tags.length - visibleTags.length

  return (
    <Card
      size="sm"
      className="group cursor-pointer gap-3 ring-0 border border-border transition-colors duration-150 hover:border-foreground/50 focus-visible:ring-2 focus-visible:ring-ring outline-none"
      onClick={() => onOpen(card)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(card); } }}
      tabIndex={0}
      role="button"
      aria-label={`Abrir card: ${card.concept}`}
    >
      <CardHeader className="pb-1">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base group-hover:text-primary transition-colors duration-200">
            {card.concept}
          </CardTitle>
          {card.code_language && (
            <Badge variant="outline" size="sm" className="font-mono uppercase tracking-wider text-muted-foreground shrink-0">
              {card.code_language}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {card.explanation && (
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {card.explanation}
          </p>
        )}

        {codePreview && (
          <div className="overflow-hidden rounded-sm bg-code-bg">
            <pre className="px-3 py-2 overflow-hidden">
              <code className="text-[11px] font-mono leading-relaxed text-code-text whitespace-pre">
                {codePreview}
              </code>
            </pre>
          </div>
        )}
      </CardContent>

      {(visibleTags.length > 0 || card.difficulty) && (
        <CardFooter className="justify-between bg-muted/30">
          <div className="flex flex-wrap gap-1.5">
            {visibleTags.map((tag) => (
              <Badge key={tag} variant="tag" size="sm">{tag}</Badge>
            ))}
            {extraTagCount > 0 && (
              <Badge variant="secondary" size="sm">+{extraTagCount}</Badge>
            )}
          </div>
          <DifficultyDots difficulty={card.difficulty} />
        </CardFooter>
      )}
    </Card>
  )
}
