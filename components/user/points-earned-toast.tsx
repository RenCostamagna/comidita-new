"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, Camera, FileText, MapPin } from "lucide-react"

interface PointsBreakdown {
  base_points: number
  first_review_bonus: number
  photo_bonus: number
  extended_review_bonus: number
  total_points: number
  is_first_review: boolean
  has_photos: boolean
  is_extended_review: boolean
}

interface PointsEarnedToastProps {
  pointsBreakdown: PointsBreakdown
  onClose?: () => void
}

export function PointsEarnedToast({ pointsBreakdown, onClose }: PointsEarnedToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      onClose?.()
    }, 6000) // Más tiempo para leer el desglose

    return () => clearTimeout(timer)
  }, [onClose])

  if (!isVisible) return null

  const {
    base_points,
    first_review_bonus,
    photo_bonus,
    extended_review_bonus,
    total_points,
    is_first_review,
    has_photos,
    is_extended_review,
  } = pointsBreakdown

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2">
      <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800 w-80">
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="text-2xl">🎉</div>
              <div>
                <div className="font-bold text-green-800 dark:text-green-200 text-lg">
                  +{total_points} puntos ganados!
                </div>
                <p className="text-sm text-green-600 dark:text-green-300">¡Gracias por tu reseña!</p>
              </div>
            </div>

            {/* Desglose de puntos */}
            <div className="space-y-2 border-t border-green-200 dark:border-green-800 pt-3">
              <div className="text-xs font-medium text-green-700 dark:text-green-300 mb-2">Desglose de puntos:</div>

              {/* Puntos base */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Star className="h-3 w-3 text-green-600" />
                  <span className="text-green-700 dark:text-green-300">
                    {is_first_review ? "Lugar no reseñado" : "Lugar ya presente"}
                  </span>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs"
                >
                  +{is_first_review ? base_points + first_review_bonus : base_points}
                </Badge>
              </div>

              {/* Bonus por foto */}
              {has_photos && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Camera className="h-3 w-3 text-green-600" />
                    <span className="text-green-700 dark:text-green-300">Agregar foto</span>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs"
                  >
                    +{photo_bonus}
                  </Badge>
                </div>
              )}

              {/* Bonus por reseña extensa */}
              {is_extended_review && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <FileText className="h-3 w-3 text-green-600" />
                    <span className="text-green-700 dark:text-green-300">Reseña extensa (+300 chars)</span>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs"
                  >
                    +{extended_review_bonus}
                  </Badge>
                </div>
              )}

              {/* Bonus especial por primera reseña */}
              {is_first_review && (
                <div className="mt-2 p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-md border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3 text-yellow-600" />
                    <span className="text-xs font-medium text-yellow-800 dark:text-yellow-200">
                      🏆 ¡Bonus por ser el primero en reseñar este lugar!
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
