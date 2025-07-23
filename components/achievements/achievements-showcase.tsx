"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trophy, ChevronRight } from "lucide-react"
import { AchievementBadge } from "./achievement-badge"
import { createClient } from "@/lib/supabase/client"

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

interface AchievementsShowcaseProps {
  userId?: string
  onViewAllAchievements?: () => void
  onAchievementSelect?: (achievement: Achievement) => void
}

export function AchievementsShowcase({
  userId,
  onViewAllAchievements,
  onAchievementSelect,
}: AchievementsShowcaseProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    if (userId) {
      loadAchievements()
    } else {
      setIsLoading(false)
    }
  }, [userId])

  const loadAchievements = async () => {
    if (!userId) return

    try {
      // Get recent achievements (last 6 unlocked)
      const { data: recentData, error: recentError } = await supabase.rpc("get_user_all_achievements", {
        user_id_param: userId,
      })

      if (recentError) {
        console.error("Error fetching recent achievements:", recentError)
      } else {
        const recentAchievements = (recentData || [])
          .filter((achievement: Achievement) => achievement.is_unlocked)
          .slice(0, 6)

        setAchievements(recentAchievements)
      }
    } catch (error) {
      console.error("Error loading achievements:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Don't render anything if no user
  if (!userId) {
    return null
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Logros</CardTitle>
          </div>
          <CardDescription>Cargando logros...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-4 animate-pulse">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 bg-muted rounded" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-24 bg-muted rounded" />
                        <div className="h-5 w-16 bg-muted rounded-full" />
                      </div>
                      <div className="h-3 w-full bg-muted rounded" />
                      <div className="h-3 w-3/4 bg-muted rounded" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <div className="h-3 w-20 bg-muted rounded" />
                      <div className="h-3 w-12 bg-muted rounded" />
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            <CardTitle className="text-lg">Logros</CardTitle>
          </div>
          {onViewAllAchievements && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onViewAllAchievements}
              className="text-primary hover:text-primary/80"
            >
              Ver todos
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
        <CardDescription>
          {achievements.length > 0 ? "Tus logros más recientes" : "Completa reseñas para desbloquear logros"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {achievements.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => (
              <AchievementBadge
                key={achievement.achievement_id}
                achievement={achievement}
                size="sm"
                showProgress={false}
                onClick={() => onAchievementSelect?.(achievement)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">¡Escribe tu primera reseña para comenzar a desbloquear logros!</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
