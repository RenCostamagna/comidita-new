"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronRight, Utensils, Coffee, Home, Crown, Beef, Pizza, ChefHat, Truck, Wine } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { RESTAURANT_CATEGORIES } from "@/lib/types"

interface CategoriesSectionProps {
  onCategorySelect?: (category: string) => void
  onViewAllCategories?: () => void
}

// Mapeo de categorías a iconos y colores
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

export function CategoriesSection({ onCategorySelect, onViewAllCategories }: CategoriesSectionProps) {
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
    if (onCategorySelect) {
      onCategorySelect(categoryKey)
    }
  }

  const handleViewAllClick = () => {
    if (onViewAllCategories) {
      onViewAllCategories()
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Categorías</h2>
        </div>
        <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80" onClick={handleViewAllClick}>
          Ver todas
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>

      {/* Horizontal scrollable cards */}
      <div className="relative">
        <div className="overflow-x-auto pb-4 scrollbar-hide">
          <div className="flex gap-3 w-max pl-4 pr-20">
            {Object.entries(RESTAURANT_CATEGORIES).map(([key, label]) => {
              const config = CATEGORY_CONFIG[key as keyof typeof CATEGORY_CONFIG]
              const count = categoryCounts[key] || 0
              const IconComponent = config?.icon || Utensils

              return (
                <Card
                  key={key}
                  className={`relative overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 w-36 h-36 border-0 flex-shrink-0 ${config?.color || "bg-gradient-to-br from-gray-500 to-gray-600"}`}
                  onClick={() => handleCategoryClick(key)}
                >
                  <CardContent className="px-2 py-3 h-full flex flex-col justify-between text-white relative">
                    {/* Background pattern/texture */}
                    <div className="absolute inset-0 bg-black/10"></div>

                    {/* Content */}
                    <div className="relative z-10">
                      {/* Top row with icon and count */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                          <IconComponent className="h-5 w-5 text-white" />
                        </div>
                        <Badge
                          variant="secondary"
                          className="bg-white/20 backdrop-blur-sm text-white border-white/30 text-xs px-1.5 py-0.5"
                        >
                          {isLoading ? "..." : count}
                        </Badge>
                      </div>

                      {/* Category title */}
                      <div>
                        <h3 className="font-semibold text-sm text-white leading-tight">{label}</h3>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Gradient overlay to indicate more content */}
        <div className="absolute top-0 right-0 bottom-4 w-16 bg-gradient-to-l from-background via-background/80 to-transparent pointer-events-none"></div>
      </div>
    </div>
  )
}
