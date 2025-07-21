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
  // Calculate overall rating from all individual ratings
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
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-AR", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
    })
  }

  return (
    <Card className="relative">
      <CardContent className="p-4">
        {/* Rating in top right corner */}
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-full">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          <span className="text-sm font-medium">{overallRating.toFixed(1)}</span>
        </div>

        <div className="pr-16">
          {/* Place name */}
          <h3 className="font-semibold text-lg mb-1">{review.place?.name}</h3>

          {/* Dish name */}
          <p className="text-muted-foreground mb-2">🍽️ {review.dish_name}</p>

          {/* Date */}
          <p className="text-sm text-muted-foreground mb-3">{formatDate(review.created_at)}</p>

          {/* View button */}
          <Button
            variant="default"
            size="sm"
            onClick={() => onViewReview(review)}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            Ver reseña
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
