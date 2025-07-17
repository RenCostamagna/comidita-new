"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Sparkles } from "lucide-react"

interface NewAchievement {
  id: string
  name: string
  description: string
  level: number
  category: string
  points_reward: number
  icon: string
  color: string
}

interface AchievementToastProps {
  achievements: NewAchievement[]
  onClose?: () => void
}

export function AchievementToast({ achievements, onClose }: AchievementToastProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (achievements.length === 0) return

    const timer = setTimeout(() => {
      if (currentIndex < achievements.length - 1) {
        setCurrentIndex(currentIndex + 1)
      } else {
        setIsVisible(false)
        onClose?.()
      }
    }, 4000) // 4 segundos por logro

    return () => clearTimeout(timer)
  }, [currentIndex, achievements.length, onClose])

  if (!isVisible || achievements.length === 0) return null

  const achievement = achievements[currentIndex]

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2">
      <Card
        className="border-2 shadow-xl w-80 overflow-hidden"
        style={{
          borderColor: achievement.color,
          backgroundColor: `${achievement.color}05`,
        }}
      >
        {/* Decorative header */}
        <div className="h-2 w-full" style={{ backgroundColor: achievement.color }} />

        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Header with animation */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="text-3xl animate-bounce">{achievement.icon}</div>
                <div className="absolute -top-1 -right-1">
                  <Sparkles className="h-4 w-4 text-yellow-500 animate-pulse" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Trophy className="h-4 w-4 text-yellow-600" />
                  <span className="font-bold text-lg text-primary">¡Logro Desbloqueado!</span>
                </div>
                <h3 className="font-semibold text-base leading-tight">{achievement.name}</h3>
              </div>
            </div>

            {/* Achievement details */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground leading-relaxed">{achievement.description}</p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    style={{
                      backgroundColor: `${achievement.color}20`,
                      color: achievement.color,
                    }}
                  >
                    Nivel {achievement.level}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200"
                  >
                    +{achievement.points_reward} pts
                  </Badge>
                </div>
              </div>
            </div>

            {/* Progress indicator for multiple achievements */}
            {achievements.length > 1 && (
              <div className="flex items-center justify-center gap-1 pt-2">
                {achievements.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentIndex
                        ? "bg-primary scale-125"
                        : index < currentIndex
                          ? "bg-primary/60"
                          : "bg-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Celebration message */}
            <div className="text-center pt-2 border-t border-muted">
              <p className="text-xs text-muted-foreground">🎉 ¡Sigue reseñando para desbloquear más logros!</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
