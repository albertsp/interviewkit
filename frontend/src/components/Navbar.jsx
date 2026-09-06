"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { LayoutDashboard, Play, LogOut, LogIn, UserPlus, Star, BarChart3, Menu, X, User, SquareTerminal } from "lucide-react"
import { useAuth } from "@/context/AuthContext"

const BRAND = "InterviewKit"

function BrandText() {
  return (
    <span className="flex items-center gap-2">
      <SquareTerminal className="size-6 text-primary" strokeWidth={2} />
      <span className="text-2xl sm:text-3xl font-bold tracking-tight">{BRAND}</span>
    </span>
  )
}

function Navbar() {
  const { user, stats, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const initials = user ? user.charAt(0).toUpperCase() : "U"
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isActive = (path) => pathname === path

  const navLinks = user ? (
    [
      { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { path: "/stats", label: "Stats", icon: BarChart3 },
      { path: "/session", label: "Nueva sesion", icon: Play },
    ]
  ) : []

  const profileLink = { path: "/profile", label: "Perfil", icon: User }

  return (
    <header className="fixed top-0 inset-x-0 z-50 flex justify-center pt-4 pointer-events-none">
      <div className="pointer-events-auto flex w-[calc(100%-2rem)] max-w-6xl items-center justify-between px-4 sm:px-6 py-3 rounded-2xl bg-background/70 backdrop-blur-xl border border-border/30 shadow-lg shadow-black/5">

        <motion.button
          onClick={() => router.push("/")}
          className="outline-none cursor-pointer select-none shrink-0"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <BrandText />
        </motion.button>

        {user && (
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ path, label, icon: Icon }) => {
              const active = isActive(path)
              return (
                <Button
                  key={path}
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(path)}
                  className={cn(
                    "relative gap-2 text-sm",
                    active ? "text-primary hover:bg-transparent" : "text-foreground"
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="navActiveTab"
                      className="absolute inset-0 rounded-lg bg-primary/10"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <Icon className="size-4" />
                    {label}
                  </span>
                </Button>
              )
            })}
          </nav>
        )}

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {user && (
            <div
              className="hidden sm:flex items-center gap-2 rounded-lg border border-border/50 bg-background px-3 py-1.5 text-sm"
              title={`${stats.total_xp} XP · ${stats.xp_to_next_level} XP para Nv ${stats.level + 1}`}
            >
              <Star className="size-3.5 text-amber-500 fill-amber-500" />
              <span className="font-semibold tabular-nums">Nv {stats.level}</span>
              <span className="text-muted-foreground tabular-nums">{stats.total_xp} XP</span>
            </div>
          )}

          {user && <Separator orientation="vertical" className="h-6 hidden sm:block" />}

          {user ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="hidden md:flex items-center gap-2 rounded-full outline-none cursor-pointer transition-transform hover:scale-105">
                    <Avatar className="size-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                    {user || "Usuario"}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {navLinks.map(({ path, label, icon: Icon }) => (
                    <DropdownMenuItem key={path} onClick={() => router.push(path)}>
                      <Icon className="mr-2 size-4" />
                      {label}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuItem onClick={() => router.push(profileLink.path)}>
                    <profileLink.icon className="mr-2 size-4" />
                    {profileLink.label}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => { logout(); router.push("/") }}
                    variant="destructive"
                  >
                    <LogOut className="mr-2 size-4" />
                    Cerrar sesion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

<button
                 className="flex md:hidden items-center justify-center size-9 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                 onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                 aria-expanded={mobileMenuOpen}
                 aria-label={mobileMenuOpen ? "Cerrar menu" : "Abrir menu"}
               >
                {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              </button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => router.push("/login")} className="gap-1.5 text-xs sm:text-sm sm:gap-2">
                <LogIn className="size-4" />
                <span className="hidden sm:inline">Iniciar sesion</span>
              </Button>
              <Button size="sm" onClick={() => router.push("/register")} className="gap-1.5 text-xs sm:text-sm sm:gap-2">
                <UserPlus className="size-4" />
                <span className="hidden sm:inline">Registrarse</span>
              </Button>
            </>
          )}
        </div>

      </div>

      <AnimatePresence>
        {mobileMenuOpen && user && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed top-20 left-4 right-4 z-40 rounded-2xl bg-background/95 backdrop-blur-xl border border-border/30 shadow-lg p-4 flex flex-col gap-2 pointer-events-auto md:hidden"
          >
            <div className="flex items-center gap-3 pb-3 border-b border-border/30 mb-1">
              <Avatar className="size-9">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{user || "Usuario"}</span>
                <span className="text-xs text-muted-foreground">Nv {stats.level} · {stats.total_xp} XP</span>
              </div>
            </div>
{navLinks.map(({ path, label, icon: Icon }) => (
                <button
                  key={path}
                  onClick={() => { router.push(path); setMobileMenuOpen(false) }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                    isActive(path) ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground"
                  }`}
                >
                  <Icon className="size-4" />
                  {label}
                </button>
              ))}
              <button
                onClick={() => { router.push(profileLink.path); setMobileMenuOpen(false) }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                  isActive(profileLink.path) ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground"
                }`}
              >
                <profileLink.icon className="size-4" />
                {profileLink.label}
              </button>
            <button
              onClick={() => { logout(); router.push("/"); setMobileMenuOpen(false) }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
            >
              <LogOut className="size-4" />
              Cerrar sesion
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

export default Navbar
