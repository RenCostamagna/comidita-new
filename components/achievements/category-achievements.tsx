"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AchievementBadge } from "./achievement-badge"
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
  is_unlocked: boolean
  current_progress: number
  progress_percentage: number
  unlocked_at?: string
}

interface CategoryAchievementsProps {
  userId: string
  category: string
  showTitle?: boolean
}

export function CategoryAchievements({ userId, category, showTitle = true }: CategoryAchievementsProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [categoryStats, setCategoryStats] = useState({
    unlocked: 0,
    total: 0,
    percentage: 0,
  })

  const supabase = createClient()

  useEffect(() => {
    fetchCategoryAchievements()
  }, [userId, category])

  const fetchCategoryAchievements = async () => {
    try {
      const { data, error } = await supabase.rpc("get_category_achievements_progress", {
        user_id_param: userId,
        category_param: category,
      })

      if (error) {
        console.error("Error fetching category achievements:", error)
        setAchievements([])
      } else {
        setAchievements(data || [])

        // Calcular estadísticas
        const total = data?.length || 0
        const unlocked = data?.filter((a: Achievement) => a.is_unlocked).length || 0
        const percentage = total > 0 ? Math.round((unlocked / total) * 100) : 0

        setCategoryStats({ unlocked, total, percentage })
      }
    } catch (error) {
      console.error("Error fetching category achievements:", error)
      setAchievements([])
    } finally {
      setIsLoading(false)
    }
  }

  const categoryName = RESTAURANT_CATEGORIES[category as keyof typeof RESTAURANT_CATEGORIES] || category

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Cargando logros...</div>
        </CardContent>
      </Card>
    )
  }

  if (achievements.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">No hay logros disponibles para esta categoría</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      {showTitle && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {achievements[0]?.icon} {categoryName}
              </CardTitle>
              <CardDescription>Progreso en logros de {categoryName.toLowerCase()}</CardDescription>
            </div>
            <div className="text-right">
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {categoryStats.unlocked}/{categoryStats.total}
              </Badge>
              <div className="text-xs text-muted-foreground mt-1">{categoryStats.percentage}% completado</div>
            </div>
          </div>

          {/* Barra de progreso general */}
          <Progress value={categoryStats.percentage} className="h-2 mt-2" />
        </CardHeader>
      )}

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {achievements.map((achievement) => (
            <AchievementBadge
              key={achievement.achievement_id}
              achievement={achievement}
              size="md"
              showProgress={true}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
