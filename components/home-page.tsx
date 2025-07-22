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
    console.log("Header place selected:", place)

    // Si es un lugar que viene del header search (con ID interno)
    if (place.place_id && !isNaN(Number(place.place_id))) {
      // Es un ID interno, obtener los datos completos del lugar
      try {
        const { data: fullPlaceData, error } = await supabase
          .from("places")
          .select("*")
          .eq("id", Number(place.place_id))
          .single()

        if (error || !fullPlaceData) {
          console.error("Error fetching full place data:", error)
          return
        }

        // Crear el objeto place con la estructura correcta
        const normalizedPlace = {
          id: fullPlaceData.id,
          place_id: fullPlaceData.id.toString(), // Usar ID interno
          google_place_id: fullPlaceData.google_place_id,
          name: fullPlaceData.name,
          formatted_address: fullPlaceData.address,
          address: fullPlaceData.address,
          latitude: fullPlaceData.latitude,
          longitude: fullPlaceData.longitude,
          phone: fullPlaceData.phone,
          website: fullPlaceData.website,
          rating: fullPlaceData.rating,
          total_reviews: fullPlaceData.total_reviews,
          created_at: fullPlaceData.created_at,
          updated_at: fullPlaceData.updated_at,
          geometry: {
            location: {
              lat: fullPlaceData.latitude,
              lng: fullPlaceData.longitude,
            },
          },
        }

        setSelectedPlace(normalizedPlace)
        setShowReviews(true)
      } catch (error) {
        console.error("Error processing header place selection:", error)
      }
    } else {
      // Es un lugar de Google Maps, usar el flujo normal
      await handlePlaceSelect(place)
      setShowReviews(true)
    }
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

    // Ensure the place has all required fields
    const normalizedPlace = {
      id: place.id,
      google_place_id: place.google_place_id,
      place_id: place.google_place_id, // Add this for compatibility
      name: place.name,
      address: place.address,
      formatted_address: place.address, // Add this for compatibility
      latitude: place.latitude,
      longitude: place.longitude,
      phone: place.phone,
      website: place.website,
      rating: place.rating,
      total_reviews: place.total_reviews,
      geometry: {
        location: {
          lat: place.latitude,
          lng: place.longitude,
        },
      },
    }

    setPreSelectedPlaceForReview(normalizedPlace)
    goToReview()
  }

  const handleSubmitDetailedReview = async (reviewData: any) => {
    if (!currentUser) return

    setIsLoading(true)
    try {
      console.log("=== INICIO SUBMIT REVIEW ===")
      console.log("Review data recibida:", {
        place: reviewData.place?.name,
        photo_urls: reviewData.photo_urls,
        photo_urls_length: reviewData.photo_urls?.length || 0,
        vercel_blob_urls: reviewData.vercel_blob_urls,
      })

      // Enhanced validation
      if (!reviewData.place) {
        throw new Error("No se ha seleccionado ningún lugar")
      }

      if (!reviewData.place.google_place_id) {
        throw new Error("El lugar seleccionado no tiene un ID válido")
      }

      if (!reviewData.place.name) {
        throw new Error("El lugar seleccionado no tiene nombre")
      }

      if (!reviewData.place.address) {
        throw new Error("El lugar seleccionado no tiene dirección")
      }

      let placeId = reviewData.place.id

      if (!placeId || placeId.toString().startsWith("temp-")) {
        const { data: existingPlace, error: searchError } = await supabase
          .from("places")
          .select("id")
          .eq("google_place_id", reviewData.place.google_place_id)
          .single()

        if (searchError && searchError.code !== "PGRST116") {
          console.error("Error searching for existing place:", searchError)
          throw new Error("Error al buscar el lugar en la base de datos")
        }

        if (existingPlace) {
          placeId = existingPlace.id
        } else {
          const placeToInsert = {
            google_place_id: reviewData.place.google_place_id,
            name: reviewData.place.name,
            address: reviewData.place.address,
            latitude: reviewData.place.latitude || -32.9442426,
            longitude: reviewData.place.longitude || -60.6505388,
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
            throw new Error("Error al crear el lugar en la base de datos")
          }
          placeId = createdPlace.id
        }
      }

      // Check for existing review
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

      // Extract and validate photo URLs from the photo_urls array
      const photoUrls = reviewData.photo_urls || []
      console.log("Photo URLs extraídas:", photoUrls)

      // Validate that photo URLs are valid Vercel Blob URLs
      const validPhotoUrls = photoUrls.filter((url: string) => {
        if (!url || typeof url !== "string") return false

        // Check if it's a valid URL
        try {
          new URL(url)
        } catch {
          console.warn("URL inválida encontrada:", url)
          return false
        }

        // Check if it's a Vercel Blob URL or other valid image URL
        const isValidImageUrl =
          url.includes("blob.vercel-storage.com") || url.includes("supabase.co") || url.startsWith("http")

        if (!isValidImageUrl) {
          console.warn("URL no es una imagen válida:", url)
        }

        return isValidImageUrl
      })

      console.log("Photo URLs válidas:", validPhotoUrls)

      // Map up to 6 photos to individual columns
      const photo1Url = validPhotoUrls.length > 0 ? validPhotoUrls[0] : null
      const photo2Url = validPhotoUrls.length > 1 ? validPhotoUrls[1] : null
      const photo3Url = validPhotoUrls.length > 2 ? validPhotoUrls[2] : null
      const photo4Url = validPhotoUrls.length > 3 ? validPhotoUrls[3] : null
      const photo5Url = validPhotoUrls.length > 4 ? validPhotoUrls[4] : null
      const photo6Url = validPhotoUrls.length > 5 ? validPhotoUrls[5] : null

      console.log("Fotos mapeadas:", {
        photo1Url,
        photo2Url,
        photo3Url,
        photo4Url,
        photo5Url,
        photo6Url,
      })

      // Calculate points based on photos and other factors
      const hasPhotos = validPhotoUrls.length > 0
      const commentLength = reviewData.comment ? reviewData.comment.length : 0

      const { data: reviewCount } = await supabase
        .from("detailed_reviews")
        .select("id", { count: "exact" })
        .eq("place_id", placeId)

      const isFirstReview = (reviewCount?.length || 0) === 0

      const basePoints = 100
      const firstReviewBonus = isFirstReview ? 500 : 0
      const photoBonus = hasPhotos ? Math.min(validPhotoUrls.length * 25, 150) : 0 // 25 points per photo, max 150
      const extendedReviewBonus = commentLength >= 300 ? 50 : 0
      const totalPoints = basePoints + firstReviewBonus + photoBonus + extendedReviewBonus

      console.log("Puntos calculados:", {
        basePoints,
        firstReviewBonus,
        photoBonus,
        extendedReviewBonus,
        totalPoints,
        hasPhotos,
        photoCount: validPhotoUrls.length,
      })

      // Prepare review data with all photo fields
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
        photo_1_url: photo1Url,
        photo_2_url: photo2Url,
        photo_3_url: photo3Url,
        photo_4_url: photo4Url,
        photo_5_url: photo5Url,
        photo_6_url: photo6Url,
      }

      console.log("Datos de reseña a insertar:", {
        ...reviewToInsert,
        // Solo mostrar las URLs de fotos para debug
        photos: {
          photo_1_url: photo1Url,
          photo_2_url: photo2Url,
          photo_3_url: photo3Url,
          photo_4_url: photo4Url,
          photo_5_url: photo5Url,
          photo_6_url: photo6Url,
        },
      })

      // Insert the review
      const { data: insertedReview, error: insertError } = await supabase
        .from("detailed_reviews")
        .insert(reviewToInsert)
        .select("id")
        .single()

      if (insertError) {
        console.error("Error submitting detailed review:", insertError)
        throw new Error(`Error al guardar la reseña en la base de datos: ${insertError.message}`)
      }

      console.log("Reseña insertada exitosamente:", insertedReview)

      // If we have photos and the new photos system exists, also insert into review_photos table
      if (hasPhotos && insertedReview?.id) {
        try {
          const photoRecords = validPhotoUrls.map((photoUrl: string, index: number) => ({
            review_id: insertedReview.id,
            photo_url: photoUrl,
            is_primary: index === 0, // First photo is primary
            photo_order: index + 1,
          }))

          console.log("Insertando en review_photos:", photoRecords)

          const { error: photosError } = await supabase.from("review_photos").insert(photoRecords)

          if (photosError) {
            console.warn("Error inserting into review_photos table (may not exist):", photosError)
            // Don't throw error here as the main review was saved successfully
          } else {
            console.log("Fotos insertadas en review_photos exitosamente")
          }
        } catch (photosError) {
          console.warn("Review_photos table may not exist:", photosError)
          // Continue without throwing error
        }
      }

      // Check for achievements
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

      const photoMessage = hasPhotos
        ? ` (incluyendo ${validPhotoUrls.length} foto${validPhotoUrls.length > 1 ? "s" : ""})`
        : ""
      alert(`¡Reseña enviada exitosamente${photoMessage}! Ganaste ${totalPoints} puntos.`)

      console.log("=== FIN SUBMIT REVIEW EXITOSO ===")
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
    // Reset the profile review navigation
    setSelectedReviewId(null)
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
        onGoProfile={goToProfile}
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
        onAddReview={handleAddReview}
        onGoHome={goToHome}
        onGoReview={goToReview}
        onGoProfile={goToProfile}
      />
    )
  }

  if (showProfile && currentUser) {
    // If we have a selected review, show SingleReviewPage
    if (selectedReviewId) {
      return (
        <div className="min-h-screen bg-background">
          <Header
            user={currentUser}
            onViewProfile={goToProfile}
            onLogoClick={goToHome}
            onPlaceSelect={handleHeaderPlaceSelect}
            onNotificationClick={handleNotificationClick}
          />
            <SingleReviewPage
              reviewId={selectedReviewId}
              onBack={() => setSelectedReviewId(null)}
              onViewPlace={handleViewPlaceFromReview}
              onAddReview={handleAddReview}
              onGoHome={goToHome}
              onGoReview={goToReview}
              onGoProfile={goToProfile}
              onNotificationClick={handleNotificationClick}
            />
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

    // Otherwise show UserProfilePage
    return (
      <div className="min-h-screen bg-background">
        <Header
          user={currentUser}
          onViewProfile={goToProfile}
          onLogoClick={goToHome}
          onPlaceSelect={handleHeaderPlaceSelect}
          onNotificationClick={handleNotificationClick}
        />
        <main className="container mx-auto px-4 py-8 pt-20 pb-24">
          <UserProfilePage
            user={currentUser}
            onBack={() => setShowProfile(false)}
            onReviewClick={(reviewId) => setSelectedReviewId(reviewId)}
          />
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
              userId={currentUser?.id} // Pass undefined if no user, component will handle it
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
