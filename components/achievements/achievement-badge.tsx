"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

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

interface AchievementBadgeProps {
  achievement: Achievement
  size?: "sm" | "md" | "lg"
  showProgress?: boolean
  onClick?: () => void
}

export function AchievementBadge({ achievement, size = "md", showProgress = true, onClick }: AchievementBadgeProps) {
  const sizeClasses = {
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
  }

  const iconSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
  }

  const titleSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  }

  return (
    <Card
      className={`relative overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-lg ${
        achievement.is_unlocked ? "border-2 shadow-md" : "border-dashed opacity-75 hover:opacity-90"
      }`}
      style={{
        borderColor: achievement.is_unlocked ? achievement.color : "#d1d5db",
        backgroundColor: achievement.is_unlocked ? `${achievement.color}10` : "#f9fafb",
      }}
      onClick={onClick}
    >
      {/* Decorative background */}
      {achievement.is_unlocked && (
        <div
          className="absolute top-0 right-0 w-16 h-16 opacity-10 -translate-y-4 translate-x-4"
          style={{ backgroundColor: achievement.color }}
        />
      )}

      <CardContent className={sizeClasses[size]}>
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className={`${iconSizes[size]} flex-shrink-0`}>
              {achievement.is_unlocked ? achievement.icon : "🔒"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className={`font-semibold ${titleSizes[size]} truncate`}>{achievement.name}</h3>
                <Badge
                  variant="secondary"
                  className="text-xs"
                  style={{
                    backgroundColor: `${achievement.color}20`,
                    color: achievement.color,
                  }}
                >
                  Nivel {achievement.level}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-tight">{achievement.description}</p>
            </div>
          </div>

          {/* Progress */}
          {showProgress && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">
                  {achievement.current_progress}/{achievement.required_reviews} reseñas
                </span>
                <span className="font-medium" style={{ color: achievement.color }}>
                  +{achievement.points_reward} pts
                </span>
              </div>

              <Progress value={achievement.progress_percentage} className="h-2" />

              {achievement.is_unlocked && achievement.unlocked_at && (
                <div className="text-xs text-muted-foreground text-center">
                  ✨ Desbloqueado el {new Date(achievement.unlocked_at).toLocaleDateString("es-AR")}
                </div>
              )}
            </div>
          )}

          {/* Unlock status */}
          {!achievement.is_unlocked && (
            <div className="text-center">
              <div className="text-xs text-muted-foreground">
                {achievement.required_reviews - achievement.current_progress} reseñas más para desbloquear
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
