"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, Trophy, ArrowLeft } from "lucide-react"
import { UserLevelBadge } from "./user-level-badge"
import { AchievementsShowcase } from "../achievements/achievements-showcase"
import { AchievementsProgress } from "../achievements/achievements-progress"
import { LevelsShowcase } from "./levels-showcase"
import { PointsHistory } from "./points-history"
import { ProfileReviewCard } from "../reviews/profile-review-card"
import { SingleReviewPage } from "../reviews/single-review-page"
import type { DetailedReview, UserProfile, Achievement, UserAchievement, Place } from "@/lib/types"

interface UserProfilePageProps {
  userId: string
  onBack: () => void
}

export function UserProfilePage({ userId, onBack }: UserProfilePageProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [reviews, setReviews] = useState<DetailedReview[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([])
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReview, setSelectedReview] = useState<DetailedReview | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchUserData()
  }, [userId])

  const fetchUserData = async () => {
    try {
      // Fetch user profile
      const { data: profileData } = await supabase.from("user_profiles").select("*").eq("user_id", userId).single()

      if (profileData) {
        setProfile(profileData)
      }

      // Fetch user reviews with place information
      const { data: reviewsData } = await supabase
        .from("reviews")
        .select(`
          *,
          place:places(*)
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (reviewsData) {
        setReviews(reviewsData)
      }

      // Fetch achievements
      const { data: achievementsData } = await supabase.from("achievements").select("*")

      if (achievementsData) {
        setAchievements(achievementsData)
      }

      // Fetch user achievements
      const { data: userAchievementsData } = await supabase.from("user_achievements").select("*").eq("user_id", userId)

      if (userAchievementsData) {
        setUserAchievements(userAchievementsData)
      }

      // Fetch places the user has reviewed
      const { data: placesData } = await supabase
        .from("places")
        .select("*")
        .in("id", reviewsData?.map((r) => r.place_id) || [])

      if (placesData) {
        setPlaces(placesData)
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewReview = (review: DetailedReview) => {
    setSelectedReview(review)
  }

  const handleBackFromReview = () => {
    setSelectedReview(null)
  }

  if (selectedReview) {
    return <SingleReviewPage review={selectedReview} onBack={handleBackFromReview} />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Usuario no encontrado</p>
      </div>
    )
  }

  const totalReviews = reviews.length
  const totalPlaces = new Set(reviews.map((r) => r.place_id)).size
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
          ].filter((rating) => rating != null && !isNaN(rating))

          return sum + ratings.reduce((a, b) => a + b, 0) / ratings.length
        }, 0) / reviews.length
      : 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>

          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="text-2xl">
                {profile.display_name?.charAt(0) || profile.email?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <h1 className="text-2xl font-bold">{profile.display_name || "Usuario"}</h1>
              <p className="text-muted-foreground">{profile.email}</p>
              <div className="flex items-center gap-4 mt-2">
                <UserLevelBadge points={profile.total_points} level={profile.level} />
                <div className="flex items-center gap-1">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium">{profile.total_points} puntos</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-500">{totalReviews}</div>
              <div className="text-sm text-muted-foreground">Reseñas</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-500">{profile.total_points}</div>
              <div className="text-sm text-muted-foreground">Puntos</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-500">{totalPlaces}</div>
              <div className="text-sm text-muted-foreground">Lugares</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-1">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="text-2xl font-bold text-yellow-500">{averageRating.toFixed(1)}</span>
              </div>
              <div className="text-sm text-muted-foreground">Promedio</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="activity" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="activity">Actividad</TabsTrigger>
            <TabsTrigger value="achievements">Logros</TabsTrigger>
            <TabsTrigger value="levels">Niveles</TabsTrigger>
            <TabsTrigger value="reviews">Reseñas</TabsTrigger>
          </TabsList>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Actividad Reciente</CardTitle>
              </CardHeader>
              <CardContent>
                <PointsHistory userId={userId} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-4">
            <AchievementsShowcase achievements={achievements} userAchievements={userAchievements} />
            <AchievementsProgress userId={userId} achievements={achievements} userAchievements={userAchievements} />
          </TabsContent>

          <TabsContent value="levels" className="space-y-4">
            <LevelsShowcase currentLevel={profile.level} totalPoints={profile.total_points} />
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Mis Reseñas ({totalReviews})</CardTitle>
              </CardHeader>
              <CardContent>
                {reviews.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No has escrito ninguna reseña aún</p>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <ProfileReviewCard key={review.id} review={review} onViewReview={handleViewReview} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
