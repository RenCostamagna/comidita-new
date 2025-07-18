import { Star, Calendar, Utensils, DollarSign, ImageIcon } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { PRICE_RANGES, RESTAURANT_CATEGORIES } from "@/lib/types"
import { getRatingColor } from "@/lib/rating-labels"
import type { DetailedReview } from "@/lib/types"

interface DetailedReviewCardProps {
  review: DetailedReview
}

export function DetailedReviewCard({ review }: DetailedReviewCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-AR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Labels actualizados sin las opciones dietéticas
  const ratingLabels = {
    food_taste: "Sabor",
    presentation: "Presentación",
    portion_size: "Porción",
    drinks_variety: "Bebidas",
    music_acoustics: "Música",
    ambiance: "Ambiente",
    furniture_comfort: "Confort",
    cleanliness: "Limpieza",
    service: "Servicio",
  }

  // Calcular promedio con los 9 campos actualizados
  const averageRating =
    Object.values(ratingLabels).reduce((sum, _, index) => {
      const key = Object.keys(ratingLabels)[index] as keyof typeof ratingLabels
      return sum + review[key]
    }, 0) / Object.keys(ratingLabels).length

  // Obtener fotos - priorizar nueva estructura, fallback a campos legacy
  const getReviewPhotos = () => {
    if (review.photos && review.photos.length > 0) {
      return review.photos.sort((a, b) => {
        if (a.is_primary && !b.is_primary) return -1
        if (!a.is_primary && b.is_primary) return 1
        return a.photo_order - b.photo_order
      })
    }

    // Fallback a campos legacy
    const legacyPhotos = []
    if (review.photo_1_url) {
      legacyPhotos.push({ photo_url: review.photo_1_url, is_primary: true, photo_order: 1 })
    }
    if (review.photo_2_url && review.photo_2_url !== review.photo_1_url) {
      legacyPhotos.push({ photo_url: review.photo_2_url, is_primary: false, photo_order: 2 })
    }
    return legacyPhotos
  }

  const photos = getReviewPhotos()
  const primaryPhoto = photos.find((p) => p.is_primary) || photos[0]
  const otherPhotos = photos.filter((p) => !p.is_primary)

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={review.user?.avatar_url || "/placeholder.svg"} />
            <AvatarFallback>{review.user?.full_name?.charAt(0) || review.user?.email?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="font-medium truncate">{review.user?.full_name || "Usuario anónimo"}</h4>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">{averageRating.toFixed(1)}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Calendar className="h-3 w-3" />
              {formatDate(review.created_at)}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Plato y detalles */}
        <div className="flex flex-wrap gap-2">
          {review.dish_name && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Utensils className="h-3 w-3" />
              {review.dish_name}
            </Badge>
          )}
          <Badge variant="outline" className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            {PRICE_RANGES[review.price_range as keyof typeof PRICE_RANGES]}
          </Badge>
          <Badge variant="outline">
            {RESTAURANT_CATEGORIES[review.restaurant_category as keyof typeof RESTAURANT_CATEGORIES]}
          </Badge>
        </div>

        {/* Opciones dietéticas - NUEVOS BADGES INFORMATIVOS */}
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

        {/* Fotos mejoradas */}
        {photos.length > 0 && (
          <div className="space-y-3">
            {/* Foto principal */}
            {primaryPhoto && (
              <div className="relative">
                <div className="aspect-video max-w-sm mx-auto">
                  <img
                    src={primaryPhoto.photo_url || "/placeholder.svg"}
                    alt="Foto principal de la reseña"
                    className="w-full h-full object-cover rounded-lg"
                    crossOrigin="anonymous"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = "/placeholder.svg?height=300&width=300&text=Error+cargando+imagen"
                    }}
                  />
                </div>
              </div>
            )}

            {/* Otras fotos en grid */}
            {otherPhotos.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {otherPhotos.slice(0, 5).map((photo, index) => (
                  <div key={index} className="aspect-square">
                    <img
                      src={photo.photo_url || "/placeholder.svg"}
                      alt={`Foto adicional ${index + 1}`}
                      className="w-full h-full object-cover rounded-md"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = "/placeholder.svg?height=150&width=150&text=Error"
                      }}
                    />
                  </div>
                ))}

                {/* Indicador de más fotos */}
                {otherPhotos.length > 5 && (
                  <div className="aspect-square bg-muted/50 rounded-md flex items-center justify-center">
                    <div className="text-center">
                      <ImageIcon className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                      <span className="text-xs text-muted-foreground">+{otherPhotos.length - 5}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Puntuaciones detalladas - CAMPOS ACTUALIZADOS */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {Object.entries(ratingLabels).map(([key, label]) => {
            const rating = review[key as keyof typeof review] as number
            const ratingColor = getRatingColor(rating)

            return (
              <div key={key} className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{label}</span>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{rating}/10</span>
                  </div>
                </div>
                <Progress value={rating * 10} className="h-2" />
              </div>
            )
          })}
        </div>

        {/* Comentario */}
        {review.comment && (
          <div className="pt-2 border-t">
            <p className="text-sm leading-relaxed">{review.comment}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
