"use client"

import { Home, Star, User } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BottomNavigationProps {
  currentPage: "home" | "review" | "profile"
  onGoHome: () => void
  onGoReview: () => void
  onGoProfile: () => void
}

export function BottomNavigation({ currentPage, onGoHome, onGoReview, onGoProfile }: BottomNavigationProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border">
      <div className="container mx-auto px-4">
        {/* Contenedor con altura fija */}
        <div className="relative h-20 flex items-center justify-center">
          {/* Grid con posiciones fijas */}
          <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
            {/* Botón Inicio - Posición fija */}
            <div className="relative h-16 w-20 mx-auto">
              <Button
                variant="ghost"
                onClick={onGoHome}
                className="absolute inset-0 flex flex-col items-center justify-center gap-1 hover:bg-transparent"
              >
                <div
                  className={`p-2 rounded-full transition-all duration-200 ${
                    currentPage === "home"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Home className="h-4 w-4" />
                </div>
                <span
                  className={`text-xs transition-colors duration-200 tracking-tight ${
                    currentPage === "home" ? "text-primary font-medium" : "text-muted-foreground"
                  }`}
                >
                  Inicio
                </span>
              </Button>
            </div>

            {/* Botón Reseñar - Posición fija y prominente */}
            <div className="relative h-16 w-24 mx-auto">
              <Button
                variant="ghost"
                onClick={onGoReview}
                className="absolute inset-0 flex flex-col items-center justify-center gap-1 hover:bg-transparent"
              >
                <div className="relative">
                  {/* Círculo de fondo con color sólido - SIN transform para evitar movimiento */}
                  <div
                    className={`p-3 rounded-full transition-all duration-300 ${
                      currentPage === "review"
                        ? "bg-primary text-white shadow-lg shadow-primary/50"
                        : "bg-primary/80 text-white shadow-md shadow-primary/30 hover:shadow-lg hover:shadow-primary/40"
                    }`}
                  >
                    <Star className={`h-6 w-6 ${currentPage === "review" ? "fill-current" : ""}`} />
                  </div>

                  {/* Indicador de pulso cuando está activo */}
                  {currentPage === "review" && (
                    <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping"></div>
                  )}
                </div>

                <span
                  className={`text-xs transition-all duration-300 tracking-tight ${
                    currentPage === "review" ? "text-primary font-bold" : "text-primary font-semibold"
                  }`}
                >
                  Reseñar
                </span>
              </Button>
            </div>

            {/* Botón Perfil - Posición fija */}
            <div className="relative h-16 w-20 mx-auto">
              <Button
                variant="ghost"
                onClick={onGoProfile}
                className="absolute inset-0 flex flex-col items-center justify-center gap-1 hover:bg-transparent"
              >
                <div
                  className={`p-2 rounded-full transition-all duration-200 ${
                    currentPage === "profile"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <User className="h-4 w-4" />
                </div>
                <span
                  className={`text-xs transition-colors duration-200 tracking-tight ${
                    currentPage === "profile" ? "text-primary font-medium" : "text-muted-foreground"
                  }`}
                >
                  Perfil
                </span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
