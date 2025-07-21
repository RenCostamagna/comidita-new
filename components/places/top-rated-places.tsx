"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { createClient } from "@/lib/supabase/client"
import type { Place } from "@/lib/types"

interface TopRatedPlacesProps {
  onPlaceSelect: (place: Place) => void
  onReviewSelect: (reviewId: string) => void
}

interface RecommendationData {
  reviewId: string
  place: Place
  user: {
    id: string
    full_name: string
    avatar_url: string
  }
  dish_name: string
  photo_url: string | null
}

export function TopRatedPlaces({ onPlaceSelect, onReviewSelect }: TopRatedPlacesProps) {
  const [recommendations, setRecommendations] = useState<RecommendationData[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [autoPlayInterval, setAutoPlayInterval] = useState<NodeJS.Timeout | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [imageLoadStates, setImageLoadStates] = useState<Record<string, boolean>>({})

  const supabase = createClient()

  useEffect(() => {
    fetchTopRecommendations()
  }, [])

  // Preload images when recommendations change
  useEffect(() => {
    if (recommendations.length > 0) {
      recommendations.forEach((rec) => {
        if (rec.photo_url && !imageLoadStates[rec.photo_url]) {
          const img = new Image()
          img.crossOrigin = "anonymous"

          img.onload = () => {
            setImageLoadStates((prev) => ({ ...prev, [rec.photo_url!]: true }))
          }

          img.onerror = () => {
            setImageLoadStates((prev) => ({ ...prev, [rec.photo_url!]: false }))
          }

          img.src = rec.photo_url
        }
      })
    }
  }, [recommendations])

  // Auto-play effect
  useEffect(() => {
    if (isAutoPlaying && recommendations.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % recommendations.length)
      }, 4000)

      setAutoPlayInterval(interval)
      return () => clearInterval(interval)
    } else if (autoPlayInterval) {
      clearInterval(autoPlayInterval)
      setAutoPlayInterval(null)
    }
  }, [isAutoPlaying, recommendations.length])

  const pauseAutoPlay = () => {
    setIsAutoPlaying(false)
    if (autoPlayInterval) {
      clearInterval(autoPlayInterval)
      setAutoPlayInterval(null)
    }

    setTimeout(() => {
      setIsAutoPlaying(true)
    }, 10000)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe) {
      pauseAutoPlay()
      setCurrentIndex((prev) => (prev + 1) % recommendations.length)
    }

    if (isRightSwipe) {
      pauseAutoPlay()
      setCurrentIndex((prev) => (prev - 1 + recommendations.length) % recommendations.length)
    }
  }

  const fetchTopRecommendations = async () => {
    try {
      const { data, error } = await supabase
        .from("detailed_reviews")
        .select(`
          id,
          dish_name,
          photo_1_url,
          photo_2_url,
          user:users(id, full_name, avatar_url),
          place:places(*)
        `)
        .not("dish_name", "is", null)
        .not("dish_name", "eq", "")
        .or("photo_1_url.not.is.null,photo_2_url.not.is.null")
        .order("created_at", { ascending: false })
        .limit(20)

      if (error) {
        console.error("Error fetching recommendations:", error)
        setRecommendations([])
      } else {
        const processedRecommendations = (data || [])
          .filter((item) => {
            // Ensure all required fields exist
            const hasRequiredFields =
              item.user && item.place && item.dish_name && item.user.full_name && item.place.name
            // Ensure at least one photo exists
            const hasPhoto = item.photo_1_url || item.photo_2_url
            return hasRequiredFields && hasPhoto
          })
          .map((item) => ({
            reviewId: item.id,
            place: item.place,
            user: {
              id: item.user.id,
              full_name: item.user.full_name,
              avatar_url: item.user.avatar_url || "/placeholder.svg?height=40&width=40",
            },
            dish_name: item.dish_name,
            photo_url: item.photo_1_url || item.photo_2_url, // Always use the first available photo
          }))
          .slice(0, 4) // Take maximum 4 reviews

        setRecommendations(processedRecommendations)
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error)
      setRecommendations([])
    } finally {
      setIsLoading(false)
    }
  }

  const goToSlide = (index: number, e: React.MouseEvent) => {
    e.stopPropagation()
    pauseAutoPlay()
    setCurrentIndex(index)
  }

  const handleCardClick = () => {
    if (currentRecommendation) {
      onReviewSelect(currentRecommendation.reviewId)
    }
  }

  const handleViewReview = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (currentRecommendation) {
      onReviewSelect(currentRecommendation.reviewId)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Recomendaciones</h2>
        <Card className="aspect-video w-full">
          <CardContent className="p-0 h-full">
            <Skeleton className="w-full h-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  // Empty state
  if (recommendations.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Recomendaciones</h2>
        <Card className="aspect-video w-full">
          <CardContent className="p-6 h-full flex items-center justify-center">
            <div className="text-muted-foreground">Aún no hay recomendaciones disponibles</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentRecommendation = recommendations[currentIndex]
  const currentImageUrl = currentRecommendation.photo_url
  const isImageLoaded = currentImageUrl ? imageLoadStates[currentImageUrl] === true : true

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Recomendaciones</h2>

      {/* Main Card - Fixed structure */}
      <Card
        className="overflow-hidden relative cursor-pointer hover:shadow-lg transition-shadow duration-300 aspect-video w-full"
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(true)}
        onClick={handleCardClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Background - Fixed position and size */}
        <div className="absolute inset-0">
          {/* Image or fallback background */}
          {currentImageUrl && isImageLoaded ? (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${currentImageUrl})` }}
            />
          ) : currentImageUrl && !isImageLoaded ? (
            <Skeleton className="absolute inset-0" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/40">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-6xl opacity-20">🍽️</div>
              </div>
            </div>
          )}
        </div>

        {/* Overlay - Always present */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 via-20% to-transparent to-80%" />

        {/* Content - Fixed structure, always visible */}
        <CardContent className="relative z-10 text-white h-full flex flex-col justify-between p-6">
          {/* Top section */}
          <div className="flex justify-end relative">
            {/* Gradient overlay for better text readability */}
            <div className="absolute -top-3 -right-2 w-80 h-32 
    bg-gradient-to-bl from-black/20 via-black/10 via-40% to-transparent to-70% 
    blur-md rounded-tl-2xl pointer-events-none" />
            <p className="text-xs font-medium text-white relative z-10">
              por <span className="text-white font-medium">{currentRecommendation.user.full_name}</span>
            </p>
          </div>

          {/* Bottom section */}
          <div className="flex items-end justify-between">
            {/* Dish and place info */}
            <div className="text-sm font-medium text-white leading-tight">
              <div>
                <span className="text-white font-medium">
                  {currentRecommendation.dish_name.charAt(0).toUpperCase() +
                    currentRecommendation.dish_name.slice(1).toLowerCase()}
                </span>
                <span className="text-white font-medium"> de</span>
              </div>
              <div className="text-white font-medium">{currentRecommendation.place.name}</div>
            </div>

            {/* Button */}
            <Button
              onClick={handleViewReview}
              size="sm"
              className="bg-black/40 backdrop-blur-sm border border-white/20 text-white hover:bg-black/60 transition-all duration-200 text-xs"
            >
              Ver reseña
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Navigation indicators */}
      {recommendations.length > 1 && (
        <div className="flex justify-center pt-2">
          <div className="flex gap-2">
            {recommendations.map((_, index) => (
              <button
                key={index}
                onClick={(e) => goToSlide(index, e)}
                className={`w-2 h-2 rounded-full transition-all duration-300 hover:scale-125 ${
                  index === currentIndex
                    ? "bg-primary scale-110"
                    : "bg-muted-foreground/40 hover:bg-muted-foreground/60"
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
