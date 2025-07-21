"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, Eye } from "lucide-react"
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
    ]
    return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
  }

  const overallRating = calculateOverallRating(review)

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            {/* Place name */}
            <h3 className="font-semibold text-lg truncate">{review.place?.name || "Lugar desconocido"}</h3>

            {/* Dish name */}
            <p className="text-muted-foreground text-sm truncate mt-1">{review.dish_name}</p>

            {/* Rating */}
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium text-sm">{overallRating.toFixed(1)}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(review.created_at).toLocaleDateString("es-AR")}
              </span>
            </div>
          </div>

          {/* View button */}
          <Button variant="outline" size="sm" onClick={() => onViewReview(review)} className="ml-4 shrink-0">
            <Eye className="h-4 w-4 mr-1" />
            Ver
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
