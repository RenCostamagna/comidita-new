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

  // Nuevo estado para rastrear la navegación
  const [navigationHistory, setNavigationHistory] = useState<{
    cameFromReview?: string // ID de la reseña desde la que se navegó
  }>({})

  // Estado para usuario de prueba
  const [testUser, setTestUser] = useState<any>(null)

  // Usuario actual (real o de prueba)
  const currentUser = initialUser || testUser

  const supabase = createClient()

  // Función para login de prueba
  const handleTestLogin = async () => {
    const testUserData = {
      id: "test-user-123",
      email: "usuario@prueba.com",
      user_metadata: {
        full_name: "Usuario de Prueba",
        avatar_url: "/placeholder.svg?height=40&width=40",
      },
    }

    // Crear usuario de prueba en la base de datos si no existe
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

  // Función para ir al inicio
  const goToHome = () => {
    resetView()
  }

  // Función para ver perfil
  const goToProfile = () => {
    resetView()
    setShowProfile(true)
  }

  // Función específica para ir a reseñar - MODIFICADA para no resetear
  const goToReview = () => {
    // NO llamar resetView() aquí para preservar preSelectedPlaceForReview
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

    // Establecer el formulario de reseña
    setShowDetailedReviewForm(true)
  }

  // Función para manejar selección de categoría
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category)
    setShowCategoryPlaces(true)
  }

  // Función para mostrar todas las categorías
  const handleViewAllCategories = () => {
    setShowAllCategories(true)
  }

  // Nueva función para manejar selección desde el header
  const handleHeaderPlaceSelect = async (place: any) => {
    // Procesar el lugar seleccionado
    await handlePlaceSelect(place)
    // Ir directamente a las reseñas del lugar
    setShowReviews(true)
  }

  const handlePlaceSelect = async (googlePlace: any) => {
    setIsLoading(true)
    try {
      // Si es un lugar de la base de datos (viene de TopRatedPlaces)
      if (googlePlace.id && !googlePlace.google_place_id.startsWith("temp")) {
        setSelectedPlace(googlePlace)
        setIsLoading(false)
        return
      }

      // Verificar si el lugar ya existe en nuestra base de datos
      const { data: existingPlace } = await supabase
        .from("places")
        .select("*")
        .eq("google_place_id", googlePlace.google_place_id)
        .single()

      if (existingPlace) {
        setSelectedPlace(existingPlace)
      } else {
        // Crear nuevo lugar en la base de datos
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
          // Si falla la creación, usar datos temporales
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

    // Normalizar el lugar para el formulario de reseña
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

    // PRIMERO establecer el lugar preseleccionado
    setPreSelectedPlaceForReview(normalizedPlace)

    // LUEGO ir a la pestaña de reseñar
    goToReview()
  }

  // Actualizar la función handleSubmitDetailedReview para usar el nuevo sistema de puntos

  const handleSubmitDetailedReview = async (reviewData: any) => {
    if (!currentUser) return

    setIsLoading(true)
    try {
      // Validar datos del lugar
      if (!reviewData.place || !reviewData.place.google_place_id) {
        throw new Error("Datos del lugar incompletos")
      }

      // Primero, verificar si el lugar ya existe en la base de datos
      let placeId = reviewData.place.id

      // Si no tenemos un ID válido o es temporal, buscar/crear el lugar
      if (!placeId || placeId.startsWith("temp-")) {
        // Buscar si el lugar ya existe por google_place_id
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
          // El lugar no existe, crear uno nuevo
          const placeToInsert = {
            google_place_id: reviewData.place.google_place_id,
            name: reviewData.place.name,
            address: reviewData.place.address,
            latitude: reviewData.longitude,
            longitude: reviewData.longitude,
            phone: reviewData.phone,
            website: reviewData.website,
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

      // Verificar si el usuario ya tiene una reseña para este lugar
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

      // Calcular el desglose de puntos ANTES de insertar la reseña
      const hasPhotos = !!(reviewData.photo_1_url || reviewData.photo_2_url)
      const commentLength = reviewData.comment ? reviewData.comment.length : 0

      // Verificar si es primera reseña del lugar
      const { data: reviewCount } = await supabase
        .from("detailed_reviews")
        .select("id", { count: "exact" })
        .eq("place_id", placeId)

      const isFirstReview = (reviewCount?.length || 0) === 0

      // Calcular puntos según el nuevo sistema
      const basePoints = 100
      const firstReviewBonus = isFirstReview ? 500 : 0
      const photoBonus = hasPhotos ? 50 : 0
      const extendedReviewBonus = commentLength >= 300 ? 50 : 0
      const totalPoints = basePoints + firstReviewBonus + photoBonus + extendedReviewBonus

      // Insertar la reseña detallada
      const reviewToInsert = {
        user_id: currentUser.id,
        place_id: placeId,
        dish_name: reviewData.dish_name,
        food_taste: reviewData.food_taste,
        presentation: reviewData.presentation,
        portion_size: reviewData.portion_size,
        drinks_variety: reviewData.drinks_variety,
        veggie_options: reviewData.veggie_options,
        gluten_free_options: reviewData.gluten_free_options,
        vegan_options: reviewData.vegan_options,
        music_acoustics: reviewData.music_acoustics,
        ambiance: reviewData.ambiance,
        furniture_comfort: reviewData.furniture_comfort,
        cleanliness: reviewData.cleanliness,
        service: reviewData.service,
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

      // Verificar logros desbloqueados después de insertar la reseña
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

      // Mostrar toast con desglose de puntos
      const pointsBreakdown = {
        base_points: basePoints,
        first_review_bonus: firstReviewBonus,
        photo_bonus: photoBonus,
        extended_review_bonus: extendedReviewBonus,
        total_points: totalPoints,
        is_first_review: isFirstReview,
        has_photos: hasPhotos,
        is_extended_review: commentLength >= 300,
      }

      // Aquí podrías mostrar el PointsEarnedToast con el desglose
      // setPointsEarnedToast(pointsBreakdown)

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
    setNavigationHistory({}) // Limpiar historial de navegación
  }

  const handleReviewSelect = (reviewId: string) => {
    setSelectedReviewId(reviewId)
    setShowSingleReview(true)
  }

  // Handle place navigation from single review page
  const handleViewPlaceFromReview = (place: Place) => {
    // Guardar el ID de la reseña desde la que se navega
    setNavigationHistory({ cameFromReview: selectedReviewId })
    setSelectedPlace(place)
    setShowReviews(true)
    setShowSingleReview(false)
    setSelectedReviewId(null)
  }

  // Función para manejar el botón "atrás" en PlaceReviewsPage
  const handleBackFromPlaceReviews = () => {
    if (navigationHistory.cameFromReview) {
      // Si vinimos de una reseña, volver a esa reseña
      setSelectedReviewId(navigationHistory.cameFromReview)
      setShowSingleReview(true)
      setShowReviews(false)
      setSelectedPlace(null)
      setNavigationHistory({}) // Limpiar historial
    } else if (showCategoryPlaces && selectedCategory) {
      // Si vinimos de la página de categorías, volver a esa página
      setShowReviews(false)
      setSelectedPlace(null)
      // Keep showCategoryPlaces and selectedCategory to return to category page
    } else {
      // Si no vinimos de una reseña ni de categorías, ir al inicio
      resetView()
    }
  }

  // Si estamos viendo todas las categorías
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

  // Si estamos viendo las reseñas de un lugar (MOVER ESTA CONDICIÓN ARRIBA)
  if (showReviews && selectedPlace) {
    return (
      <PlaceReviewsPage
        place={selectedPlace}
        onBack={handleBackFromPlaceReviews} // Usar la nueva función de navegación
        onAddReview={handleAddReview}
        currentUser={currentUser}
        onGoHome={goToHome}
        onGoSearch={goToProfile}
        onGoReview={goToReview}
      />
    )
  }

  // Si estamos viendo una sola reseña
  if (showSingleReview && selectedReviewId) {
    return (
      <SingleReviewPage
        reviewId={selectedReviewId}
        onBack={() => {
          setShowSingleReview(false)
          setSelectedReviewId(null)
        }}
        onViewPlace={handleViewPlaceFromReview}
        onGoHome={goToHome}
        onGoReview={goToReview}
        onGoProfile={goToProfile}
      />
    )
  }

  // Si estamos viendo el perfil
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
        {/* Bottom Navigation for Profile */}
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

  // Si estamos viendo lugares por categoría (MOVER ESTA CONDICIÓN ABAJO)
  if (showCategoryPlaces && selectedCategory) {
    return (
      <CategoryPlacesPage
        selectedCategory={selectedCategory}
        onBack={() => {
          setShowCategoryPlaces(false)
          setSelectedCategory("")
        }}
        onPlaceSelect={(place) => {
          // Set the selected place and show reviews
          setSelectedPlace(place)
          setShowReviews(true)
          // Don't reset the category view state yet, we'll handle it in the back navigation
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
              onViewAllAchievements={() => setShowProfile(true)} // Navigate to profile achievements tab
              onAchievementSelect={(achievement) => {
                // Could navigate to specific category or show achievement details
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
