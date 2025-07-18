"use client"

import { useState } from "react"
import { PlaceReviewsPage } from "@/components/places/place-reviews-page"
import { TopRatedPlaces } from "@/components/places/top-rated-places"
import { DetailedReviewForm } from "@/components/reviews/detailed-review-form"
import { UserProfilePage } from "@/components/user/user-profile-page"
import { CategoryPlacesPage } from "@/components/places/category-places-page"
import { AllCategoriesPage } from "@/components/places/all-categories-page"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import type { Place } from "@/lib/types"
import { SingleReviewPage } from "@/components/reviews/single-review-page"
import { Header } from "@/components/layout/header"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { CategoriesSection } from "@/components/places/categories-section"
import { AchievementToast } from "@/components/achievements/achievement-toast"
import { AchievementsProgress } from "@/components/achievements/achievements-progress"

import type { Notification } from "@/lib/notifications"

interface HomePageProps {
  user: any
}

export function HomePage({ user: initialUser }: HomePageProps) {
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [showDetailedReviewForm, setShowDetailedReviewForm] = useState(false)
  const [showReviews, setShowReviews] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showCategoryPlaces, setShowCategoryPlaces] = useState(false)
  const [showAllCategories, setShowAllCategories] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [preSelectedPlaceForReview, setPreSelectedPlaceForReview] = useState<Place | null>(null)
  const [showSingleReview, setShowSingleReview] = useState(false)
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null)
  const [newAchievements, setNewAchievements] = useState<any[]>([])
  const [showAchievementToast, setShowAchievementToast] = useState(false)

  const [navigationHistory, setNavigationHistory] = useState<{
    cameFromReview?: string
  }>({})

  const [testUser, setTestUser] = useState<any>(null)

  const currentUser = initialUser || testUser

  const supabase = createClient()

  const [showNotificationHandler, setShowNotificationHandler] = useState(false)

  const handleNotificationClick = (notification: Notification) => {
    switch (notification.type) {
      case "review_published":
        if (notification.data?.review_id) {
          setSelectedReviewId(notification.data.review_id)
          setShowSingleReview(true)
          resetView()
        }
        break

      case "achievement_unlocked":
        goToProfile()
        break

      case "level_up":
        goToProfile()
        break

      case "points_earned":
        goToProfile()
        break

      default:
        console.log("Tipo de notificación no manejado:", notification.type)
    }
  }

  const handleTestLogin = async () => {
    const testUserData = {
      id: "test-user-123",
      email: "usuario@prueba.com",
      user_metadata: {
        full_name: "Usuario de Prueba",
        avatar_url: "/placeholder.svg?height=40&width=40",
      },
    }

    try {
      const { error } = await supabase.from("users").upsert({
        id: testUserData.id,
        email: testUserData.email,
        full_name: testUserData.user_metadata.full_name,
        avatar_url: testUserData.user_metadata.avatar_url,
      })

      if (error) {
        console.log("Usuario de prueba ya existe o error menor:", error)
      }
    } catch (error) {
      console.log("Error creando usuario de prueba:", error)
    }

    setTestUser(testUserData)
  }

  const goToHome = () => {
    resetView()
  }

  const goToProfile = () => {
    resetView()
    setShowProfile(true)
  }

  const goToReview = () => {
    setSelectedPlace(null)
    setShowReviews(false)
    setShowProfile(false)
    setShowCategoryPlaces(false)
    setShowAllCategories(false)
    setSelectedCategory("")
    setShowSearch(false)
    setShowSingleReview(false)
    setSelectedReviewId(null)
    setNavigationHistory({})

    setShowDetailedReviewForm(true)
  }

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category)
    setShowCategoryPlaces(true)
  }

  const handleViewAllCategories = () => {
    setShowAllCategories(true)
  }

  const handleHeaderPlaceSelect = async (place: any) => {
    await handlePlaceSelect(place)
    setShowReviews(true)
  }

  const handlePlaceSelect = async (googlePlace: any) => {
    setIsLoading(true)
    try {
      if (googlePlace.id && !googlePlace.google_place_id.startsWith("temp")) {
        setSelectedPlace(googlePlace)
        setIsLoading(false)
        return
      }

      const { data: existingPlace } = await supabase
        .from("places")
        .select("*")
        .eq("google_place_id", googlePlace.google_place_id)
        .single()

      if (existingPlace) {
        setSelectedPlace(existingPlace)
      } else {
        const newPlace = {
          google_place_id: googlePlace.google_place_id,
          name: googlePlace.name,
          address: googlePlace.address,
          latitude: googlePlace.latitude,
          longitude: googlePlace.longitude,
          phone: googlePlace.phone,
          website: googlePlace.website,
        }

        const { data: createdPlace, error } = await supabase.from("places").insert(newPlace).select().single()

        if (error) {
          console.error("Error creating place:", error)
          setSelectedPlace({
            id: `temp-${Date.now()}`,
            ...newPlace,
            rating: 0,
            total_reviews: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
        } else {
          setSelectedPlace(createdPlace)
        }
      }
    } catch (error) {
      console.error("Error handling place selection:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewReviews = (place: Place) => {
    setSelectedPlace(place)
    setShowReviews(true)
  }

  const handleAddReview = (place: Place) => {
    if (!currentUser) {
      alert("Debes iniciar sesión para dejar una reseña")
      return
    }

    const normalizedPlace = {
      id: place.id,
      google_place_id: place.google_place_id,
      name: place.name,
      address: place.address,
      latitude: place.latitude,
      longitude: place.longitude,
      phone: place.phone,
      website: place.website,
      rating: place.rating,
      total_reviews: place.total_reviews,
    }

    setPreSelectedPlaceForReview(normalizedPlace)
    goToReview()
  }

  const handleSubmitDetailedReview = async (reviewData: any) => {
    if (!currentUser) return

    setIsLoading(true)
    try {
      if (!reviewData.place || !reviewData.place.google_place_id) {
        throw new Error("Datos del lugar incompletos")
      }

      let placeId = reviewData.place.id

      if (!placeId || placeId.startsWith("temp-")) {
        const { data: existingPlace, error: searchError } = await supabase
          .from("places")
          .select("id")
          .eq("google_place_id", reviewData.place.google_place_id)
          .single()

        if (searchError && searchError.code !== "PGRST116") {
          console.error("Error searching for existing place:", searchError)
          throw searchError
        }

        if (existingPlace) {
          placeId = existingPlace.id
        } else {
          const placeToInsert = {
            google_place_id: reviewData.place.google_place_id,
            name: reviewData.place.name,
            address: reviewData.place.address,
            latitude: reviewData.place.latitude,
            longitude: reviewData.place.longitude,
            phone: reviewData.place.phone,
            website: reviewData.place.website,
          }

          const { data: createdPlace, error: placeError } = await supabase
            .from("places")
            .insert(placeToInsert)
            .select("id")
            .single()

          if (placeError) {
            console.error("Error creating place:", placeError)
            throw placeError
          }
          placeId = createdPlace.id
        }
      }

      const { data: existingReview, error: reviewCheckError } = await supabase
        .from("detailed_reviews")
        .select("id")
        .eq("user_id", currentUser.id)
        .eq("place_id", placeId)
        .single()

      if (reviewCheckError && reviewCheckError.code !== "PGRST116") {
        console.error("Error checking existing review:", reviewCheckError)
        throw reviewCheckError
      }

      if (existingReview) {
        throw new Error("Ya tienes una reseña para este lugar. Solo puedes tener una reseña por lugar.")
      }

      const hasPhotos = !!(reviewData.photo_1_url || reviewData.photo_2_url)
      const commentLength = reviewData.comment ? reviewData.comment.length : 0

      const { data: reviewCount } = await supabase
        .from("detailed_reviews")
        .select("id", { count: "exact" })
        .eq("place_id", placeId)

      const isFirstReview = (reviewCount?.length || 0) === 0

      const basePoints = 100
      const firstReviewBonus = isFirstReview ? 500 : 0
      const photoBonus = hasPhotos ? 50 : 0
      const extendedReviewBonus = commentLength >= 300 ? 50 : 0
      const totalPoints = basePoints + firstReviewBonus + photoBonus + extendedReviewBonus

      const reviewToInsert = {
        user_id: currentUser.id,
        place_id: placeId,
        dish_name: reviewData.dish_name,
        food_taste: reviewData.food_taste,
        presentation: reviewData.presentation,
        portion_size: reviewData.portion_size,
        drinks_variety: reviewData.drinks_variety,
        music_acoustics: reviewData.music_acoustics,
        ambiance: reviewData.ambiance,
        furniture_comfort: reviewData.furniture_comfort,
        cleanliness: reviewData.cleanliness,
        service: reviewData.service,
        celiac_friendly: reviewData.celiac_friendly || false,
        vegetarian_friendly: reviewData.vegetarian_friendly || false,
        price_range: reviewData.price_range,
        restaurant_category: reviewData.restaurant_category,
        comment: reviewData.comment,
        photo_1_url: reviewData.photo_1_url,
        photo_2_url: reviewData.photo_2_url,
      }

      const { error } = await supabase.from("detailed_reviews").insert(reviewToInsert)

      if (error) {
        console.error("Error submitting detailed review:", error)
        throw error
      }

      if (reviewData.restaurant_category) {
        try {
          const { data: achievementsData, error: achievementsError } = await supabase.rpc(
            "check_and_grant_achievements",
            {
              user_id_param: currentUser.id,
              category_param: reviewData.restaurant_category,
            },
          )

          if (!achievementsError && achievementsData && achievementsData.length > 0) {
            const newAchievements = achievementsData[0]
            if (Array.isArray(newAchievements) && newAchievements.length > 0) {
              setNewAchievements(newAchievements)
              setShowAchievementToast(true)
            }
          }
        } catch (error) {
          console.error("Error checking achievements:", error)
        }
      }

      setShowDetailedReviewForm(false)
      setPreSelectedPlaceForReview(null)
      resetView()
      alert(`¡Reseña enviada exitosamente! Ganaste ${totalPoints} puntos.`)
    } catch (error) {
      console.error("Error submitting detailed review:", error)
      alert(`Error al enviar la reseña: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const resetView = () => {
    setSelectedPlace(null)
    setShowDetailedReviewForm(false)
    setShowReviews(false)
    setShowProfile(false)
    setShowCategoryPlaces(false)
    setShowAllCategories(false)
    setSelectedCategory("")
    setShowSearch(false)
    setShowSingleReview(false)
    setSelectedReviewId(null)
    setPreSelectedPlaceForReview(null)
    setNavigationHistory({})
  }

  const handleReviewSelect = (reviewId: string) => {
    setSelectedReviewId(reviewId)
    setShowSingleReview(true)
  }

  const handleViewPlaceFromReview = (place: Place) => {
    setNavigationHistory({ cameFromReview: selectedReviewId })
    setSelectedPlace(place)
    setShowReviews(true)
    setShowSingleReview(false)
    setSelectedReviewId(null)
  }

  const handleBackFromPlaceReviews = () => {
    if (navigationHistory.cameFromReview) {
      setSelectedReviewId(navigationHistory.cameFromReview)
      setShowSingleReview(true)
      setShowReviews(false)
      setSelectedPlace(null)
      setNavigationHistory({})
    } else if (showCategoryPlaces && selectedCategory) {
      setShowReviews(false)
      setSelectedPlace(null)
    } else {
      resetView()
    }
  }

  if (showAllCategories) {
    return (
      <AllCategoriesPage
        onBack={() => setShowAllCategories(false)}
        onCategorySelect={(category) => {
          setShowAllCategories(false)
          handleCategorySelect(category)
        }}
        currentUser={currentUser}
        onGoHome={goToHome}
        onGoReview={goToReview}
        onGoProfile={goToProfile}
      />
    )
  }

  if (showReviews && selectedPlace) {
    return (
      <PlaceReviewsPage
        place={selectedPlace}
        onBack={handleBackFromPlaceReviews}
        onAddReview={handleAddReview}
        currentUser={currentUser}
        onGoHome={goToHome}
        onGoSearch={goToProfile}
        onGoReview={goToReview}
      />
    )
  }

  if (showSingleReview && selectedReviewId) {
    return (
      <SingleReviewPage
        reviewId={selectedReviewId}
        onBack={() => {
          setShowSingleReview(false)
          setSelectedReviewId(null)
        }}
        onViewPlace={handleViewPlaceFromReview}
        onAddReview={handleAddReview} // Add this line
        onGoHome={goToHome}
        onGoReview={goToReview}
        onGoProfile={goToProfile}
      />
    )
  }

  if (showProfile && currentUser) {
    return (
      <div className="min-h-screen bg-background">
        <Header
          user={currentUser}
          onViewProfile={goToProfile}
          onLogoClick={goToHome}
          onPlaceSelect={handleHeaderPlaceSelect}
        />
        <main className="container mx-auto px-4 py-8 pt-20 pb-24">
          <UserProfilePage user={currentUser} onBack={() => setShowProfile(false)} />
        </main>
        {currentUser && (
          <BottomNavigation
            currentPage="profile"
            onGoHome={resetView}
            onGoReview={goToReview}
            onGoProfile={goToProfile}
          />
        )}
      </div>
    )
  }

  if (showCategoryPlaces && selectedCategory) {
    return (
      <CategoryPlacesPage
        selectedCategory={selectedCategory}
        onBack={() => {
          setShowCategoryPlaces(false)
          setSelectedCategory("")
        }}
        onPlaceSelect={(place) => {
          setSelectedPlace(place)
          setShowReviews(true)
        }}
        onAddReview={handleAddReview}
        currentUser={currentUser}
        onGoHome={goToHome}
        onGoReview={goToReview}
        onGoProfile={goToProfile}
      />
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        user={currentUser}
        onViewProfile={goToProfile}
        onLogoClick={goToHome}
        onPlaceSelect={handleHeaderPlaceSelect}
        onNotificationClick={handleNotificationClick}
      />

      <main className={`container mx-auto px-4 py-8 pt-20 ${currentUser ? "pb-24" : ""}`}>
        {!currentUser && (
          <div className="flex items-center justify-center min-h-[calc(100vh-200px)] pt-8">
            <Card className="w-full max-w-md mx-auto">
              <CardHeader className="text-center space-y-4">
                <div className="space-y-2">
                  <CardTitle className="text-2xl font-bold">
                    Descubre los mejores lugares para comer en Rosario
                  </CardTitle>
                  <CardDescription className="text-base">
                    Inicia sesión para buscar restaurantes, leer reseñas y compartir tu experiencia
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Button
                    onClick={() => {
                      const supabase = createClient()
                      supabase.auth.signInWithOAuth({
                        provider: "google",
                        options: {
                          redirectTo: `${window.location.origin}/auth/callback`,
                        },
                      })
                    }}
                    className="w-full"
                    variant="outline"
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continuar con Google
                  </Button>

                  <Button
                    onClick={() => {
                      const supabase = createClient()
                      supabase.auth.signInWithOAuth({
                        provider: "facebook",
                        options: {
                          redirectTo: `${window.location.origin}/auth/callback`,
                        },
                      })
                    }}
                    className="w-full"
                    variant="outline"
                  >
                    <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    Continuar con Facebook
                  </Button>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 border-t"></div>
                  <span className="text-sm text-muted-foreground">o</span>
                  <div className="flex-1 border-t"></div>
                </div>

                {/* Usuario de prueba */}
                <div className="space-y-3">
                  <Button onClick={handleTestLogin} variant="secondary" className="w-full">
                    🧪 Entrar como Usuario de Prueba
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Para probar la aplicación sin configurar autenticación
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentUser && !selectedPlace && !showDetailedReviewForm && (
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Lugares destacados */}
            <TopRatedPlaces onPlaceSelect={handlePlaceSelect} onReviewSelect={handleReviewSelect} />

            {/* Categorías - MOVED TO SECOND POSITION */}
            <CategoriesSection onCategorySelect={handleCategorySelect} onViewAllCategories={handleViewAllCategories} />

            {/* Logros - MOVED TO THIRD POSITION */}
            <AchievementsProgress
              userId={currentUser.id}
              onViewAllAchievements={() => setShowProfile(true)}
              onAchievementSelect={(achievement) => {
                console.log("Selected achievement:", achievement)
              }}
            />
          </div>
        )}

        {showDetailedReviewForm && (
          <div className="max-w-2xl mx-auto space-y-6">
            <DetailedReviewForm
              onSubmit={handleSubmitDetailedReview}
              onCancel={() => {
                setShowDetailedReviewForm(false)
                setPreSelectedPlaceForReview(null)
              }}
              isLoading={isLoading}
              preSelectedPlace={preSelectedPlaceForReview}
            />
          </div>
        )}
      </main>

      {/* Achievement Toast */}
      {showAchievementToast && newAchievements.length > 0 && (
        <AchievementToast
          achievements={newAchievements}
          onClose={() => {
            setShowAchievementToast(false)
            setNewAchievements([])
          }}
        />
      )}

      {currentUser && (
        <BottomNavigation
          currentPage={showProfile ? "profile" : showDetailedReviewForm ? "review" : "home"}
          onGoHome={resetView}
          onGoReview={goToReview}
          onGoProfile={goToProfile}
        />
      )}
    </div>
  )
}
