import { Star, Calendar, Utensils, DollarSign } from "lucide-react"
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

  const ratingLabels = {
    food_taste: "Sabor",
    presentation: "Presentación",
    portion_size: "Porción",
    drinks_variety: "Bebidas",
    veggie_options: "Veggies",
    gluten_free_options: "Sin TACC",
    vegan_options: "Veganos",
    music_acoustics: "Música",
    ambiance: "Ambiente",
    furniture_comfort: "Confort",
    cleanliness: "Limpieza",
    service: "Servicio",
  }

  const averageRating =
    Object.values(ratingLabels).reduce((sum, _, index) => {
      const key = Object.keys(ratingLabels)[index] as keyof typeof ratingLabels
      return sum + review[key]
    }, 0) / Object.keys(ratingLabels).length

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

        {/* Fotos */}
        {(review.photo_1_url || review.photo_2_url) && (
          <div className="grid grid-cols-2 gap-2">
            {review.photo_1_url && (
              <div className="aspect-square">
                <img
                  src={review.photo_1_url || "/placeholder.svg"}
                  alt="Foto de la reseña 1"
                  className="w-full h-full object-cover rounded-md"
                />
              </div>
            )}
            {review.photo_2_url && (
              <div className="aspect-square">
                <img
                  src={review.photo_2_url || "/placeholder.svg"}
                  alt="Foto de la reseña 2"
                  className="w-full h-full object-cover rounded-md"
                />
              </div>
            )}
          </div>
        )}

        {/* Puntuaciones detalladas */}
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
