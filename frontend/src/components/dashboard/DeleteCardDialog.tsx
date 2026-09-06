import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog"
import type { CardDTO } from "@/services/cardService"

interface DeleteCardDialogProps {
  isDeleteCardOpen: boolean | null
  setIsDeleteCardOpen: (value: boolean) => void
  deleteCard: (cardId: number) => void
  selectedCard: CardDTO | null
}

export function DeleteCardDialog({ isDeleteCardOpen, setIsDeleteCardOpen, deleteCard, selectedCard }: DeleteCardDialogProps) {
  return (
    <Dialog open={!!isDeleteCardOpen} onOpenChange={setIsDeleteCardOpen}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Card Seleccionada</DialogTitle>
          <DialogDescription>
            ¿Estás seguro que deseas borrar la card?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            onClick={() => {
              if (!selectedCard) return
              deleteCard(selectedCard.card_id)
              setIsDeleteCardOpen(false)
            }}
          >
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
