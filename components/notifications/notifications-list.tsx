"use client"

import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { markNotificationAsRead, getNotificationIcon, type Notification } from "@/lib/notifications"

interface NotificationsListProps {
  notifications: Notification[]
  onNotificationClick?: (notification: Notification) => void
}

export function NotificationsList({ notifications, onNotificationClick }: NotificationsListProps) {
  const handleNotificationClick = async (notification: Notification) => {
    // Marcar como leída si no lo está
    if (!notification.is_read) {
      await markNotificationAsRead(notification.id)
    }

    // Ejecutar callback si existe
    if (onNotificationClick) {
      onNotificationClick(notification)
    }
  }

  return (
    <>
      {notifications.map((notification) => (
        <DropdownMenuItem
          key={notification.id}
          className="flex flex-col items-start p-3 cursor-pointer hover:bg-muted/50"
          onClick={() => handleNotificationClick(notification)}
        >
          <div className="flex items-center gap-2 w-full">
            <div
              className={`w-2 h-2 rounded-full flex-shrink-0 ${notification.is_read ? "bg-transparent" : "bg-blue-500"}`}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                <p className="text-sm font-medium truncate">{notification.title}</p>
                <span className="text-xs text-muted-foreground ml-auto">{notification.time_ago}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-tight">{notification.message}</p>

              {/* Información adicional según el tipo */}
              {notification.type === "achievement_unlocked" && notification.data?.points_reward && (
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-green-600 font-medium">+{notification.data.points_reward} pts</span>
                </div>
              )}

              {notification.type === "review_published" && notification.data?.points_earned && (
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-blue-600 font-medium">+{notification.data.points_earned} pts</span>
                </div>
              )}
            </div>
          </div>
        </DropdownMenuItem>
      ))}
    </>
  )
}
