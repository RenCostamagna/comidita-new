"use client"

import { Star, MapPin, Phone, Globe, DollarSign } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PRICE_RANGES, RESTAURANT_CATEGORIES } from "@/lib/types"
import type { Place } from "@/lib/types"

interface PlaceCardProps {
  place: Place
  onViewReviews: (place: Place) => void
  onAddReview: (place: Place) => void
  showActions?: boolean
}

export function PlaceCard({ place, onViewReviews, onAddReview, showActions = true }: PlaceCardProps) {
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg leading-tight">{place.name}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              {place.category && (
                <Badge variant="outline" className="text-xs">
                  {RESTAURANT_CATEGORIES[place.category as keyof typeof RESTAURANT_CATEGORIES] || place.category}
                </Badge>
              )}
              {place.rating > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  {place.rating.toFixed(1)}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span className="leading-tight">{place.address}</span>
        </div>

        {place.phone && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4 flex-shrink-0" />
            <span>{place.phone}</span>
          </div>
        )}

        {place.website && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Globe className="h-4 w-4 flex-shrink-0" />
            <a href={place.website} target="_blank" rel="noopener noreferrer" className="hover:underline truncate">
              Sitio web
            </a>
          </div>
        )}

        {place.average_price_range && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <DollarSign className="h-4 w-4 flex-shrink-0" />
            <span>
              Precio promedio:{" "}
              {PRICE_RANGES[place.average_price_range as keyof typeof PRICE_RANGES] || place.average_price_range}
            </span>
          </div>
        )}

        <div className="text-sm text-muted-foreground">
          {place.total_reviews} {place.total_reviews === 1 ? "reseña" : "reseñas"}
        </div>

        {showActions && (
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => onViewReviews(place)} className="flex-1">
              Ver lugar
            </Button>
            <Button size="sm" onClick={() => onAddReview(place)} className="flex-1">
              Reseñar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
