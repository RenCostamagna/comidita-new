"use client"

import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PlaceSearch } from "@/components/places/place-search"

// Importar el componente de notificaciones
import { NotificationBell } from "@/components/notifications/notification-bell"
import type { Notification } from "@/lib/notifications"

// Agregar props para manejar notificaciones
interface HeaderProps {
  user?: any
  onViewProfile?: () => void
  showBackButton?: boolean
  onBack?: () => void
  onLogoClick?: () => void
  onPlaceSelect?: (place: any) => void
  onNotificationClick?: (notification: Notification) => void // Nueva prop
}

// Actualizar el componente Header para incluir las notificaciones
export function Header({
  user,
  onViewProfile,
  showBackButton = false,
  onBack,
  onLogoClick,
  onPlaceSelect,
  onNotificationClick, // Nueva prop
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
                <h1 className="text-xl font-bold">🍽️</h1>
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
            {user && <NotificationBell userId={user.id} onNotificationClick={onNotificationClick} />}
          </div>
        </div>
      </div>
    </header>
  )
}
