"use client"

import { useState, useEffect } from "react"
import { Calendar, Star, LogOut, MoreVertical, Eye, Edit, Trash2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserLevelBadge } from "@/components/user/user-level-badge"
import { createClient } from "@/lib/supabase/client"
import type { DetailedReview } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { PointsHistory } from "@/components/user/points-history"
import { LevelsShowcase } from "@/components/user/levels-showcase"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AchievementsShowcase } from "@/components/achievements/achievements-showcase"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const handleLogout = async () => {
  const supabase = createClient()
  await supabase.auth.signOut()
  window.location.reload()
}

interface UserProfilePageProps {
  user: any
  onBack: () => void
  onReviewClick: (reviewId: string) => void
}

export function UserProfilePage({ user, onBack, onReviewClick }: UserProfilePageProps) {
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
          place:places(*),
          user:users(*)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (reviewsError) {
        console.error("Error fetching user reviews:", reviewsError)
        setUserReviews([])
      } else {
        // Asegurar que cada reseña tenga la información del usuario actual
        const reviewsWithUser = (reviewsData || []).map((review) => ({
          ...review,
          user: review.user || {
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Usuario",
            avatar_url: user.user_metadata?.avatar_url || "/placeholder.svg",
          },
        }))
        setUserReviews(reviewsWithUser)
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
              // Use only the 7 active rating fields
              const ratings = [
                review.food_taste,
                review.presentation,
                review.portion_size,
                review.music_acoustics,
                review.ambiance,
                review.furniture_comfort,
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

  const handleEditReview = (reviewId: string) => {
    // Placeholder function - functionality to be implemented later
    console.log("Edit review:", reviewId)
  }

  const handleDeleteReview = (reviewId: string) => {
    // Placeholder function - functionality to be implemented later
    console.log("Delete review:", reviewId)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Información del perfil */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            {/* Avatar + nombre/email */}
            <div className="flex gap-4 items-center sm:items-start">
              <Avatar className="h-20 w-20 shrink-0">
                <AvatarImage
                  src={user.user_metadata?.avatar_url || "/placeholder.svg"}
                  alt={user.user_metadata?.full_name}
                />
                <AvatarFallback className="text-2xl">
                  {user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>

              <div className="flex flex-col justify-center sm:justify-start">
                <CardTitle className="text-lg sm:text-xl">{user.user_metadata?.full_name || "Usuario"}</CardTitle>
                <CardDescription className="text-sm break-words">{user.email}</CardDescription>
              </div>
            </div>

            {/* Nivel */}
            <div className="w-full sm:ml-auto">
              <UserLevelBadge
                userId={user.id}
                userPoints={userStats.totalPoints}
                showProgress={true}
                showNextLevel={true}
              />
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

      {/* Tabs para organizar el contenido */}
      <Tabs defaultValue="activity" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="activity">Actividad</TabsTrigger>
          <TabsTrigger value="achievements">Logros</TabsTrigger>
          <TabsTrigger value="levels">Niveles</TabsTrigger>
          <TabsTrigger value="reviews">Reseñas</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-6">
          {/* Historial de puntos */}
          <PointsHistory userId={user.id} />

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
        </TabsContent>

        <TabsContent value="achievements">
          <AchievementsShowcase userId={user.id} />
        </TabsContent>

        <TabsContent value="levels">
          <LevelsShowcase currentUserPoints={userStats.totalPoints} showStatistics={true} />
        </TabsContent>

        <TabsContent value="reviews" className="space-y-6">
          {/* Header de reseñas */}
          <Card>
            <CardHeader>
              <CardTitle>Mis Reseñas ({userStats.totalReviews})</CardTitle>
            </CardHeader>
          </Card>

          {/* Lista de reseñas simplificada */}
          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">Cargando reseñas...</div>
            </div>
          ) : userReviews.length > 0 ? (
            <div className="space-y-3">
              {userReviews.map((review) => {
                const averageRating =
                  [
                    review.food_taste,
                    review.presentation,
                    review.portion_size,
                    review.music_acoustics,
                    review.ambiance,
                    review.furniture_comfort,
                    review.service,
                  ].reduce((sum, rating) => sum + rating, 0) / 7

                return (
                  <Card key={review.id} className="hover:shadow-md transition-shadow h-[120px] w-full">
                    <CardContent className="p-3 h-full">
                      <div className="flex flex-col justify-between h-full">
                        {/* Parte superior: nombre y puntaje */}
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-sm">{review.place?.name}</h3>
                            {review.dish_name && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{review.dish_name}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{averageRating.toFixed(1)}</span>
                          </div>
                        </div>

                        {/* Parte inferior: dropdown de acciones */}
                        <div className="flex justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs px-2 py-1 bg-transparent h-8 w-8 p-0"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 rounded-[var(--radius-dropdown)]">
                              <DropdownMenuItem
                                onClick={() => onReviewClick(review.id)}
                                className="flex items-center gap-2 cursor-pointer rounded-[var(--radius-dropdown)]"
                              >
                                <Eye className="h-4 w-4" />
                                Ver reseña
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleEditReview(review.id)}
                                className="flex items-center gap-2 cursor-pointer rounded-[var(--radius-dropdown)]"
                              >
                                <Edit className="h-4 w-4" />
                                Modificar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteReview(review.id)}
                                className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600 rounded-[var(--radius-dropdown)]"
                              >
                                <Trash2 className="h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">Aún no has hecho ninguna reseña.</p>
                <p className="text-sm text-muted-foreground mt-2">¡Comparte tu primera experiencia gastronómica!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
