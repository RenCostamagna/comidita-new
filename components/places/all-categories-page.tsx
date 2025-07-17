"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Utensils, Coffee, Home, Crown, Beef, Pizza, ChefHat, Truck, Wine, ChevronRight } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { RESTAURANT_CATEGORIES } from "@/lib/types"
import { Header } from "@/components/layout/header"
import { BottomNavigation } from "@/components/layout/bottom-navigation"

interface AllCategoriesPageProps {
  onBack: () => void
  onCategorySelect: (category: string) => void
  currentUser: any
  onGoHome?: () => void
  onGoReview?: () => void
  onGoProfile?: () => void
  onNotificationClick?: (notification: any) => void // Nueva prop
}

// Mapeo de categorías a iconos y colores (mismo que en categories-section)
const CATEGORY_CONFIG = {
  PARRILLAS: {
    icon: Beef,
    color: "bg-gradient-to-br from-red-500 to-red-600",
  },
  CAFE_Y_DELI: {
    icon: Coffee,
    color: "bg-gradient-to-br from-yellow-400 to-yellow-500",
  },
  BODEGONES: {
    icon: Home,
    color: "bg-gradient-to-br from-blue-500 to-blue-600",
  },
  RESTAURANTES: {
    icon: Crown,
    color: "bg-gradient-to-br from-gray-700 to-gray-800",
  },
  HAMBURGUESERIAS: {
    icon: ChefHat,
    color: "bg-gradient-to-br from-red-600 to-red-700",
  },
  PIZZERIAS: {
    icon: Pizza,
    color: "bg-gradient-to-br from-green-500 to-green-600",
  },
  PASTAS: {
    icon: Utensils,
    color: "bg-gradient-to-br from-orange-500 to-orange-600",
  },
  CARRITOS: {
    icon: Truck,
    color: "bg-gradient-to-br from-purple-500 to-purple-600",
  },
  BARES: {
    icon: Wine,
    color: "bg-gradient-to-br from-indigo-500 to-indigo-600",
  },
}

export function AllCategoriesPage({
  onBack,
  onCategorySelect,
  currentUser,
  onGoHome,
  onGoReview,
  onGoProfile,
  onNotificationClick, // Nueva prop
}: AllCategoriesPageProps) {
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    fetchCategoryCounts()
  }, [])

  const fetchCategoryCounts = async () => {
    try {
      // Obtener conteo de lugares por categoría
      const { data, error } = await supabase.from("places").select("category").not("category", "is", null)

      if (error) {
        console.error("Error fetching category counts:", error)
        setCategoryCounts({})
      } else {
        // Contar lugares por categoría
        const counts: Record<string, number> = {}
        data?.forEach((place) => {
          if (place.category) {
            counts[place.category] = (counts[place.category] || 0) + 1
          }
        })
        setCategoryCounts(counts)
      }
    } catch (error) {
      console.error("Error fetching category counts:", error)
      setCategoryCounts({})
    } finally {
      setIsLoading(false)
    }
  }

  const handleCategoryClick = (categoryKey: string) => {
    onCategorySelect(categoryKey)
  }

  // Nueva función para manejar selección desde el header
  const handleHeaderPlaceSelect = async (selectedPlace: any) => {
    // Navegar a las reseñas del lugar seleccionado
    if (onGoHome) {
      onGoHome() // Esto debería manejar la navegación en el componente padre
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        showBackButton={true}
        onBack={onBack}
        user={currentUser}
        onPlaceSelect={handleHeaderPlaceSelect}
        onNotificationClick={onNotificationClick} // Pasar la prop
      />

      <main className="container mx-auto px-4 py-6 pt-20 max-w-4xl pb-24">
        {/* Grid de categorías */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Cargando categorías...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(RESTAURANT_CATEGORIES).map(([key, label]) => {
              const config = CATEGORY_CONFIG[key as keyof typeof CATEGORY_CONFIG]
              const count = categoryCounts[key] || 0
              const IconComponent = config?.icon || Utensils

              return (
                <Card
                  key={key}
                  className={`relative overflow-hidden cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300 h-48 border-0 ${config?.color || "bg-gradient-to-br from-gray-500 to-gray-600"}`}
                  onClick={() => handleCategoryClick(key)}
                >
                  <CardContent className="p-6 h-full flex flex-col justify-between text-white relative">
                    {/* Background pattern/texture */}
                    <div className="absolute inset-0 bg-black/10"></div>

                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -translate-y-10 translate-x-10"></div>
                    <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-8 -translate-x-8"></div>

                    {/* Content */}
                    <div className="relative z-10">
                      {/* Top row with icon */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                          <IconComponent className="h-8 w-8 text-white" />
                        </div>
                        <Badge
                          variant="secondary"
                          className="bg-white/20 backdrop-blur-sm text-white border-white/30 text-sm font-semibold"
                        >
                          {count} {count === 1 ? "lugar" : "lugares"}
                        </Badge>
                      </div>

                      {/* Category info */}
                      <div className="space-y-2">
                        <h3 className="font-bold text-xl text-white leading-tight">{label}</h3>
                        <p className="text-white/80 text-sm">
                          {count > 0
                            ? `Descubre ${count} ${count === 1 ? "lugar" : "lugares"} ${count === 1 ? "reseñado" : "reseñados"}`
                            : "Sé el primero en reseñar"}
                        </p>
                      </div>
                    </div>

                    {/* Hover effect indicator */}
                    <div className="absolute inset-0 bg-white/0 hover:bg-white/10 transition-all duration-300 rounded-lg"></div>

                    {/* Arrow indicator */}
                    <div className="absolute bottom-4 right-4 opacity-60">
                      <ChevronRight className="h-5 w-5 text-white" />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation
        currentPage="home"
        onGoHome={onGoHome || (() => {})}
        onGoReview={onGoReview || (() => {})}
        onGoProfile={onGoProfile || (() => {})}
      />
    </div>
  )
}
