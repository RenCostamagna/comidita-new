"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star } from "lucide-react"
import type { DetailedReview } from "@/lib/types"

interface ProfileReviewCardProps {
  review: DetailedReview
  onViewReview: (review: DetailedReview) => void
}

export function ProfileReviewCard({ review, onViewReview }: ProfileReviewCardProps) {
  // Calculate overall rating
  const calculateOverallRating = (review: DetailedReview) => {
    const ratings = [
      review.food_taste,
      review.presentation,
      review.portion_size,
      review.drinks_variety,
      review.veggie_options,
      review.gluten_free_options,
      review.vegan_options,
      review.music_acoustics,
      review.ambiance,
      review.furniture_comfort,
      review.cleanliness,
      review.service,
    ].filter((rating) => rating != null && !isNaN(rating))

    if (ratings.length === 0) return 0
    return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
  }

  const overallRating = calculateOverallRating(review)

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="relative">
          {/* Rating in top right corner */}
          <div className="absolute top-0 right-0 flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium text-sm">{overallRating.toFixed(1)}</span>
          </div>

          <div className="pr-16">
            {/* Place name */}
            <h3 className="font-semibold text-lg truncate">{review.place?.name || "Lugar desconocido"}</h3>

            {/* Dish name */}
            <p className="text-muted-foreground text-sm truncate mt-1">{review.dish_name}</p>

            {/* Date */}
            <p className="text-xs text-muted-foreground mt-2">
              {new Date(review.created_at).toLocaleDateString("es-AR")}
            </p>

            {/* View button */}
            <Button
              variant="default"
              size="sm"
              onClick={() => onViewReview(review)}
              className="mt-3 bg-red-500 hover:bg-red-600 text-white"
            >
              Ver reseña
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
