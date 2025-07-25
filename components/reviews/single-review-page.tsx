"use client"

import { useState, useEffect } from "react"
import { Calendar, Star, DollarSign, Utensils, MapPin } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { PhotoModal } from "@/components/photos/photo-modal"
import { createClient } from "@/lib/supabase/client"
import { PRICE_RANGES, RESTAURANT_CATEGORIES } from "@/lib/types"
import { getRatingColor } from "@/lib/rating-labels"
import type { DetailedReview } from "@/lib/types"

interface SingleReviewPageProps {
  reviewId: string
  onViewPlace?: (place: any) => void
  onAddReview?: (place: any) => void
}

export function SingleReviewPage({ reviewId, onViewPlace, onAddReview }: SingleReviewPageProps) {
  const [review, setReview] = useState<DetailedReview | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  const supabase = createClient()

  useEffect(() => {
    fetchReview()
  }, [reviewId])

  const fetchReview = async () => {
    try {
      const { data, error } = await supabase
        .from("detailed_reviews")
        .select(`
          *,
          user:users(*),
          place:places(*),
          photos:review_photos(*)
        `)
        .eq("id", reviewId)
        .single()

      if (error) {
        console.error("Error fetching review:", error)
        setReview(null)
      } else {
        setReview(data)
      }
    } catch (error) {
      console.error("Error fetching review:", error)
      setReview(null)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-AR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  const calculateAverageRating = (review: DetailedReview) => {
    // Calcular promedio con los 7 campos actualizados
    const ratings = [
      review.food_taste,
      review.presentation,
      review.portion_size,
      review.music_acoustics,
      review.ambiance,
      review.furniture_comfort,
      review.service,
    ]
    return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
  }

  const handleViewPlace = () => {
    if (review?.place && onViewPlace) {
      onViewPlace(review.place)
    }
  }

  const handleAddReview = () => {
    if (review?.place && onAddReview) {
      onAddReview(review.place)
    }
  }

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index)
    setIsPhotoModalOpen(true)
  }

  const closePhotoModal = () => {
    setIsPhotoModalOpen(false)
  }

  // Obtener fotos - priorizar nueva estructura, fallback a campos legacy
  const getReviewPhotos = () => {
    if (review?.photos && review.photos.length > 0) {
      return review.photos
        .filter((photo) => photo.photo_url) // Filtrar fotos sin URL
        .sort((a, b) => {
          if (a.is_primary && !b.is_primary) return -1
          if (!a.is_primary && b.is_primary) return 1
          return a.photo_order - b.photo_order
        })
    }

    // Fallback a campos legacy - CONSIDERAR TODOS LOS CAMPOS DE FOTO
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

  // Categorías de rating actualizadas - SOLO 7 CAMPOS ACTIVOS
  const ratingCategories = [
    { key: "food_taste", label: "Sabor" },
    { key: "presentation", label: "Presentación" },
    { key: "portion_size", label: "Porción" },
    { key: "music_acoustics", label: "Música" },
    { key: "ambiance", label: "Ambiente" },
    { key: "furniture_comfort", label: "Confort" },
    { key: "service", label: "Servicio" },
  ]

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Cargando reseña...</div>
        </div>
      </div>
    )
  }

  if (!review) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">No se pudo cargar la reseña</div>
        </div>
      </div>
    )
  }

  const averageRating = calculateAverageRating(review)
  const averageRatingColor = getRatingColor(Math.round(averageRating))
  const photos = getReviewPhotos()
  const primaryPhoto = photos.find((p) => p.is_primary) || photos[0]
  const otherPhotos = photos.filter((p) => !p.is_primary)

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Place info with rating */}
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="font-semibold text-lg">{review.place?.name}</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <MapPin className="h-4 w-4" />
                  <span>{review.place?.address}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="text-xl font-semibold">{averageRating.toFixed(1)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleViewPlace}
                size="sm"
                variant="outline"
                className="flex-1 flex items-center gap-1 bg-transparent"
              >
                Ver lugar
              </Button>
              <Button onClick={handleAddReview} size="sm" className="flex-1 flex items-center gap-1">
                Reseñar
              </Button>
            </div>

            <div className="text-center">
              <span className="text-sm text-muted-foreground">
                {RESTAURANT_CATEGORIES[review.restaurant_category as keyof typeof RESTAURANT_CATEGORIES]}
              </span>
            </div>
          </div>

          {/* Dish info */}
          <div className="flex flex-wrap items-center gap-4 py-3 border-t border-b text-sm text-muted-foreground">
            {review.dish_name && (
              <div className="flex items-center gap-1">
                <Utensils className="h-4 w-4" />
                <span>{review.dish_name}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              <span>{PRICE_RANGES[review.price_range as keyof typeof PRICE_RANGES]}</span>
            </div>
          </div>

          {/* User info */}
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={review.user?.avatar_url || "/placeholder.svg"} alt={review.user?.full_name} />
              <AvatarFallback className="text-xs">
                {review.user?.full_name?.charAt(0) || review.user?.email?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium text-sm">{review.user?.full_name || "Usuario anónimo"}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {formatDate(review.created_at)}
              </div>
            </div>
          </div>

          {/* Opciones dietéticas - NUEVOS BADGES INFORMATIVOS */}
          {(review.celiac_friendly || review.vegetarian_friendly) && (
            <div className="flex flex-wrap gap-2 py-2 border-t border-b">
              {review.celiac_friendly && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
                  🌾 Celíaco friendly
                </Badge>
              )}
              {review.vegetarian_friendly && (
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200"
                >
                  🥬 Vegetariano friendly
                </Badge>
              )}
            </div>
          )}

          {/* Comment */}
          {review.comment && (
            <div>
              <h3 className="font-medium mb-2">Comentario</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{review.comment}</p>
            </div>
          )}

          {/* Photos en carrusel horizontal */}
          {photos.length > 0 && (
            <div className="space-y-3">
              <div className="relative">
                <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                  {photos.map((photo, index) => (
                    <div key={index} className="flex-shrink-0 relative">
                      <div className="w-64 aspect-video">
                        <img
                          src={photo.photo_url || "/placeholder.svg"}
                          alt={`Foto ${index + 1} de la reseña`}
                          className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
                          crossOrigin="anonymous"
                          onClick={() => handleImageClick(index)}
                          onError={(e) => {
                            console.error(`Error cargando foto ${index + 1}:`, photo.photo_url)
                            const target = e.target as HTMLImageElement
                            target.src = "/placeholder.svg?height=180&width=256&text=Error+cargando+imagen"
                          }}
                          onLoad={() => {
                            console.log(`✅ Foto ${index + 1} cargada:`, photo.photo_url)
                          }}
                        />
                      </div>
                      {photo.is_primary && (
                        <div className="absolute top-2 left-2">
                          <Badge
                            variant="secondary"
                            className="text-white text-xs px-2 py-1 opacity-100 bg-transparent"
                          >
                            Plato
                          </Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Gradiente indicador de scroll */}
                {photos.length > 2 && (
                  <div className="absolute top-0 right-0 w-8 h-full bg-gradient-to-l from-background to-transparent pointer-events-none rounded-r-lg" />
                )}
              </div>

              <div className="text-center text-xs text-muted-foreground">
                {photos.length} foto{photos.length > 1 ? "s" : ""} • Desliza para ver más • Toca para ampliar
              </div>
            </div>
          )}

          {/* Rating categories - CAMPOS ACTUALIZADOS */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {ratingCategories.map((category) => {
                const rating = review[category.key as keyof DetailedReview] as number
                const ratingColor = getRatingColor(rating)

                return (
                  <div key={category.key} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{category.label}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium">{rating}/10</span>
                      </div>
                    </div>
                    <Progress value={rating * 10} className="h-2" />
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Photo Modal */}
      <PhotoModal
        photos={photos}
        isOpen={isPhotoModalOpen}
        initialIndex={selectedImageIndex}
        onClose={closePhotoModal}
      />
    </div>
  )
}
