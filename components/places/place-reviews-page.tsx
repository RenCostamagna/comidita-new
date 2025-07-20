"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ReviewCard } from "@/components/reviews/review-card"
import { DetailedReviewCard } from "@/components/reviews/detailed-review-card"
import { createClient } from "@/lib/supabase/client"
import type { Place, Review, DetailedReview } from "@/lib/types"
import { Header } from "@/components/layout/header"
import { BottomNavigation } from "@/components/layout/bottom-navigation"

interface PlaceReviewsPageProps {
  place: Place
  onBack: () => void
  onAddReview: (place: Place) => void
  currentUser: any
  onGoHome?: () => void
  onGoReview?: () => void
  onGoProfile?: () => void
  onNotificationClick?: (notification: any) => void // Nueva prop
}

export function PlaceReviewsPage({
  place,
  onBack,
  onAddReview,
  currentUser,
  onGoHome,
  onGoReview,
  onGoProfile,
  onNotificationClick, // Nueva prop
}: PlaceReviewsPageProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [detailedReviews, setDetailedReviews] = useState<DetailedReview[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    fetchReviews()
  }, [place.id])

  const fetchReviews = async () => {
    setIsLoading(true)
    try {
      // Obtener reseñas simples
      const { data: reviewsData, error } = await supabase
        .from("reviews")
        .select(`
          *,
          user:users(*)
        `)
        .eq("place_id", place.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching reviews:", error)
        setReviews([])
      } else {
        setReviews(reviewsData || [])
      }

      // Obtener reseñas detalladas
      const { data: detailedReviewsData, error: detailedError } = await supabase
        .from("detailed_reviews")
        .select(`
          *,
          user:users(*)
        `)
        .eq("place_id", place.id)
        .order("created_at", { ascending: false })

      if (detailedError) {
        console.error("Error fetching detailed reviews:", detailedError)
        setDetailedReviews([])
      } else {
        setDetailedReviews(detailedReviewsData || [])
      }
    } catch (error) {
      console.error("Error fetching reviews:", error)
      setReviews([])
      setDetailedReviews([])
    } finally {
      setIsLoading(false)
    }
  }

  // Nueva función para manejar selección desde el header
  const handleHeaderPlaceSelect = async (selectedPlace: any) => {
    // Navegar a las reseñas del lugar seleccionado
    if (onGoHome) {
      onGoHome() // Esto debería manejar la navegación en el componente padre
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header showBackButton={true} onBack={onBack} user={currentUser} onPlaceSelect={handleHeaderPlaceSelect} />
        <main className="container mx-auto px-4 py-8 pt-20">
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Cargando reseñas...</div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        showBackButton={true}
        onBack={onBack}
        user={currentUser}
        onPlaceSelect={handleHeaderPlaceSelect}
        onNotificationClick={onNotificationClick} // Pasar la prop
      />

      <main className="container mx-auto px-4 py-6 pt-20 max-w-2xl pb-24">
        <Card>
          <CardHeader>
            <CardTitle>Reseñas de {place.name}</CardTitle>
            <CardDescription>
              {reviews.length + detailedReviews.length}{" "}
              {reviews.length + detailedReviews.length === 1 ? "reseña" : "reseñas"}
            </CardDescription>
          </CardHeader>
        </Card>
        <div className="space-y-4 mt-6">
          {detailedReviews.length > 0 || reviews.length > 0 ? (
            <>
              {detailedReviews.map((review) => (
                <DetailedReviewCard key={review.id} review={review} />
              ))}
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">Aún no hay reseñas para este lugar.</p>
                {currentUser && (
                  <Button className="mt-4" onClick={() => onAddReview(place)}>
                    Ser el primero en reseñar
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation
        currentPage="home"
        onGoHome={onGoHome}
        onGoReview={onGoReview}
        onGoProfile={onGoProfile || (() => {})}
      />
    </div>
  )
}
