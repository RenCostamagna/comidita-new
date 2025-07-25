"use client"

import { Calendar, Star, DollarSign, Utensils } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { PRICE_RANGES, RESTAURANT_CATEGORIES } from "@/lib/types"
import { getRatingColor } from "@/lib/rating-labels"
import type { DetailedReview } from "@/lib/types"

interface DetailedReviewCardProps {
  review: DetailedReview
  onPhotoClick?: (photoIndex: number) => void
}

export function DetailedReviewCard({ review, onPhotoClick }: DetailedReviewCardProps) {
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

  const averageRating = calculateAverageRating(review)
  const photos = getReviewPhotos()
  const primaryPhoto = photos.find((p) => p.is_primary) || photos[0]
  const otherPhotos = photos.filter((p) => !p.is_primary)

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        {/* User info and rating */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={review.user?.avatar_url || "/placeholder.svg"} alt={review.user?.full_name} />
              <AvatarFallback className="text-xs">
                {review.user?.full_name?.charAt(0) || review.user?.email?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">{review.user?.full_name || "Usuario anónimo"}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {formatDate(review.created_at)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-semibold">{averageRating.toFixed(1)}</span>
          </div>
        </div>

        {/* Dish info */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
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
          <span className="text-xs">
            {RESTAURANT_CATEGORIES[review.restaurant_category as keyof typeof RESTAURANT_CATEGORIES]}
          </span>
        </div>

        {/* Opciones dietéticas */}
        {(review.celiac_friendly || review.vegetarian_friendly) && (
          <div className="flex flex-wrap gap-2">
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

        {/* Photos - Carrusel horizontal */}
        {photos.length > 0 && (
          <div className="space-y-3">
            <div className="relative">
              {/* Contenedor del carrusel */}
              <div className="overflow-x-auto scrollbar-hide">
                <div className="flex gap-3 pb-2" style={{ width: "max-content" }}>
                  {photos.map((photo, index) => (
                    <div
                      key={index}
                      className="flex-shrink-0 w-48 aspect-video cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => onPhotoClick?.(index)}
                    >
                      <img
                        src={photo.photo_url || "/placeholder.svg"}
                        alt={`Foto ${index + 1} de la reseña`}
                        className="w-full h-full object-cover rounded-lg"
                        crossOrigin="anonymous"
                        onError={(e) => {
                          console.error(`Error cargando foto ${index + 1}:`, photo.photo_url)
                          const target = e.target as HTMLImageElement
                          target.src = "/placeholder.svg?height=108&width=192&text=Error+cargando+imagen"
                        }}
                      />
                      {/* Indicador de foto principal */}
                      {photo.is_primary && (
                        <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                          Principal
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Indicador de scroll si hay muchas fotos */}
              {photos.length > 2 && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 bg-gradient-to-l from-white via-white to-transparent dark:from-gray-950 dark:via-gray-950 w-8 h-full pointer-events-none flex items-center justify-end pr-1">
                  <div className="w-1 h-8 bg-gradient-to-b from-transparent via-gray-300 to-transparent dark:via-gray-600 rounded-full opacity-60"></div>
                </div>
              )}
            </div>

            {/* Contador de fotos */}
            <div className="text-center text-xs text-muted-foreground">
              {photos.length} foto{photos.length > 1 ? "s" : ""} • Toca para ampliar
            </div>
          </div>
        )}

        {/* Rating categories - CAMPOS ACTUALIZADOS */}
        <div className="grid grid-cols-2 gap-3">
          {ratingCategories.map((category) => {
            const rating = review[category.key as keyof DetailedReview] as number
            const ratingColor = getRatingColor(rating)

            return (
              <div key={category.key} className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">{category.label}</span>
                  <span className="text-xs font-medium">{rating}/10</span>
                </div>
                <Progress value={rating * 10} className="h-1.5" />
              </div>
            )
          })}
        </div>

        {/* Comment */}
        {review.comment && (
          <div className="pt-2 border-t">
            <p className="text-sm leading-relaxed text-muted-foreground">{review.comment}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Agregar estilos para ocultar scrollbar
const styles = `
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`

// Inyectar estilos si no existen
if (typeof document !== "undefined" && !document.getElementById("scrollbar-hide-styles")) {
  const styleSheet = document.createElement("style")
  styleSheet.id = "scrollbar-hide-styles"
  styleSheet.textContent = styles
  document.head.appendChild(styleSheet)
}
