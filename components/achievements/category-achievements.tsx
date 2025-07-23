"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Trophy, Star, Target } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { RESTAURANT_CATEGORIES } from "@/lib/types"

interface CategoryAchievement {
  achievement_id: string
  name: string
  description: string
  level: number
  required_reviews: number
  points_reward: number
  icon: string
  color: string
  is_unlocked: boolean
  current_progress: number
  progress_percentage: number
  unlocked_at?: string
}

interface CategoryAchievementsProps {
  userId?: string
  category: string
  onAchievementSelect?: (achievement: CategoryAchievement) => void
}

export function CategoryAchievements({ userId, category, onAchievementSelect }: CategoryAchievementsProps) {
  const [achievements, setAchievements] = useState<CategoryAchievement[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    if (userId && category) {
      loadCategoryAchievements()
    } else {
      setIsLoading(false)
    }
  }, [userId, category])

  const loadCategoryAchievements = async () => {
    if (!userId || !category) return

    try {
      const { data, error } = await supabase.rpc("get_category_achievements_progress", {
        user_id_param: userId,
        category_param: category,
      })

      if (error) {
        console.error("Error fetching category achievements:", error)
      } else {
        setAchievements(data || [])
      }
    } catch (error) {
      console.error("Error loading category achievements:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const categoryName = RESTAURANT_CATEGORIES[category as keyof typeof RESTAURANT_CATEGORIES] || category

  if (!userId) {
    return null
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Logros de {categoryName}</CardTitle>
          </div>
          <CardDescription>Cargando logros de categoría...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="p-4 animate-pulse">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 bg-muted rounded" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-32 bg-muted rounded" />
                        <div className="h-5 w-16 bg-muted rounded-full" />
                      </div>
                      <div className="h-3 w-full bg-muted rounded" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <div className="h-3 w-24 bg-muted rounded" />
                      <div className="h-3 w-16 bg-muted rounded" />
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          <CardTitle className="text-lg">Logros de {categoryName}</CardTitle>
        </div>
        <CardDescription>
          {achievements.length > 0
            ? `${achievements.filter((a) => a.is_unlocked).length} de ${achievements.length} logros desbloqueados`
            : "No hay logros disponibles para esta categoría"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {achievements.length > 0 ? (
          <div className="space-y-4">
            {achievements.map((achievement) => (
              <Card
                key={achievement.achievement_id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                  achievement.is_unlocked ? "border-green-200 bg-green-50/50" : "border-gray-200"
                }`}
                onClick={() => onAchievementSelect?.(achievement)}
              >
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${achievement.is_unlocked ? "bg-green-100" : "bg-gray-100"}`}>
                        <span className="text-lg">{achievement.icon}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-sm">{achievement.name}</h3>
                          <Badge variant={achievement.is_unlocked ? "default" : "secondary"} className="text-xs">
                            Nivel {achievement.level}
                          </Badge>
                          {achievement.is_unlocked && (
                            <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                              <Trophy className="h-3 w-3 mr-1" />
                              Desbloqueado
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{achievement.description}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            {achievement.required_reviews} reseñas
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3" />+{achievement.points_reward} puntos
                          </div>
                        </div>
                      </div>
                    </div>

                    {!achievement.is_unlocked && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">
                            Progreso: {achievement.current_progress}/{achievement.required_reviews}
                          </span>
                          <span className="font-medium">{Math.round(achievement.progress_percentage)}%</span>
                        </div>
                        <Progress value={achievement.progress_percentage} className="h-2" />
                      </div>
                    )}

                    {achievement.is_unlocked && achievement.unlocked_at && (
                      <div className="text-xs text-green-600">
                        Desbloqueado el {new Date(achievement.unlocked_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">No hay logros disponibles para esta categoría</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
