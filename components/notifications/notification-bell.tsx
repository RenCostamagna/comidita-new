"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { NotificationsList } from "./notifications-list"
import {
  getUserNotifications,
  getUnreadNotificationsCount,
  markAllNotificationsAsRead,
  subscribeToNotifications,
  type Notification,
} from "@/lib/notifications"

interface NotificationBellProps {
  userId: string
  onNotificationClick?: (notification: Notification) => void
}

export function NotificationBell({ userId, onNotificationClick }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!userId) return

    fetchNotifications()
    fetchUnreadCount()

    // Suscribirse a notificaciones en tiempo real
    const subscription = subscribeToNotifications(userId, (newNotification) => {
      setNotifications((prev) => [newNotification, ...prev])
      setUnreadCount((prev) => prev + 1)

      // Mostrar notificación del navegador si está permitido
      if (Notification.permission === "granted") {
        new Notification(newNotification.title, {
          body: newNotification.message,
          icon: "/favicon.ico",
        })
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [userId])

  const fetchNotifications = async () => {
    try {
      const data = await getUserNotifications(userId, 10)
      setNotifications(data)
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUnreadCount = async () => {
    try {
      const count = await getUnreadNotificationsCount(userId)
      setUnreadCount(count)
    } catch (error) {
      console.error("Error fetching unread count:", error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead(userId)
      setUnreadCount(0)
      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          is_read: true,
        })),
      )
    } catch (error) {
      console.error("Error marking all as read:", error)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    setIsOpen(false)
    if (onNotificationClick) {
      onNotificationClick(notification)
    }
  }

  // Solicitar permisos de notificación al montar el componente
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }
  }, [])

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-9 w-9 hover:bg-transparent focus:bg-transparent focus-visible:ring-0"
          size="icon"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end" forceMount>
        <div className="flex items-center justify-between p-2">
          <h4 className="font-semibold">Notificaciones</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs" onClick={handleMarkAllAsRead}>
              Marcar como leídas
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />

        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Cargando notificaciones...</div>
          ) : notifications.length > 0 ? (
            <NotificationsList notifications={notifications} onNotificationClick={handleNotificationClick} />
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">No tienes notificaciones</div>
          )}
        </div>

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center text-sm text-muted-foreground cursor-pointer">
              Ver todas las notificaciones
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
