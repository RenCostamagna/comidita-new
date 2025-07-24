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
import { deleteMultipleReviewPhotos } from "@/lib/storage"
import { useToast } from "@/hooks/use-toast"

const handleLogout = async () => {
  const supabase = createClient()
  await supabase.auth.signOut()
  window.location.reload()
}

interface UserProfilePageProps {
  user: any
  onBack: () => void
  onReviewClick: (reviewId: string) => void
  onEditReview: (reviewId: string) => void
}

export function UserProfilePage({ user, onBack, onReviewClick, onEditReview }: UserProfilePageProps) {
  const [userReviews, setUserReviews] = useState<DetailedReview[]>([])
  const [userStats, setUserStats] = useState({
    totalReviews: 0,
    totalPoints: 0,
    placesReviewed: 0,
    averageRating: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()
  const { toast } = useToast()

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

  const handleDeleteReview = async (reviewId: string) => {
    try {
      // Mostrar confirmación
      if (!confirm("¿Estás seguro de que quieres eliminar esta reseña? Esta acción no se puede deshacer.")) {
        return
      }

      toast({
        title: "Eliminando reseña...",
        description: "Por favor espera mientras eliminamos la reseña y sus fotos.",
      })

      // Encontrar la reseña a eliminar
      const reviewToDelete = userReviews.find((r) => r.id === reviewId)
      if (!reviewToDelete) {
        throw new Error("Reseña no encontrada")
      }

      const placeId = reviewToDelete.place_id

      // Verificar si esta es la única reseña del lugar
      const { data: placeReviewsCount, error: countError } = await supabase
        .from("reviews")
        .select("id", { count: "exact" })
        .eq("place_id", placeId)

      if (countError) {
        console.error("Error contando reseñas del lugar:", countError)
      }

      const { data: detailedReviewsCount, error: detailedCountError } = await supabase
        .from("detailed_reviews")
        .select("id", { count: "exact" })
        .eq("place_id", placeId)

      if (detailedCountError) {
        console.error("Error contando reseñas detalladas del lugar:", detailedCountError)
      }

      const totalReviewsForPlace = (placeReviewsCount?.length || 0) + (detailedReviewsCount?.length || 0)
      const isLastReview = totalReviewsForPlace <= 1

      console.log(`Eliminando reseña ${reviewId}. Es la última reseña del lugar: ${isLastReview}`)

      // Obtener todas las URLs de fotos para eliminar
      const photoUrls: string[] = []

      // Fotos de la nueva estructura
      if (reviewToDelete.photos && reviewToDelete.photos.length > 0) {
        reviewToDelete.photos.forEach((photo) => {
          if (photo.photo_url && photo.photo_url.trim()) {
            photoUrls.push(photo.photo_url.trim())
          }
        })
      }

      // Fotos de campos legacy
      const legacyFields = ["photo_1_url", "photo_2_url", "photo_3_url", "photo_4_url", "photo_5_url", "photo_6_url"]
      legacyFields.forEach((field) => {
        const photoUrl = reviewToDelete[field as keyof typeof reviewToDelete] as string
        if (photoUrl && photoUrl.trim() && !photoUrls.includes(photoUrl.trim())) {
          photoUrls.push(photoUrl.trim())
        }
      })

      console.log(`Eliminando reseña ${reviewId} con ${photoUrls.length} fotos`)

      // Eliminar fotos primero
      if (photoUrls.length > 0) {
        console.log("Eliminando fotos:", photoUrls)
        const deleteResults = await deleteMultipleReviewPhotos(photoUrls)
        const failedDeletes = deleteResults.filter((result) => !result).length

        if (failedDeletes > 0) {
          console.warn(`${failedDeletes} fotos no pudieron ser eliminadas`)
        }
      }

      // Eliminar registros de fotos de la base de datos
      const { error: photosError } = await supabase.from("review_photos").delete().eq("review_id", reviewId)

      if (photosError) {
        console.warn("Error eliminando registros de fotos:", photosError)
      }

      // Determinar si es una reseña detallada o simple
      const isDetailedReview = reviewToDelete.food_taste !== undefined

      // Eliminar la reseña de la tabla correspondiente
      const tableName = isDetailedReview ? "detailed_reviews" : "reviews"
      const { error: reviewError } = await supabase.from(tableName).delete().eq("id", reviewId).eq("user_id", user.id) // Seguridad adicional

      if (reviewError) {
        throw new Error(`Error eliminando reseña: ${reviewError.message}`)
      }

      console.log(`✅ Reseña eliminada de tabla ${tableName}`)

      // Si es la última reseña del lugar, eliminar también el lugar
      if (isLastReview && placeId) {
        console.log(`Eliminando lugar ${placeId} porque era la única reseña`)

        const { error: placeError } = await supabase.from("places").delete().eq("id", placeId)

        if (placeError) {
          console.warn("Error eliminando lugar:", placeError)
          // No lanzar error aquí, la reseña ya fue eliminada exitosamente
        } else {
          console.log(`✅ Lugar ${placeId} eliminado exitosamente`)
        }
      }

      // Actualizar el estado local
      const updatedReviews = userReviews.filter((r) => r.id !== reviewId)
      setUserReviews(updatedReviews)

      // Recalcular estadísticas
      const totalReviews = updatedReviews.length
      const placesReviewed = new Set(updatedReviews.map((r) => r.place_id)).size
      const averageRating =
        updatedReviews.length > 0
          ? updatedReviews.reduce((sum, review) => {
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
            }, 0) / updatedReviews.length
          : 0

      setUserStats((prev) => ({
        ...prev,
        totalReviews,
        placesReviewed,
        averageRating,
      }))

      toast({
        title: "Reseña eliminada",
        description: isLastReview
          ? "La reseña y el lugar han sido eliminados exitosamente. Ahora se puede reseñar por primera vez de nuevo."
          : "La reseña y todas sus fotos han sido eliminadas exitosamente.",
      })

      console.log(`✅ Reseña ${reviewId} eliminada exitosamente`)
    } catch (error) {
      console.error("Error eliminando reseña:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo eliminar la reseña. Inténtalo de nuevo.",
        variant: "destructive",
      })
    }
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
                                onClick={() => onEditReview(review.id)}
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
