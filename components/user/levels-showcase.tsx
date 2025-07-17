"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { createClient } from "@/lib/supabase/client"

interface UserLevel {
  level_number: number
  level_name: string
  level_color: string
  level_icon: string
  min_points: number
  max_points: number | null
  points_range: string
}

interface LevelStatistic {
  level_name: string
  level_icon: string
  user_count: number
  percentage: number
}

interface LevelsShowcaseProps {
  currentUserPoints?: number
  showStatistics?: boolean
}

export function LevelsShowcase({ currentUserPoints = 0, showStatistics = false }: LevelsShowcaseProps) {
  const [levels, setLevels] = useState<UserLevel[]>([])
  const [statistics, setStatistics] = useState<LevelStatistic[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    fetchLevelsData()
  }, [])

  const fetchLevelsData = async () => {
    try {
      // Obtener todos los niveles
      const { data: levelsData, error: levelsError } = await supabase.rpc("get_all_user_levels")

      if (levelsError) {
        console.error("Error fetching levels:", levelsError)
      } else {
        setLevels(levelsData || [])
      }

      // Obtener estadísticas si se solicitan
      if (showStatistics) {
        const { data: statsData, error: statsError } = await supabase.rpc("get_level_statistics")

        if (statsError) {
          console.error("Error fetching level statistics:", statsError)
        } else {
          setStatistics(statsData || [])
        }
      }
    } catch (error) {
      console.error("Error fetching levels data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const isCurrentLevel = (level: UserLevel) => {
    return currentUserPoints >= level.min_points && (level.max_points === null || currentUserPoints <= level.max_points)
  }

  const isUnlocked = (level: UserLevel) => {
    return currentUserPoints >= level.min_points
  }

  const getStatistic = (levelName: string) => {
    return statistics.find((stat) => stat.level_name === levelName)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Niveles de Usuario</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="text-muted-foreground">Cargando niveles...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">🏆 Niveles de Usuario</CardTitle>
        <CardDescription>Progresa a través de los niveles gastronómicos ganando puntos por tus reseñas</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {levels.map((level) => {
            const isCurrent = isCurrentLevel(level)
            const unlocked = isUnlocked(level)
            const stat = getStatistic(level.level_name)

            return (
              <div
                key={level.level_number}
                className={`p-4 rounded-lg border transition-all duration-200 ${
                  isCurrent
                    ? "border-primary bg-primary/5 shadow-md"
                    : unlocked
                      ? "border-green-200 bg-green-50 dark:bg-green-950/20"
                      : "border-muted bg-muted/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{level.level_icon}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{level.level_name}</span>
                        {isCurrent && (
                          <Badge variant="default" className="text-xs">
                            Actual
                          </Badge>
                        )}
                        {unlocked && !isCurrent && (
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                            Desbloqueado
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">{level.points_range}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-bold">Nivel {level.level_number}</div>
                    {showStatistics && stat && (
                      <div className="text-xs text-muted-foreground">
                        {stat.user_count} usuarios ({stat.percentage}%)
                      </div>
                    )}
                  </div>
                </div>

                {/* Barra de progreso para el nivel actual */}
                {isCurrent && level.max_points && (
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{level.min_points.toLocaleString()} pts</span>
                      <span>{currentUserPoints.toLocaleString()} pts</span>
                      <span>{level.max_points.toLocaleString()} pts</span>
                    </div>
                    <Progress
                      value={((currentUserPoints - level.min_points) / (level.max_points - level.min_points)) * 100}
                      className="h-2"
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {showStatistics && (
          <div className="mt-6 pt-4 border-t">
            <h4 className="font-medium mb-2">Distribución de Usuarios</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {statistics.map((stat) => (
                <div key={stat.level_name} className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    {stat.level_icon} {stat.level_name}
                  </span>
                  <span className="font-medium">{stat.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
