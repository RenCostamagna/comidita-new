"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Star, Target } from "lucide-react"
import { CategoryAchievements } from "./category-achievements"
import { createClient } from "@/lib/supabase/client"
import { RESTAURANT_CATEGORIES } from "@/lib/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AchievementStats {
  total_achievements: number
  unlocked_achievements: number
  completion_percentage: number
  total_bonus_points: number
  achievements_by_category: Record<
    string,
    {
      total: number
      unlocked: number
      percentage: number
    }
  >
}

interface RecentAchievement {
  achievement_id: string
  name: string
  description: string
  level: number
  category: string
  points_reward: number
  icon: string
  color: string
  unlocked_at: string
}

interface AchievementsShowcaseProps {
  userId: string
}

export function AchievementsShowcase({ userId }: AchievementsShowcaseProps) {
  const [stats, setStats] = useState<AchievementStats | null>(null)
  const [recentAchievements, setRecentAchievements] = useState<RecentAchievement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>("PARRILLAS")

  const supabase = createClient()

  useEffect(() => {
    fetchAchievementsData()
  }, [userId])

  const fetchAchievementsData = async () => {
    try {
      // Obtener estadísticas generales
      const { data: statsData, error: statsError } = await supabase.rpc("get_achievements_statistics", {
        user_id_param: userId,
      })

      if (statsError) {
        console.error("Error fetching achievement stats:", statsError)
      } else if (statsData && statsData.length > 0) {
        setStats(statsData[0])
      }

      // Obtener logros recientes
      const { data: recentData, error: recentError } = await supabase.rpc("get_user_all_achievements", {
        user_id_param: userId,
      })

      if (recentError) {
        console.error("Error fetching recent achievements:", recentError)
      } else {
        setRecentAchievements((recentData || []).slice(0, 6)) // Últimos 6 logros
      }
    } catch (error) {
      console.error("Error fetching achievements data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-AR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Cargando logros...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas generales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Resumen de Logros
          </CardTitle>
          <CardDescription>Tu progreso en el sistema de logros por categorías</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats?.unlocked_achievements || 0}</div>
              <div className="text-sm text-muted-foreground">Desbloqueados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats?.total_achievements || 0}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats?.completion_percentage || 0}%</div>
              <div className="text-sm text-muted-foreground">Completado</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats?.total_bonus_points?.toLocaleString() || 0}</div>
              <div className="text-sm text-muted-foreground">Pts Bonus</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logros recientes */}
      {recentAchievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Logros Recientes
            </CardTitle>
            <CardDescription>Tus últimos logros desbloqueados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentAchievements.map((achievement) => (
                <div
                  key={achievement.achievement_id}
                  className="p-4 rounded-lg border bg-card"
                  style={{ backgroundColor: `${achievement.color}10` }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-2xl">{achievement.icon}</div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm truncate">{achievement.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          Nivel {achievement.level}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="text-xs"
                          style={{
                            backgroundColor: `${achievement.color}20`,
                            color: achievement.color,
                          }}
                        >
                          +{achievement.points_reward} pts
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{achievement.description}</p>
                  <div className="text-xs text-muted-foreground">{formatDate(achievement.unlocked_at)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Logros por categoría */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Logros por Categoría
          </CardTitle>
          <CardDescription>Explora y desbloquea logros en cada tipo de restaurante</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Dropdown selector */}
            <div className="w-full">
              <Select defaultValue="PARRILLAS" onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(RESTAURANT_CATEGORIES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Achievement content */}
            <CategoryAchievements userId={userId} category={selectedCategory} showTitle={false} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
