import { createClient } from "@/lib/supabase/client"

export interface Notification {
  id: string
  type: "achievement_unlocked" | "review_published" | "level_up" | "points_earned"
  title: string
  message: string
  data: any
  is_read: boolean
  created_at: string
  time_ago: string
}

const supabase = createClient()

// Obtener notificaciones del usuario
export async function getUserNotifications(userId: string, limit = 20, offset = 0): Promise<Notification[]> {
  try {
    const { data, error } = await supabase.rpc("get_user_notifications", {
      user_id_param: userId,
      limit_param: limit,
      offset_param: offset,
    })

    if (error) {
      console.error("Error fetching notifications:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return []
  }
}

// Contar notificaciones no leídas
export async function getUnreadNotificationsCount(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase.rpc("get_unread_notifications_count", {
      user_id_param: userId,
    })

    if (error) {
      console.error("Error fetching unread count:", error)
      return 0
    }

    return data || 0
  } catch (error) {
    console.error("Error fetching unread count:", error)
    return 0
  }
}

// Marcar notificación como leída
export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  try {
    const { error } = await supabase.rpc("mark_notification_as_read", {
      notification_id_param: notificationId,
    })

    if (error) {
      console.error("Error marking notification as read:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error marking notification as read:", error)
    return false
  }
}

// Marcar todas las notificaciones como leídas
export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase.rpc("mark_all_notifications_as_read", {
      user_id_param: userId,
    })

    if (error) {
      console.error("Error marking all notifications as read:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error marking all notifications as read:", error)
    return false
  }
}

// Suscribirse a nuevas notificaciones en tiempo real
export function subscribeToNotifications(userId: string, onNewNotification: (notification: Notification) => void) {
  const subscription = supabase
    .channel("notifications")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        // Transformar el payload a nuestro formato
        const notification: Notification = {
          id: payload.new.id,
          type: payload.new.type,
          title: payload.new.title,
          message: payload.new.message,
          data: payload.new.data,
          is_read: payload.new.is_read,
          created_at: payload.new.created_at,
          time_ago: "Ahora",
        }
        onNewNotification(notification)
      },
    )
    .subscribe()

  return subscription
}

// Obtener icono según el tipo de notificación
export function getNotificationIcon(type: string): string {
  switch (type) {
    case "achievement_unlocked":
      return "🏆"
    case "review_published":
      return "⭐"
    case "level_up":
      return "🎉"
    case "points_earned":
      return "💎"
    default:
      return "🔔"
  }
}

// Obtener color según el tipo de notificación
export function getNotificationColor(type: string): string {
  switch (type) {
    case "achievement_unlocked":
      return "text-yellow-600"
    case "review_published":
      return "text-blue-600"
    case "level_up":
      return "text-green-600"
    case "points_earned":
      return "text-purple-600"
    default:
      return "text-gray-600"
  }
}
