"use client"
import { useRouter } from "next/navigation"
import type { Notification } from "@/lib/notifications"

interface NotificationHandlerProps {
  userId: string
  onReviewClick?: (reviewId: string) => void
  onAchievementClick?: (achievementId: string) => void
  onLevelUpClick?: () => void
}

export function NotificationHandler({
  userId,
  onReviewClick,
  onAchievementClick,
  onLevelUpClick,
}: NotificationHandlerProps) {
  const router = useRouter()

  const handleNotificationClick = (notification: Notification) => {
    switch (notification.type) {
      case "review_published":
        if (notification.data?.review_id && onReviewClick) {
          onReviewClick(notification.data.review_id)
        }
        break

      case "achievement_unlocked":
        if (notification.data?.achievement_id && onAchievementClick) {
          onAchievementClick(notification.data.achievement_id)
        }
        break

      case "level_up":
        if (onLevelUpClick) {
          onLevelUpClick()
        }
        break

      case "points_earned":
        // Podríamos navegar al perfil o mostrar el historial de puntos
        break

      default:
        console.log("Tipo de notificación no manejado:", notification.type)
    }
  }

  return null // Este componente no renderiza nada, solo maneja la lógica
}
