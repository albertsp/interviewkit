"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/context/ThemeContext"

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoids a hydration mismatch: the server always renders the "dark" icon
  // fallback because it can't know the client's stored/system preference.
  useEffect(() => setMounted(true), [])

  const isLight = mounted && theme === "light"

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={toggleTheme}
      aria-label={isLight ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
      className="text-muted-foreground hover:text-foreground"
    >
      {isLight ? <Moon className="size-4" /> : <Sun className="size-4" />}
    </Button>
  )
}
