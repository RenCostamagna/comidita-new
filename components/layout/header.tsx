"use client"

import { ArrowLeft, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PlaceSearch } from "@/components/places/place-search"

interface HeaderProps {
  user?: any
  onViewProfile?: () => void
  showBackButton?: boolean
  onBack?: () => void
  onLogoClick?: () => void
  onPlaceSelect?: (place: any) => void
}

export function Header({
  user,
  onViewProfile,
  showBackButton = false,
  onBack,
  onLogoClick,
  onPlaceSelect,
}: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b h-16">
      <div className="container mx-auto px-4 h-full">
        <div className="flex items-center gap-4 h-full">
          {/* Left side - Back button or Logo */}
          <div className="flex-shrink-0">
            {showBackButton && onBack ? (
              <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            ) : (
              <button onClick={onLogoClick} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <h1 className="text-xl font-bold">Comidita</h1>
              </button>
            )}
          </div>

          {/* Center - Search bar (always visible when user is logged in) */}
          {user && (
            <div className="flex-1 mx-4">
              <PlaceSearch onPlaceSelect={onPlaceSelect || (() => {})} searchMode="local" />
            </div>
          )}

          {/* Right side - Notifications */}
          <div className="flex-shrink-0">
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-9 w-9 hover:bg-transparent focus:bg-transparent focus-visible:ring-0"
                    size="icon"
                  >
                    <Bell className="h-4 w-4" />
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                    >
                      3
                    </Badge>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80" align="end" forceMount>
                  <div className="flex items-center justify-between p-2">
                    <h4 className="font-semibold">Notificaciones</h4>
                    <Button variant="ghost" size="sm" className="text-xs">
                      Marcar como leídas
                    </Button>
                  </div>
                  <DropdownMenuSeparator />

                  {/* Notificaciones de ejemplo */}
                  <div className="max-h-96 overflow-y-auto">
                    <DropdownMenuItem className="flex flex-col items-start p-3 cursor-pointer">
                      <div className="flex items-center gap-2 w-full">
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">¡Nuevo nivel desbloqueado!</p>
                          <p className="text-xs text-muted-foreground">Ahora eres Principiante 🌱</p>
                          <p className="text-xs text-muted-foreground mt-1">Hace 2 horas</p>
                        </div>
                      </div>
                    </DropdownMenuItem>

                    <DropdownMenuItem className="flex flex-col items-start p-3 cursor-pointer">
                      <div className="flex items-center gap-2 w-full">
                        <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">+1100 puntos ganados</p>
                          <p className="text-xs text-muted-foreground">Primera reseña en "La Parrilla del Tío"</p>
                          <p className="text-xs text-muted-foreground mt-1">Hace 1 día</p>
                        </div>
                      </div>
                    </DropdownMenuItem>

                    <DropdownMenuItem className="flex flex-col items-start p-3 cursor-pointer">
                      <div className="flex items-center gap-2 w-full">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Alguien valoró tu reseña</p>
                          <p className="text-xs text-muted-foreground">Tu reseña de "Pizza Napolitana" fue útil</p>
                          <p className="text-xs text-muted-foreground mt-1">Hace 3 días</p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  </div>

                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="justify-center text-sm text-muted-foreground">
                    Ver todas las notificaciones
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
