"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import type { Place } from "@/lib/types"

interface TopRatedPlacesProps {
  onPlaceSelect: (place: Place) => void
  onReviewSelect: (reviewId: string) => void // New prop for review selection
}

interface RecommendationData {
  reviewId: string // Add review ID
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
  const [preloadedImages, setPreloadedImages] = useState<Set<string>>(new Set())
  const [imageLoadStates, setImageLoadStates] = useState<Record<string, boolean>>({})

  const supabase = createClient()

  useEffect(() => {
    fetchTopRecommendations()
  }, [])

  // Preload images function
  const preloadImage = (url: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (preloadedImages.has(url)) {
        resolve()
        return
      }

      const img = new Image()
      img.crossOrigin = "anonymous"

      img.onload = () => {
        setPreloadedImages((prev) => new Set([...prev, url]))
        setImageLoadStates((prev) => ({ ...prev, [url]: true }))
        resolve()
      }

      img.onerror = () => {
        setImageLoadStates((prev) => ({ ...prev, [url]: false }))
        reject(new Error(`Failed to load image: ${url}`))
      }

      img.src = url
    })
  }

  // Preload all images when recommendations are loaded
  useEffect(() => {
    if (recommendations.length > 0) {
      const imageUrls = recommendations.map((rec) => rec.photo_url).filter((url): url is string => url !== null)

      // Preload current image first, then others
      const currentImageUrl = recommendations[currentIndex]?.photo_url
      if (currentImageUrl) {
        preloadImage(currentImageUrl).catch(console.error)
      }

      // Preload other images in background
      imageUrls.forEach((url) => {
        if (url !== currentImageUrl) {
          setTimeout(() => preloadImage(url).catch(console.error), 100)
        }
      })
    }
  }, [recommendations, currentIndex])

  // Auto-play effect
  useEffect(() => {
    if (isAutoPlaying && recommendations.length > 1) {
      const interval = setInterval(() => {
        handleSlideChange((prev) => (prev + 1) % recommendations.length)
      }, 4000) // Change slide every 4 seconds

      setAutoPlayInterval(interval)

      return () => {
        if (interval) clearInterval(interval)
      }
    } else if (autoPlayInterval) {
      clearInterval(autoPlayInterval)
      setAutoPlayInterval(null)
    }
  }, [isAutoPlaying, recommendations.length])

  // Smooth transition handler
  const handleSlideChange = (indexOrFunction: number | ((prev: number) => number)) => {
    if (isTransitioning) return // Prevent multiple transitions

    setIsTransitioning(true)

    // Fade out
    setTimeout(() => {
      if (typeof indexOrFunction === "function") {
        setCurrentIndex(indexOrFunction)
      } else {
        setCurrentIndex(indexOrFunction)
      }

      // Fade in
      setTimeout(() => {
        setIsTransitioning(false)
      }, 150) // Half of transition duration
    }, 150) // Half of transition duration
  }

  // Pause auto-play when user interacts
  const pauseAutoPlay = () => {
    setIsAutoPlaying(false)
    if (autoPlayInterval) {
      clearInterval(autoPlayInterval)
      setAutoPlayInterval(null)
    }

    // Resume auto-play after 10 seconds of no interaction
    setTimeout(() => {
      setIsAutoPlaying(true)
    }, 10000)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null) // Reset touchEnd
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
      // Swipe left - next slide
      pauseAutoPlay()
      handleSlideChange((prev) => (prev + 1) % recommendations.length)
    }

    if (isRightSwipe) {
      // Swipe right - previous slide
      pauseAutoPlay()
      handleSlideChange((prev) => (prev - 1 + recommendations.length) % recommendations.length)
    }
  }

  const fetchTopRecommendations = async () => {
    try {
      // Obtener las mejores reseñas detalladas con información del usuario, lugar y fotos
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
        .order("created_at", { ascending: false })
        .limit(12) // Obtener más para filtrar los que tienen fotos

      if (error) {
        console.error("Error fetching recommendations:", error)
        setRecommendations([])
      } else {
        // Filtrar y procesar los datos, priorizando los que tienen fotos
        const processedRecommendations = (data || [])
          .filter((item) => item.user && item.place && item.dish_name && item.user.full_name && item.place.name)
          .map((item) => ({
            reviewId: item.id, // Include review ID
            place: item.place,
            user: {
              id: item.user.id,
              full_name: item.user.full_name,
              avatar_url: item.user.avatar_url || "/placeholder.svg?height=40&width=40",
            },
            dish_name: item.dish_name,
            photo_url: item.photo_1_url || item.photo_2_url || null, // Usar la primera foto disponible
          }))
          .sort((a, b) => {
            // Priorizar reseñas con fotos
            if (a.photo_url && !b.photo_url) return -1
            if (!a.photo_url && b.photo_url) return 1
            return 0
          })
          .slice(0, 4) // Máximo 4 recomendaciones

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
    e.stopPropagation() // Prevent card click
    pauseAutoPlay()
    handleSlideChange(index)
  }

  const handleCardClick = () => {
    if (!isTransitioning && currentRecommendation) {
      // Navigate to single review page instead of place
      onReviewSelect(currentRecommendation.reviewId)
    }
  }

  const handleViewReview = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click
    if (currentRecommendation) {
      onReviewSelect(currentRecommendation.reviewId)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Recomendaciones</h2>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Cargando recomendaciones...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (recommendations.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Recomendaciones</h2>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Aún no hay recomendaciones disponibles</div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentRecommendation = recommendations[currentIndex]
  const currentImageUrl = currentRecommendation.photo_url
  const isImageLoaded = currentImageUrl ? imageLoadStates[currentImageUrl] === true : false

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Recomendaciones</h2>

      {/* Card */}
      <Card
        className="overflow-hidden relative cursor-pointer hover:shadow-lg transition-all duration-300 h-80"
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(true)}
        onClick={handleCardClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Background Image with loading state */}
        {currentImageUrl && (
          <>
            {/* Placeholder/Loading state */}
            {!isImageLoaded && (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              </div>
            )}

            {/* Actual image */}
            <div
              className={`absolute inset-0 bg-cover bg-center transition-all duration-500 ease-in-out ${
                isImageLoaded ? "opacity-100" : "opacity-0"
              }`}
              style={{
                backgroundImage: isImageLoaded ? `url(${currentImageUrl})` : "none",
                opacity: isTransitioning ? 0.8 : isImageLoaded ? 1 : 0,
              }}
            />
          </>
        )}

        {/* Fallback for no image */}
        {!currentImageUrl && (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/40">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-6xl opacity-20">🍽️</div>
            </div>
          </div>
        )}

        {/* Bottom gradient for text readability - Only show when image is loaded or no image */}
        <div
          className={`absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 via-20% to-transparent to-80% transition-opacity duration-300 ${
            currentImageUrl && !isImageLoaded ? "opacity-0" : "opacity-100"
          }`}
        />

        {/* Content - Only show when image is loaded or no image */}
        <div
          className={`relative z-10 h-full transition-opacity duration-300 ${
            currentImageUrl && !isImageLoaded ? "opacity-0" : "opacity-100"
          }`}
        >
          <CardContent className="text-white h-full flex flex-col justify-between p-6">
            {/* Top section with user name */}
            <div className="flex justify-end">
              <div
                className={`transition-all duration-300 ease-in-out ${
                  isTransitioning ? "opacity-0 transform scale-95" : "opacity-100 transform scale-100"
                }`}
              >
                <p className="text-xs font-medium text-white bg-black/30 backdrop-blur-sm px-2 py-1 rounded-full">
                  por <span className="text-primary font-medium">{currentRecommendation.user.full_name}</span>
                </p>
              </div>
            </div>

            {/* Bottom section with dish info and button */}
            <div className="flex items-end justify-between">
              {/* Bottom left - Dish and place info */}
              <div
                className={`transition-all duration-300 ease-in-out ${
                  isTransitioning ? "opacity-0 transform translate-y-2" : "opacity-100 transform translate-y-0"
                }`}
              >
                <div className="text-base font-medium text-white leading-tight">
                  <div>
                    <span className="text-white font-medium">{currentRecommendation.dish_name}</span>
                    <span className="text-white font-medium"> de</span>
                  </div>
                  <div className="text-white font-medium">{currentRecommendation.place.name}</div>
                </div>
              </div>

              {/* Bottom right - Ver reseña button */}
              <div
                className={`transition-all duration-300 ease-in-out ${
                  isTransitioning ? "opacity-0 transform translate-y-2" : "opacity-100 transform translate-y-0"
                }`}
              >
                <Button
                  onClick={handleViewReview}
                  size="sm"
                  className="bg-black/40 backdrop-blur-sm border border-white/20 text-white hover:bg-black/60 transition-all duration-200 text-xs"
                >
                  Ver reseña
                </Button>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>

      {/* Navigation indicators - Outside and centered below the card */}
      {recommendations.length > 1 && (
        <div className="flex justify-center pt-2">
          <div className="flex gap-2">
            {recommendations.map((_, index) => (
              <button
                key={index}
                onClick={(e) => goToSlide(index, e)}
                disabled={isTransitioning}
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
