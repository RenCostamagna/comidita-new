"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronRight, Trophy } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { RESTAURANT_CATEGORIES } from "@/lib/types"

interface Achievement {
  achievement_id: string
  name: string
  description: string
  level: number
  required_reviews: number
  points_reward: number
  icon: string
  color: string
  category: string
  is_unlocked: boolean
  current_progress: number
  progress_percentage: number
}

interface AchievementsProgressProps {
  userId: string
  onViewAllAchievements?: () => void
  onAchievementSelect?: (achievement: Achievement) => void
}

// Mapeo de categorías a colores (mismo que categories-section)
const CATEGORY_CONFIG = {
  PARRILLAS: {
    color: "bg-gradient-to-br from-red-500 to-red-600",
  },
  CAFE_Y_DELI: {
    color: "bg-gradient-to-br from-yellow-400 to-yellow-500",
  },
  BODEGONES: {
    color: "bg-gradient-to-br from-blue-500 to-blue-600",
  },
  RESTAURANTES: {
    color: "bg-gradient-to-br from-gray-700 to-gray-800",
  },
  HAMBURGUESERIAS: {
    color: "bg-gradient-to-br from-red-600 to-red-700",
  },
  PIZZERIAS: {
    color: "bg-gradient-to-br from-green-500 to-green-600",
  },
  PASTAS: {
    color: "bg-gradient-to-br from-orange-500 to-orange-600",
  },
  CARRITOS: {
    color: "bg-gradient-to-br from-purple-500 to-purple-600",
  },
  BARES: {
    color: "bg-gradient-to-br from-indigo-500 to-indigo-600",
  },
}

