"use client"

import { useState, useEffect } from "react"
import { Calendar, Star, LogOut } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserLevelBadge } from "@/components/user/user-level-badge"
import { DetailedReviewCard } from "@/components/reviews/detailed-review-card"
import { createClient } from "@/lib/supabase/client"
import type { DetailedReview } from "@/lib/types"
import { Button } from "@/components/ui/button"

const handleLogout = async () => {
  const supabase = createClient()
  await supabase.auth.signOut()
  window.location.reload()
}

interface UserProfilePageProps {
  user: any
  onBack: () => void
}

export function UserProfilePage({ user, onBack }: UserProfilePageProps) {
  const [userReviews, setUserReviews] = useState<DetailedReview[]>([])
  const [userStats, setUserStats] = useState({
    totalReviews: 0,
    totalPoints: 0,
    placesReviewed: 0,
    averageRating: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    fetchUserData()
  }, [user.id])

  const fetchUserData = async () => {
    try {
      // Obtener reseñas del usuario
      const { data: reviewsData, error: reviewsError } = await supabase
        .from("detailed_reviews")
        .select(`
          *,
          place:places(*)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (reviewsError) {
        console.error("Error fetching user reviews:", reviewsError)
        setUserReviews([])
      } else {
        setUserReviews(reviewsData || [])
      }

      // Obtener estadísticas del usuario
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("points")
        .eq("id", user.id)
        .single()

      if (userError) {
        console.error("Error fetching user data:", userError)
      }

      // Calcular estadísticas
      const reviews = reviewsData || []
      const totalReviews = reviews.length
      const totalPoints = userData?.points || 0
      const placesReviewed = new Set(reviews.map((r) => r.place_id)).size
      const averageRating =
        reviews.length > 0
          ? reviews.reduce((sum, review) => {
              const ratings = [
                review.food_taste,
                review.presentation,
                review.portion_size,
                review.drinks_variety,
                review.veggie_options,
                review.gluten_free_options,
                review.vegan_options,
                review.music_acoustics,
                review.ambiance,
                review.furniture_comfort,
                review.cleanliness,
                review.service,
              ]
              return sum + ratings.reduce((a, b) => a + b, 0) / ratings.length
            }, 0) / reviews.length
          : 0

      setUserStats({
        totalReviews,
        totalPoints,
        placesReviewed,
        averageRating,
      })
    } catch (error) {
      console.error("Error fetching user data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-AR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Información del perfil */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage
                src={user.user_metadata?.avatar_url || "/placeholder.svg"}
                alt={user.user_metadata?.full_name}
              />
              <AvatarFallback className="text-2xl">
                {user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div>
                <CardTitle className="text-xl">{user.user_metadata?.full_name || "Usuario"}</CardTitle>
                <CardDescription>{user.email}</CardDescription>
              </div>
              <UserLevelBadge userId={user.id} userPoints={userStats.totalPoints} showProgress={true} />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center gap-2 bg-transparent"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{userStats.totalReviews}</div>
            <div className="text-sm text-muted-foreground">Reseñas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{userStats.totalPoints.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Puntos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{userStats.placesReviewed}</div>
            <div className="text-sm text-muted-foreground">Lugares</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{userStats.averageRating.toFixed(1)}</div>
            <div className="text-sm text-muted-foreground">Promedio</div>
          </CardContent>
        </Card>
      </div>

      {/* Información adicional */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Información
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Miembro desde {formatDate(user.created_at || new Date().toISOString())}</span>
          </div>
          {userStats.totalReviews > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Star className="h-4 w-4 text-muted-foreground" />
              <span>Última reseña: {formatDate(userReviews[0]?.created_at)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reseñas del usuario */}
      <Card>
        <CardHeader>
          <CardTitle>Mis Reseñas ({userStats.totalReviews})</CardTitle>
          <CardDescription>Todas tus reseñas y experiencias compartidas</CardDescription>
        </CardHeader>
      </Card>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="text-muted-foreground">Cargando reseñas...</div>
        </div>
      ) : userReviews.length > 0 ? (
        <div className="space-y-4">
          {userReviews.map((review) => (
            <DetailedReviewCard key={review.id} review={review} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Aún no has hecho ninguna reseña.</p>
            <p className="text-sm text-muted-foreground mt-2">¡Comparte tu primera experiencia gastronómica!</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
