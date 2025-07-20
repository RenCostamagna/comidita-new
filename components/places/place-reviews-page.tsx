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
  onNotificationClick?: (notification: any) => void
}

export function PlaceReviewsPage({
  place,
  onBack,
  onAddReview,
  currentUser,
  onGoHome,
  onGoReview,
  onGoProfile,
  onNotificationClick,
}: PlaceReviewsPageProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [detailedReviews, setDetailedReviews] = useState<DetailedReview[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    fetchReviews()
  }, [place.id, place.place_id])

  const fetchReviews = async () => {
    setIsLoading(true)
    try {
      console.log("Fetching reviews for place:", {
        id: place.id,
        place_id: place.place_id,
        google_place_id: place.google_place_id,
        name: place.name,
      })

      let internalPlaceId = null

      // Si place.id existe y es un número, usarlo directamente
      if (place.id && !isNaN(Number(place.id))) {
        internalPlaceId = Number(place.id)
        console.log("Using place.id as internal ID:", internalPlaceId)
      }
      // Si place.place_id es un número, es el ID interno directo
      else if (place.place_id && !isNaN(Number(place.place_id))) {
        internalPlaceId = Number(place.place_id)
        console.log("Using place.place_id as internal ID:", internalPlaceId)
      }
      // Si no, buscar por google_place_id
      else {
        const googlePlaceId = place.google_place_id || place.place_id
        console.log("Looking for google_place_id:", googlePlaceId)

        if (!googlePlaceId) {
          console.error("No google_place_id found")
          setReviews([])
          setDetailedReviews([])
          setIsLoading(false)
          return
        }

        const { data: placeData, error: placeError } = await supabase
          .from("places")
          .select("id")
          .eq("google_place_id", googlePlaceId)
          .single()

        if (placeError || !placeData) {
          console.error("Error fetching place:", placeError)
          setReviews([])
          setDetailedReviews([])
          setIsLoading(false)
          return
        }

        internalPlaceId = placeData.id
        console.log("Found internal place ID via google_place_id:", internalPlaceId)
      }

      // Obtener reseñas simples usando el ID interno
      const { data: reviewsData, error } = await supabase
        .from("reviews")
        .select(`
          *,
          user:users(*)
        `)
        .eq("place_id", internalPlaceId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching reviews:", error)
        setReviews([])
      } else {
        console.log("Found reviews:", reviewsData?.length || 0)
        setReviews(reviewsData || [])
      }

      // Obtener reseñas detalladas usando el ID interno
      const { data: detailedReviewsData, error: detailedError } = await supabase
        .from("detailed_reviews")
        .select(`
          *,
          user:users(*)
        `)
        .eq("place_id", internalPlaceId)
        .order("created_at", { ascending: false })

      if (detailedError) {
        console.error("Error fetching detailed reviews:", detailedError)
        setDetailedReviews([])
      } else {
        console.log("Found detailed reviews:", detailedReviewsData?.length || 0)
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

  const handleHeaderPlaceSelect = async (selectedPlace: any) => {
    if (onGoHome) {
      onGoHome()
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
        onNotificationClick={onNotificationClick}
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

      <BottomNavigation
        currentPage="home"
        onGoHome={onGoHome}
        onGoReview={onGoReview}
        onGoProfile={onGoProfile || (() => {})}
      />
    </div>
  )
}
