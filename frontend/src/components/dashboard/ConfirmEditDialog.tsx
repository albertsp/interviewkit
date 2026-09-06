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

interface ConfirmEditDialogProps {
  isConfirmOpen: boolean
  setIsConfirmOpen: (value: boolean) => void
  onSave: () => void
}

export function ConfirmEditDialog({ isConfirmOpen, setIsConfirmOpen, onSave }: ConfirmEditDialogProps) {
  return (
    <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Confirmar cambios</DialogTitle>
          <DialogDescription>
            ¿Estás seguro que deseas guardar los cambios realizados?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={() => { onSave(); setIsConfirmOpen(false); }}>
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
