"use client"

import { useState, useEffect, Suspense, lazy } from "react"
import { Calendar, Star, LogOut, MoreVertical, Eye, Edit, Trash2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserLevelBadge } from "@/components/user/user-level-badge"
import { createClient } from "@/lib/supabase/client"
import type { DetailedReview } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { deleteMultipleReviewPhotos } from "@/lib/storage"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

// Lazy load de componentes pesados
const PointsHistory = lazy(() =>
  import("@/components/user/points-history").then((module) => ({ default: module.PointsHistory })),
)
const LevelsShowcase = lazy(() =>
  import("@/components/user/levels-showcase").then((module) => ({ default: module.LevelsShowcase })),
)
const AchievementsShowcase = lazy(() =>
  import("@/components/achievements/achievements-showcase").then((module) => ({
    default: module.AchievementsShowcase,
  })),
)

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

// Componente de skeleton para las pestañas
const TabSkeleton = () => (
  <div className="space-y-4">
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardContent>
    </Card>
    <Card>
      <CardContent className="p-6">
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </CardContent>
    </Card>
  </div>
)

export function UserProfilePage({ user, onBack, onReviewClick, onEditReview }: UserProfilePageProps) {
  const [userReviews, setUserReviews] = useState<DetailedReview[]>([])
  const [userStats, setUserStats] = useState({
    totalReviews: 0,
    totalPoints: 0,
    placesReviewed: 0,
    averageRating: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("activity")
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set(["activity"]))

  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchUserData()
  }, [user.id])

  // Precargar datos cuando se cambia de pestaña
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    if (!loadedTabs.has(value)) {
      setLoadedTabs((prev) => new Set([...prev, value]))
    }
  }

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

      // Eliminar la reseña de la base de datos
      const { error: reviewError } = await supabase.from("reviews").delete().eq("id", reviewId).eq("user_id", user.id) // Seguridad adicional

      if (reviewError) {
        throw new Error(`Error eliminando reseña: ${reviewError.message}`)
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
        description: "La reseña y todas sus fotos han sido eliminadas exitosamente.",
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

      {/* Tabs con transiciones suaves */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="activity" className="transition-all duration-200">
            Actividad
          </TabsTrigger>
          <TabsTrigger value="achievements" className="transition-all duration-200">
            Logros
          </TabsTrigger>
          <TabsTrigger value="levels" className="transition-all duration-200">
            Niveles
          </TabsTrigger>
          <TabsTrigger value="reviews" className="transition-all duration-200">
            Reseñas
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="activity" className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
            {loadedTabs.has("activity") ? (
              <>
                {/* Historial de puntos con Suspense */}
                <Suspense fallback={<TabSkeleton />}>
                  <PointsHistory userId={user.id} />
                </Suspense>

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
              </>
            ) : (
              <TabSkeleton />
            )}
          </TabsContent>

          <TabsContent value="achievements" className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
            {loadedTabs.has("achievements") ? (
              <Suspense fallback={<TabSkeleton />}>
                <AchievementsShowcase userId={user.id} />
              </Suspense>
            ) : (
              <TabSkeleton />
            )}
          </TabsContent>

          <TabsContent value="levels" className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
            {loadedTabs.has("levels") ? (
              <Suspense fallback={<TabSkeleton />}>
                <LevelsShowcase currentUserPoints={userStats.totalPoints} showStatistics={true} />
              </Suspense>
            ) : (
              <TabSkeleton />
            )}
          </TabsContent>

          <TabsContent value="reviews" className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
            {/* Header de reseñas */}
            <Card>
              <CardHeader>
                <CardTitle>Mis Reseñas ({userStats.totalReviews})</CardTitle>
              </CardHeader>
            </Card>

            {/* Lista de reseñas simplificada */}
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="h-[120px]">
                    <CardContent className="p-3 h-full">
                      <div className="flex flex-col justify-between h-full">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                          <Skeleton className="h-4 w-12" />
                        </div>
                        <div className="flex justify-end">
                          <Skeleton className="h-8 w-8" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : userReviews.length > 0 ? (
              <div className="space-y-3">
                {userReviews.map((review, index) => {
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
                    <Card
                      key={review.id}
                      className="hover:shadow-md transition-all duration-200 h-[120px] w-full animate-in fade-in-0 slide-in-from-left-2"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
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
                                  className="text-xs px-2 py-1 bg-transparent h-8 w-8 p-0 hover:bg-accent transition-colors duration-200"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40 rounded-[var(--radius-dropdown)]">
                                <DropdownMenuItem
                                  onClick={() => onReviewClick(review.id)}
                                  className="flex items-center gap-2 cursor-pointer rounded-[var(--radius-dropdown)] transition-colors duration-150"
                                >
                                  <Eye className="h-4 w-4" />
                                  Ver reseña
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => onEditReview(review.id)}
                                  className="flex items-center gap-2 cursor-pointer rounded-[var(--radius-dropdown)] transition-colors duration-150"
                                >
                                  <Edit className="h-4 w-4" />
                                  Modificar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteReview(review.id)}
                                  className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600 rounded-[var(--radius-dropdown)] transition-colors duration-150"
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
        </div>
      </Tabs>
    </div>
  )
}
