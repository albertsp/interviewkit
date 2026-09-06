'use client'
import { useEffect, useState, useMemo } from "react"
import { useAuth } from "@/context/AuthContext";
import { getCards, updateCard, deleteCardById } from "@/services/cardService";

import { Button } from "@/components/ui/button";
import { InputGroupDemo } from "@/components/dashboard/barrabusqueda";
import { ToggleGroupDemo } from "@/components/dashboard/botonesFiltro";
import { SingleCard } from "@/components/dashboard/singleCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {

  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useAuth();

  const [selectedCard, setSelectedCard] = useState(null)
  const [originalCard, setOriginalCard] = useState(null)
  const [isSingleCardOpen, setIsSingleCardOpen] = useState(null)

  const [searchInput, setSearchInput] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [languageFilter, setLanguageFilter] = useState("")
  const [orderSort, setOrderSort] = useState("desc")

  useEffect(() => {
    if (!user) return
    let cancelled = false
    setLoading(true)
    getCards()
      .then((data) => {
        if (!cancelled) setCards(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [user])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 250)
    return () => clearTimeout(timer)
  }, [searchInput])

  const filtered_cards = useMemo(() => {
    return cards
      .filter((card) => {
        const matchesSearch = (card.concept ?? "").toLowerCase().includes(debouncedSearch.toLowerCase())
        const matchesLanguage = languageFilter === "" ? true : card.code_language === languageFilter
        return matchesSearch && matchesLanguage
      })
      .sort((a, b) => {
        if (orderSort === "asc") {
          return new Date(a.created_at) - new Date(b.created_at)
        }
        return new Date(b.created_at) - new Date(a.created_at)
      })
  }, [cards, debouncedSearch, languageFilter, orderSort])

  const handleDeleteCard = async (card_id) => {
    const previousCards = cards
    setCards(cards.filter(c => c.card_id !== card_id))
    setIsSingleCardOpen(false)
    setSelectedCard(null)
    setOriginalCard(null)
    try {
      await deleteCardById(card_id)
    } catch (err) {
      setCards(previousCards)
      setError(err.message)
    }
  }

  const handleSaveCard = async () => {
    if (!selectedCard) return
    const previousCards = cards
    const updatedCards = cards.map(c => c.card_id === selectedCard.card_id ? { ...selectedCard } : c)
    setCards(updatedCards)
    setIsSingleCardOpen(false)
    setSelectedCard(null)
    setOriginalCard(null)
    try {
      await updateCard(selectedCard.card_id, selectedCard)
    } catch (err) {
      setCards(previousCards)
      setError(err.message)
    }
  }

  const abrirCard = (card) => {
    setIsSingleCardOpen(true)
    setSelectedCard(card)
    setOriginalCard({ ...card })
  }

  const handleCardChange = (updatedCard) => {
    setSelectedCard(updatedCard)
  }

  if (loading) {
    return (
      <div className="min-h-screen px-6 pt-24 pb-12 md:pt-28 md:pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-muted rounded-lg w-64" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-muted rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen px-6 pt-24 pb-12 md:pt-28 md:pb-20">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-destructive text-lg font-medium">{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => {
            setError(null);
            setLoading(true);
            getCards()
              .then(setCards)
              .catch(() => setError("No se han podido cargar las cards. Inténtalo de nuevo"))
              .finally(() => setLoading(false))
          }}>
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-6 pt-24 pb-12 md:pt-28 md:pb-20">
      <div className="max-w-6xl mx-auto">

        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-10">
          <InputGroupDemo setSearchInput={setSearchInput} resultCount={filtered_cards.length} />
          <ToggleGroupDemo setLanguageFilter={setLanguageFilter} setOrderSort={setOrderSort} />
        </div>

        {filtered_cards.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">
              {cards.length === 0 ? "Aun no tienes cards guardadas" : "No se encontraron cards con ese filtro"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <SingleCard isSingleCardOpen={isSingleCardOpen} setIsSingleCardOpen={setIsSingleCardOpen} selectedCard={selectedCard} originalCard={originalCard} onCardChange={handleCardChange} onSave={handleSaveCard} deleteCard={handleDeleteCard}/>

            {filtered_cards.map((card) => (
              <Card
                key={card.card_id}
                size="sm"
                className="group cursor-pointer ring-0 border border-border transition-[transform,border-color,box-shadow] duration-200 ease-out hover:scale-[1.02] hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 focus-visible:ring-2 focus-visible:ring-primary/50 outline-none"
                onClick={() => abrirCard(card)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrirCard(card); }}}
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
                      <Badge variant="outline" size="sm" className="uppercase tracking-wider border-primary/20 text-primary/80 shrink-0">
                        {card.code_language}
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  {card.explanation && (
                    <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                      {card.explanation}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );

}