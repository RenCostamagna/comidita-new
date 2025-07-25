"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ReviewCard } from "@/components/reviews/review-card"
import { DetailedReviewCard } from "@/components/reviews/detailed-review-card"
import { PhotoModal } from "@/components/photos/photo-modal"
import { createClient } from "@/lib/supabase/client"
import type { Place, Review, DetailedReview } from "@/lib/types"

interface PlaceReviewsPageProps {
  place: Place
  onAddReview: (place: Place) => void
  currentUser: any
  onViewReview?: (reviewId: string) => void
}

export function PlaceReviewsPage({ place, onAddReview, currentUser, onViewReview }: PlaceReviewsPageProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [detailedReviews, setDetailedReviews] = useState<DetailedReview[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false)
  const [selectedPhotos, setSelectedPhotos] = useState<
    Array<{ photo_url: string; is_primary?: boolean; photo_order?: number }>
  >([])
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

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
          user:users(*),
          photos:review_photos(*)
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

  const handlePhotoClick = (review: DetailedReview, photoIndex: number) => {
    // Obtener fotos de la reseña
    const photos = getReviewPhotos(review)
    setSelectedPhotos(photos)
    setSelectedImageIndex(photoIndex)
    setIsPhotoModalOpen(true)
  }

  const getReviewPhotos = (review: DetailedReview) => {
    if (review?.photos && review.photos.length > 0) {
      return review.photos
        .filter((photo) => photo.photo_url)
        .sort((a, b) => {
          if (a.is_primary && !b.is_primary) return -1
          if (!a.is_primary && b.is_primary) return 1
          return a.photo_order - b.photo_order
        })
    }

    // Fallback a campos legacy
    const legacyPhotos = []
    const legacyFields = ["photo_1_url", "photo_2_url", "photo_3_url", "photo_4_url", "photo_5_url", "photo_6_url"]

    legacyFields.forEach((field, index) => {
      const photoUrl = review[field as keyof typeof review] as string
      if (photoUrl && photoUrl.trim() && !legacyPhotos.some((p) => p.photo_url === photoUrl.trim())) {
        legacyPhotos.push({
          photo_url: photoUrl.trim(),
          is_primary: index === 0,
          photo_order: index + 1,
        })
      }
    })

    return legacyPhotos
  }

  const closePhotoModal = () => {
    setIsPhotoModalOpen(false)
    setSelectedPhotos([])
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Cargando reseñas...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
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
              <DetailedReviewCard
                key={review.id}
                review={review}
                onPhotoClick={(photoIndex) => handlePhotoClick(review, photoIndex)}
                onViewReview={onViewReview}
              />
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

      {/* Photo Modal */}
      <PhotoModal
        photos={selectedPhotos}
        isOpen={isPhotoModalOpen}
        initialIndex={selectedImageIndex}
        onClose={closePhotoModal}
      />
    </div>
  )
}