export function AchievementsProgress({
  userId,
  onViewAllAchievements,
  onAchievementSelect,
}: AchievementsProgressProps) {
  const [incompleteAchievements, setIncompleteAchievements] = useState<Achievement[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    fetchIncompleteAchievements()
  }, [userId])

  const fetchIncompleteAchievements = async () => {
    try {
      // Obtener todos los logros de todas las categorías
      const categories = Object.keys(RESTAURANT_CATEGORIES)
      const allAchievements: Achievement[] = []

      for (const category of categories) {
        const { data, error } = await supabase.rpc("get_category_achievements_progress", {
          user_id_param: userId,
          category_param: category,
        })

        if (error) {
          console.error(`Error fetching achievements for ${category}:`, error)
          continue
        }

        if (data) {
          // Agregar categoría a cada logro y filtrar solo los no desbloqueados
          const categoryAchievements = data
            .filter((achievement: any) => !achievement.is_unlocked)
            .map((achievement: any) => ({
              ...achievement,
              category,
            }))

          allAchievements.push(...categoryAchievements)
        }
      }

      // Agrupar por categoría y seleccionar el mejor candidato de cada una
      const achievementsByCategory = allAchievements.reduce(
        (acc, achievement) => {
          if (!acc[achievement.category]) {
            acc[achievement.category] = achievement
          } else {
            const current = acc[achievement.category]

            // Priorizar logros con progreso > 0, luego por mayor progreso
            if (achievement.current_progress > 0 && current.current_progress === 0) {
              acc[achievement.category] = achievement
            } else if (
              achievement.current_progress > 0 &&
              current.current_progress > 0 &&
              achievement.progress_percentage > current.progress_percentage
            ) {
              acc[achievement.category] = achievement
            } else if (
              achievement.current_progress === 0 &&
              current.current_progress === 0 &&
              achievement.level < current.level
            ) {
              // Si ninguno tiene progreso, tomar el de menor nivel (primero a completar)
              acc[achievement.category] = achievement
            }
          }
          return acc
        },
        {} as Record<string, Achievement>,
      )

      // Convertir a array y ordenar: primero los que tienen progreso (por progreso desc), luego los que no tienen progreso (por nivel asc)
      const uniqueAchievements = Object.values(achievementsByCategory)
        .sort((a, b) => {
          // Si ambos tienen progreso, ordenar por progreso descendente
          if (a.current_progress > 0 && b.current_progress > 0) {
            return b.progress_percentage - a.progress_percentage
          }
          // Si solo uno tiene progreso, ese va primero
          if (a.current_progress > 0 && b.current_progress === 0) return -1
          if (a.current_progress === 0 && b.current_progress > 0) return 1
          // Si ninguno tiene progreso, ordenar por nivel ascendente
          return a.level - b.level
        })
        .slice(0, 6) // Máximo 6 logros

      setIncompleteAchievements(uniqueAchievements)
    } catch (error) {
      console.error("Error fetching incomplete achievements:", error)
      setIncompleteAchievements([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleAchievementClick = (achievement: Achievement) => {
    if (onAchievementSelect) {
      onAchievementSelect(achievement)
    }
  }

  const handleViewAllClick = () => {
    if (onViewAllAchievements) {
      onViewAllAchievements()
    }
  }

  const getCategoryConfig = (category: string) => {
    return CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG] || CATEGORY_CONFIG.RESTAURANTES
  }

  const getCategoryName = (category: string) => {
    return RESTAURANT_CATEGORIES[category as keyof typeof RESTAURANT_CATEGORIES] || category
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Logros</h2>
        </div>
        <div className="text-center py-8 text-muted-foreground">Cargando logros...</div>
      </div>
    )
  }

  if (incompleteAchievements.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Logros</h2>
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80" onClick={handleViewAllClick}>
            Ver todos
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">¡Haz tu primera reseña para comenzar a desbloquear logros!</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Logros</h2>
          <p className="text-sm text-muted-foreground">Logros que estás cerca de completar</p>
        </div>
        <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80" onClick={handleViewAllClick}>
          Ver todos
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>

      {/* Horizontal scrollable cards */}
      <div className="relative">
        <div className="overflow-x-auto pb-4 scrollbar-hide">
          <div className="flex gap-3 w-max pl-4 pr-20">
            {incompleteAchievements.map((achievement) => {
              const config = getCategoryConfig(achievement.category)
              const categoryName = getCategoryName(achievement.category)

              return (
                <Card
                  key={achievement.achievement_id}
                  className={`relative overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 w-48 h-48 border-0 flex-shrink-0 ${config.color}`}
                  onClick={() => handleAchievementClick(achievement)}
                >
                  <CardContent className="p-4 h-full flex flex-col justify-between text-white relative">
                    {/* Background pattern/texture */}
                    <div className="absolute inset-0 bg-black/10"></div>

                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-full -translate-y-8 translate-x-8"></div>
                    <div className="absolute bottom-0 left-0 w-12 h-12 bg-white/5 rounded-full translate-y-6 -translate-x-6"></div>

                    {/* Content */}
                    <div className="relative z-10 h-full flex flex-col">
                      {/* Top row with icon and level */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                          <span className="text-lg">{achievement.icon}</span>
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm text-white border-white/30 text-xs px-2 py-1 rounded-full font-medium">
                          Nivel {achievement.level}
                        </div>
                      </div>

                      {/* Achievement info */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div className="mb-4">
                          <h3 className="font-semibold text-sm text-white leading-tight mb-1">{achievement.name}</h3>
                          <p className="text-xs text-white/80 leading-tight">{categoryName}</p>
                        </div>

                        {/* Progress section */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-white/90">
                              {achievement.current_progress}/{achievement.required_reviews} reseñas
                            </span>
                            <span className="font-semibold text-white">+{achievement.points_reward} pts</span>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full bg-white/20 rounded-full h-2 backdrop-blur-sm">
                            <div
                              className="bg-white h-2 rounded-full transition-all duration-500 ease-out shadow-sm"
                              style={{ width: `${achievement.progress_percentage}%` }}
                            />
                          </div>

                          {/* Progress percentage - with more spacing */}
                          <div className="text-center pt-2">
                            <span className="text-xs font-medium text-white">
                              {achievement.current_progress > 0
                                ? `${Math.round(achievement.progress_percentage)}% completado`
                                : "Sin progreso aún"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Hover effect indicator */}
                    <div className="absolute inset-0 bg-white/0 hover:bg-white/10 transition-all duration-300 rounded-lg"></div>
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
