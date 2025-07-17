"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Star, Camera, FileText, MapPin } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface PointsHistoryEntry {
  action_type: string
  points_earned: number
  description: string
  created_at: string
}

interface PointsHistoryProps {
  userId: string
}

const ACTION_ICONS = {
  review_existing_place: Star,
  review_new_place: MapPin,
  add_photo: Camera,
  extended_review: FileText,
}

const ACTION_COLORS = {
  review_existing_place: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200",
  review_new_place: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200",
  add_photo: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200",
  extended_review: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-200",
}

export function PointsHistory({ userId }: PointsHistoryProps) {
  const [history, setHistory] = useState<PointsHistoryEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalPoints, setTotalPoints] = useState(0)

  const supabase = createClient()

  useEffect(() => {
    fetchPointsHistory()
  }, [userId])

  const fetchPointsHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("points_history")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50) // Últimas 50 transacciones

      if (error) {
        console.error("Error fetching points history:", error)
        setHistory([])
      } else {
        setHistory(data || [])
        // Calcular total de puntos
        const total = (data || []).reduce((sum, entry) => sum + entry.points_earned, 0)
        setTotalPoints(total)
      }
    } catch (error) {
      console.error("Error fetching points history:", error)
      setHistory([])
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-AR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getActionIcon = (actionType: string) => {
    const IconComponent = ACTION_ICONS[actionType as keyof typeof ACTION_ICONS] || Star
    return IconComponent
  }

  const getActionColor = (actionType: string) => {
    return ACTION_COLORS[actionType as keyof typeof ACTION_COLORS] || ACTION_COLORS.review_existing_place
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historial de Puntos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="text-muted-foreground">Cargando historial...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Historial de Puntos</span>
          <Badge variant="secondary" className="text-lg px-3 py-1">
            {totalPoints.toLocaleString()} pts
          </Badge>
        </CardTitle>
        <CardDescription>Últimas {history.length} transacciones de puntos</CardDescription>
      </CardHeader>
      <CardContent>
        {history.length > 0 ? (
          <div className="space-y-3">
            {history.map((entry, index) => {
              const IconComponent = getActionIcon(entry.action_type)
              const colorClass = getActionColor(entry.action_type)

              return (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                  <div className={`p-2 rounded-full ${colorClass}`}>
                    <IconComponent className="h-4 w-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm truncate">{entry.description}</p>
                      <Badge
                        variant="secondary"
                        className="ml-2 text-green-700 bg-green-100 dark:bg-green-900/20 dark:text-green-200"
                      >
                        +{entry.points_earned}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(entry.created_at)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Aún no tienes historial de puntos</p>
            <p className="text-sm text-muted-foreground mt-1">¡Haz tu primera reseña para empezar a ganar puntos!</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
