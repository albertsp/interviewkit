import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DeleteCardDialog } from "@/components/dashboard/DeleteCardDialog"
import { ConfirmEditDialog } from "@/components/dashboard/ConfirmEditDialog"
import { useState } from "react"
import CardEditor from "@/components/session/CardEditor"
import { Lightbulb, Save } from "lucide-react"
import type { CardDTO } from "@/services/cardService"

interface SingleCardProps {
  isSingleCardOpen: boolean | null
  setIsSingleCardOpen: (value: boolean) => void
  selectedCard: CardDTO | null
  originalCard: CardDTO | null
  onCardChange: (card: CardDTO) => void
  onSave: () => void
  deleteCard: (cardId: number) => void
}

export function SingleCard({ isSingleCardOpen, setIsSingleCardOpen, selectedCard, originalCard, onCardChange, onSave, deleteCard }: SingleCardProps) {

  const [isDeleteCardOpen, setIsDeleteCardOpen] = useState<boolean | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const openDelete = () => {
    setIsDeleteCardOpen(true)
  }

  return (

    <Dialog open={!!isSingleCardOpen} onOpenChange={setIsSingleCardOpen}>
      <DeleteCardDialog isDeleteCardOpen={isDeleteCardOpen} setIsDeleteCardOpen={setIsDeleteCardOpen} deleteCard={deleteCard} selectedCard={selectedCard} />
      <ConfirmEditDialog isConfirmOpen={isConfirmOpen} setIsConfirmOpen={setIsConfirmOpen} onSave={onSave} />
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Lightbulb className="size-5 text-primary" />
            Card de estudio
          </DialogTitle>
          <DialogDescription>
            Revisa y edita los detalles de tu card de estudio
          </DialogDescription>
        </DialogHeader>

        {selectedCard && (
          <>
            <div className="flex-1 min-h-0 overflow-y-auto -mx-4 px-4">
              <CardEditor card={selectedCard} onChange={onCardChange} originalCard={originalCard} />
            </div>
            <DialogFooter className="sm:justify-between">
              <Button
                variant="destructive"
                className="text-xs font-medium px-3 py-1.5 h-auto shadow-none"
                onClick={() => { openDelete() }}>
                Eliminar
              </Button>
              <Button
                onClick={() => setIsConfirmOpen(true)}
                className="gap-2"
              >
                <Save className="size-4" />
                Guardar cambios
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>

    </Dialog>
  )
}
