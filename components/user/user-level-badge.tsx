"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"

interface UserLevel {
  level_name: string
  level_color: string
  level_icon: string
  min_points: number
  max_points: number | null
  progress_percentage: number
}

interface UserLevelBadgeProps {
  userId: string
  userPoints?: number
  showProgress?: boolean
  size?: "sm" | "md" | "lg"
}

export function UserLevelBadge({ userId, userPoints, showProgress = false, size = "md" }: UserLevelBadgeProps) {
  const [userLevel, setUserLevel] = useState<UserLevel | null>(null)
  const [points, setPoints] = useState(userPoints || 0)
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    fetchUserLevel()
  }, [userId, userPoints])

  const fetchUserLevel = async () => {
    try {
      // Si no tenemos los puntos, obtenerlos primero
      let currentPoints = userPoints
      if (!currentPoints) {
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("points")
          .eq("id", userId)
          .single()

        if (userError) {
          console.error("Error fetching user points:", userError)
          return
        }
        currentPoints = userData?.points || 0
      }

      setPoints(currentPoints)

      // Obtener el nivel del usuario
      const { data, error } = await supabase.rpc("get_user_level", {
        user_points: currentPoints,
      })

      if (error) {
        console.error("Error fetching user level:", error)
        return
      }

      if (data && data.length > 0) {
        setUserLevel(data[0])
      }
    } catch (error) {
      console.error("Error fetching user level:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Badge variant="secondary" className="animate-pulse">
        Cargando...
      </Badge>
    )
  }

  if (!userLevel) {
    return <Badge variant="secondary">🥚 Nuevo</Badge>
  }

  const badgeSize = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-2",
  }

  const badge = (
    <Badge
      variant="secondary"
      className={`${badgeSize[size]} font-medium`}
      style={{ backgroundColor: `${userLevel.level_color}20`, color: userLevel.level_color }}
    >
      {userLevel.level_icon} {userLevel.level_name}
    </Badge>
  )

  if (!showProgress) {
    return badge
  }

  return (
    <Card className="w-full">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          {badge}
          <span className="text-sm font-medium">{points.toLocaleString()} pts</span>
        </div>

        {userLevel.max_points && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{userLevel.min_points.toLocaleString()} pts</span>
              <span>{userLevel.max_points.toLocaleString()} pts</span>
            </div>
            <Progress value={userLevel.progress_percentage} className="h-2" />
            <div className="text-center text-xs text-muted-foreground">
              {userLevel.progress_percentage}% hacia el siguiente nivel
            </div>
          </div>
        )}

        {!userLevel.max_points && (
          <div className="text-center text-xs text-muted-foreground">¡Nivel máximo alcanzado! 🎉</div>
        )}
      </CardContent>
    </Card>
  )
}
