"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"
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
  userId?: string
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
  HELADERIAS: {
    color: "bg-gradient-to-br from-pink-400 to-pink-500",
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
      const categories = Object.keys(RESTAURANT_CATEGORIES)
      const allAchievements: Achievement[] = []

      for (const category of categories) {
        if (userId) {
          // User is logged in - get their actual progress
          const { data, error } = await supabase.rpc("get_category_achievements_progress", {
            user_id_param: userId,
            category_param: category,
          })

          if (error) {
            console.error(`Error fetching achievements for ${category}:`, error)
            continue
          }

          if (data) {
            const categoryAchievements = data
              .filter((achievement: any) => !achievement.is_unlocked)
              .map((achievement: any) => ({
                ...achievement,
                category,
              }))

            allAchievements.push(...categoryAchievements)
          }
        } else {
          // User not logged in - get all level 1 achievements with zero progress
          const { data, error } = await supabase
            .from("category_achievements")
            .select("*")
            .eq("category", category)
            .eq("level", 1)
            .single()

          if (error) {
            console.error(`Error fetching level 1 achievement for ${category}:`, error)
            continue
          }

          if (data) {
            // Create achievement object with zero progress
            const achievement: Achievement = {
              achievement_id: data.id,
              name: data.name,
              description: data.description,
              level: data.level,
              required_reviews: data.required_reviews,
              points_reward: data.points_reward,
              icon: data.icon,
              color: data.color,
              category,
              is_unlocked: false,
              current_progress: 0,
              progress_percentage: 0,
            }

            allAchievements.push(achievement)
          }
        }
      }

      // Group by category and select the best candidate from each
      const achievementsByCategory = allAchievements.reduce(
        (acc, achievement) => {
          if (!acc[achievement.category]) {
            acc[achievement.category] = achievement
          } else {
            const current = acc[achievement.category]

            // Prioritize achievements with progress > 0, then by higher progress
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
              // If neither has progress, take the lower level (first to complete)
              acc[achievement.category] = achievement
            }
          }
          return acc
        },
        {} as Record<string, Achievement>,
      )

      // Convert to array and sort: first those with progress (by progress desc), then those without progress (by level asc)
      const uniqueAchievements = Object.values(achievementsByCategory)
        .sort((a, b) => {
          // If both have progress, sort by progress descending
          if (a.current_progress > 0 && b.current_progress > 0) {
            return b.progress_percentage - a.progress_percentage
          }
          // If only one has progress, that one goes first
          if (a.current_progress > 0 && b.current_progress === 0) return -1
          if (a.current_progress === 0 && b.current_progress > 0) return 1
          // If neither has progress, sort by level ascending
          return a.level - b.level
        })
        .slice(0, 6) // Maximum 6 achievements

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

  // Always show achievements, even if empty (though this shouldn't happen now)
  if (incompleteAchievements.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Logros</h2>
          {userId && (
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:text-primary/80"
              onClick={handleViewAllClick}
            >
              Ver todos
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="text-center py-8 text-muted-foreground">No hay logros disponibles</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Logros</h2>
          <p className="text-sm text-muted-foreground">
            {userId ? "Logros que estás cerca de completar" : "Inicia sesión para comenzar a desbloquear logros"}
          </p>
        </div>
        {userId && (
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80" onClick={handleViewAllClick}>
            Ver todos
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Horizontal scrollable cards */}
      <div className="relative">
        <div className="overflow-x-auto pb-4 scrollbar-hide">
          <div className="flex gap-3 w-max pl-0 pr-16">
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
                        <div className="space-y-1">
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

                          {/* Progress percentage - with less bottom spacing */}
                          <div className="text-center pt-0.5">
                            <span className="text-xs font-medium text-white">
                              {userId && achievement.current_progress > 0
                                ? `${Math.round(achievement.progress_percentage)}% completado`
                                : userId
                                  ? "Sin progreso aún"
                                  : "Inicia sesión para comenzar"}
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
        <div className="absolute top-0 right-0 bottom-0 w-4 bg-gradient-to-l from-background/60 via-background/40 to-transparent pointer-events-none"></div>
      </div>
    </div>
  )
}
