"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface PointsEarnedToastProps {
  points: number
  isFirstReview?: boolean
  onClose?: () => void
}

export function PointsEarnedToast({ points, isFirstReview = false, onClose }: PointsEarnedToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      onClose?.()
    }, 4000)

    return () => clearTimeout(timer)
  }, [onClose])

  if (!isVisible) return null

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2">
      <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🎉</div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-green-800 dark:text-green-200">+{points} puntos ganados!</span>
                {isFirstReview && (
                  <Badge
                    variant="secondary"
                    className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                  >
                    🏆 Primera reseña
                  </Badge>
                )}
              </div>
              <p className="text-sm text-green-600 dark:text-green-300">
                {isFirstReview ? "¡Bonus por ser el primero en reseñar este lugar!" : "¡Gracias por tu reseña!"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
