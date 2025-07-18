"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { RESTAURANT_CATEGORIES } from "@/lib/types"

interface CategoriesSectionProps {
  onCategorySelect?: (category: string) => void
  onViewAllCategories?: () => void
}

// Mapeo de categorías a colores (sin iconos)
const CATEGORY_CONFIG = {
  PARRILLAS: {
    color: "bg-[#FEC80C]",
  },
  CAFE_Y_DELI: {
    color: "bg-[#FE1B08]",
  },
  BODEGONES: {
    color: "bg-[#0D83FE]",
  },
  RESTAURANTES: {
    color: "bg-[#FEEFCE]",
  },
  HAMBURGUESERIAS: {
    color: "bg-[#151515]",
  },
  PIZZERIAS: {
    color: "bg-[#FFD84D]",
  },
  PASTAS: {
    color: "bg-[#FF5A36]",
  },
  CARRITOS: {
    color: "bg-[#559DFF]",
  },
  BARES: {
    color: "bg-[#FFF5E1]",
  },
  HELADERIAS: {
    color: "bg-[#2A2A2A]",
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

      {/* Grid scrollable with 2 rows */}
      <div className="relative">
        <div className="overflow-x-auto pb-4 scrollbar-hide">
          <div className="grid grid-rows-2 grid-flow-col gap-3 w-max pl-0 pr-16" style={{ gridAutoColumns: "10rem" }}>
            {Object.entries(RESTAURANT_CATEGORIES).map(([key, label], index) => {
              const config = CATEGORY_CONFIG[key as keyof typeof CATEGORY_CONFIG]

              return (
                <Card
                  key={key}
                  className={`relative overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 h-20 border-0 flex-shrink-0 ${config?.color || "bg-gray-500"}`}
                  onClick={() => handleCategoryClick(key)}
                >
                  <CardContent className="px-3 py-2 h-full flex items-center justify-center text-white relative">
                    {/* Background pattern/texture */}
                    <div className="absolute inset-0 bg-black/10"></div>

                    {/* Content - Only category name, centered */}
                    <div className="relative z-10 text-center">
                      <h3 className="font-semibold text-sm text-white leading-tight">{label}</h3>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Gradient overlay to indicate more content */}
        <div className="absolute top-0 right-0 bottom-0 w-4 bg-gradient-to-l from-background/60 via-background/40 to-transparent pointer-events-none"></div>
      </div>
    </div>
  )
}
