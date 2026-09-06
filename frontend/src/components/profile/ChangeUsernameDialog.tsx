"use client"

import { useState } from "react"
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
import { Input } from "@/components/ui/input"
import { useAuth } from "@/context/AuthContext"
import { updateProfile } from "@/services/profileService"

interface ChangeUsernameDialogProps {
  isOpenChangeUserName: boolean
  setIsOpenChangeUserName: (value: boolean) => void
}

export function ChangeUsernameDialog({ isOpenChangeUserName, setIsOpenChangeUserName }: ChangeUsernameDialogProps) {
  const { user, updateUser, refreshStats } = useAuth()
  const [newName, setNewName] = useState(user || "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!newName.trim()) return
    setSaving(true)
    setError(null)
    try {
      await updateProfile(newName.trim())
      updateUser(newName.trim())
      await refreshStats()
      setIsOpenChangeUserName(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={isOpenChangeUserName} onOpenChange={setIsOpenChangeUserName}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Cambiar Nombre de Usuario</DialogTitle>
          <DialogDescription>
            Escribe tu nuevo nombre de usuario
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
        )}
        <div className="px-4 pb-2">
          <Input
            id="newName"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nombre de usuario"
            className="mt-1"
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={saving}>Cancelar</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={saving || !newName.trim()}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
