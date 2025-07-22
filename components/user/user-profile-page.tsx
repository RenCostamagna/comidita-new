"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { DetailedReviewCard } from "@/components/reviews/detailed-review-card"
import { UserLevelBadge } from "@/components/user/user-level-badge"
import { AchievementsShowcase } from "@/components/achievements/achievements-showcase"
import { PointsHistory } from "@/components/user/points-history"
import { LevelsShowcase } from "@/components/user/levels-showcase"
import { DetailedReviewForm } from "@/components/reviews/detailed-review-form"
import { DeleteReviewDialog } from "@/components/reviews/delete-review-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { User, MapPin, Star, Trophy, TrendingUp, Award, MoreVertical, Eye, Edit, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { DetailedReview } from "@/lib/types"

interface UserStats {
  total_reviews: number
  total_points: number
  current_level: number
  average_rating: number
  places_visited: number
  achievements_count: number
  reviews_this_month: number
  favorite_category: string
}

interface UserProfilePageProps {
  userId?: string
}

export function UserProfilePage({ userId }: UserProfilePageProps) {
  const [user, setUser] = useState<any>(null)
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [reviews, setReviews] = useState<DetailedReview[]>([])
  const [achievements, setAchievements] = useState<any[]>([])
  const [pointsHistory, setPointsHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("reviews")
  const [editingReview, setEditingReview] = useState<DetailedReview | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    review: DetailedReview | null
  }>({ open: false, review: null })

  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    loadUserProfile()
  }, [userId])

  const loadUserProfile = async () => {
    try {
      setLoading(true)

      // Obtener usuario actual si no se especifica userId
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()
      const targetUserId = userId || currentUser?.id

      if (!targetUserId) {
        throw new Error("Usuario no encontrado")
      }

      // Cargar datos del usuario
      const { data: userData } = await supabase.from("users").select("*").eq("id", targetUserId).single()

      setUser(userData || currentUser)

      // Cargar estadísticas del usuario
      const { data: statsData } = await supabase.rpc("get_user_stats", { user_id: targetUserId })

      setUserStats(
        statsData || {
          total_reviews: 0,
          total_points: 0,
          current_level: 1,
          average_rating: 0,
          places_visited: 0,
          achievements_count: 0,
          reviews_this_month: 0,
          favorite_category: "Sin categoría",
        },
      )

      // Cargar reseñas del usuario
      const { data: reviewsData } = await supabase
        .from("detailed_reviews")
        .select(`
          *,
          place:places(*)
        `)
        .eq("user_id", targetUserId)
        .order("created_at", { ascending: false })

      setReviews(reviewsData || [])

      // Cargar logros del usuario
      const { data: achievementsData } = await supabase
        .from("user_achievements")
        .select(`
          *,
          achievement:achievements(*)
        `)
        .eq("user_id", targetUserId)
        .order("earned_at", { ascending: false })

      setAchievements(achievementsData || [])

      // Cargar historial de puntos
      const { data: pointsData } = await supabase
        .from("points_history")
        .select("*")
        .eq("user_id", targetUserId)
        .order("created_at", { ascending: false })
        .limit(10)

      setPointsHistory(pointsData || [])
    } catch (error) {
      console.error("Error cargando perfil:", error)
      toast({
        title: "Error",
        description: "No se pudo cargar el perfil del usuario",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleViewReview = (review: DetailedReview) => {
    // Navegar a la página de la reseña individual
    window.location.href = `/reviews/${review.id}`
  }

  const handleEditReview = (review: DetailedReview) => {
    setEditingReview(review)
  }

  const handleDeleteReview = (review: DetailedReview) => {
    setDeleteDialog({ open: true, review })
  }

  const confirmDeleteReview = async () => {
    if (!deleteDialog.review) return

    try {
      const response = await fetch(`/api/reviews/delete?id=${deleteDialog.review.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al eliminar la reseña")
      }

      // Actualizar la lista de reseñas
      setReviews((prev) => prev.filter((r) => r.id !== deleteDialog.review!.id))

      toast({
        title: "Reseña eliminada",
        description: "La reseña se eliminó correctamente",
      })

      // Recargar estadísticas
      loadUserProfile()
    } catch (error) {
      console.error("Error eliminando reseña:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo eliminar la reseña",
        variant: "destructive",
      })
    }
  }

  const handleEditSuccess = () => {
    setEditingReview(null)
    loadUserProfile() // Recargar datos
    toast({
      title: "Reseña actualizada",
      description: "Los cambios se guardaron correctamente",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (editingReview) {
    return (
      <DetailedReviewForm
        existingReview={editingReview}
        onCancel={() => setEditingReview(null)}
        onSuccess={handleEditSuccess}
      />
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <User className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">Usuario no encontrado</h3>
              <p className="mt-1 text-sm text-muted-foreground">No se pudo cargar la información del perfil.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const progressToNextLevel = userStats ? ((userStats.total_points % 100) / 100) * 100 : 0

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <DeleteReviewDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, review: null })}
        onConfirm={confirmDeleteReview}
        reviewTitle={
          deleteDialog.review?.place?.name ? `tu reseña de ${deleteDialog.review.place.name}` : "esta reseña"
        }
      />

      {/* Header del perfil */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user.avatar_url || "/placeholder.svg"} alt={user.full_name || user.email} />
              <AvatarFallback className="text-2xl">
                {(user.full_name || user.email || "U").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-3xl font-bold">{user.full_name || "Usuario"}</h1>
                <p className="text-muted-foreground">{user.email}</p>
                {userStats && (
                  <div className="flex items-center gap-2 mt-2">
                    <UserLevelBadge level={userStats.current_level} />
                    <Badge variant="secondary">
                      <Trophy className="w-3 h-3 mr-1" />
                      {userStats.achievements_count} logros
                    </Badge>
                  </div>
                )}
              </div>

              {userStats && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progreso al siguiente nivel</span>
                    <span>{userStats.total_points % 100}/100 puntos</span>
                  </div>
                  <Progress value={progressToNextLevel} className="h-2" />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas rápidas */}
      {userStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{userStats.total_reviews}</p>
                  <p className="text-xs text-muted-foreground">Reseñas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{userStats.places_visited}</p>
                  <p className="text-xs text-muted-foreground">Lugares</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{userStats.total_points}</p>
                  <p className="text-xs text-muted-foreground">Puntos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{userStats.average_rating.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">Promedio</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs de contenido */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="reviews">Reseñas</TabsTrigger>
          <TabsTrigger value="achievements">Logros</TabsTrigger>
          <TabsTrigger value="levels">Niveles</TabsTrigger>
          <TabsTrigger value="activity">Actividad</TabsTrigger>
        </TabsList>

        <TabsContent value="reviews" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mis Reseñas ({reviews.length})</CardTitle>
              <CardDescription>Todas tus reseñas y experiencias compartidas</CardDescription>
            </CardHeader>
            <CardContent>
              {reviews.length === 0 ? (
                <div className="text-center py-8">
                  <Star className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-semibold">No hay reseñas</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Comienza escribiendo tu primera reseña.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="relative">
                      <DetailedReviewCard review={review} />

                      {/* Menú de acciones */}
                      <div className="absolute top-4 right-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewReview(review)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver reseña
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditReview(review)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteReview(review)} className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements">
          <AchievementsShowcase achievements={achievements} />
        </TabsContent>

        <TabsContent value="levels">
          <LevelsShowcase currentLevel={userStats?.current_level || 1} totalPoints={userStats?.total_points || 0} />
        </TabsContent>

        <TabsContent value="activity">
          <PointsHistory history={pointsHistory} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
