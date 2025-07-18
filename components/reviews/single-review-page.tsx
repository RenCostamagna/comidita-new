"use client"

import { useState, useEffect } from "react"
import { Calendar, Star, DollarSign, Utensils, MapPin, X, ChevronLeft, ChevronRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { createClient } from "@/lib/supabase/client"
import { PRICE_RANGES, RESTAURANT_CATEGORIES } from "@/lib/types"
import { getRatingColor } from "@/lib/rating-labels"
import type { DetailedReview } from "@/lib/types"
import { Header } from "@/components/layout/header"
import { BottomNavigation } from "@/components/layout/bottom-navigation"

interface SingleReviewPageProps {
  reviewId: string
  onBack: () => void
  onViewPlace?: (place: any) => void
  onAddReview?: (place: any) => void
  onGoHome?: () => void
  onGoReview?: () => void
  onGoProfile?: () => void
  onNotificationClick?: (notification: any) => void
}

export function SingleReviewPage({
  reviewId,
  onBack,
  onViewPlace,
  onAddReview,
  onGoHome,
  onGoReview,
  onGoProfile,
  onNotificationClick,
}: SingleReviewPageProps) {
  const [review, setReview] = useState<DetailedReview | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

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

  const handleImageClick = (imageUrl: string, index: number) => {
    setSelectedImage(imageUrl)
    setCurrentImageIndex(index)
  }

  const closeImageModal = () => {
    setSelectedImage(null)
  }

  const handleHeaderPlaceSelect = async (selectedPlace: any) => {
    if (onGoHome) {
      onGoHome()
    }
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

    // Fallback a campos legacy
    const legacyPhotos = []
    if (review?.photo_1_url && review.photo_1_url.trim()) {
      legacyPhotos.push({
        photo_url: review.photo_1_url.trim(),
        is_primary: true,
        photo_order: 1,
      })
    }
    if (review?.photo_2_url && review.photo_2_url.trim() && review.photo_2_url !== review.photo_1_url) {
      legacyPhotos.push({
        photo_url: review.photo_2_url.trim(),
        is_primary: false,
        photo_order: 2,
      })
    }
    return legacyPhotos
  }

  const navigateImage = (direction: "prev" | "next") => {
    const photos = getReviewPhotos()
    if (direction === "prev") {
      setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1))
    } else {
      setCurrentImageIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0))
    }
    setSelectedImage(photos[currentImageIndex].photo_url)
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
      <div className="min-h-screen bg-background">
        <Header showBackButton={true} onBack={onBack} user={review?.user} onPlaceSelect={handleHeaderPlaceSelect} />
        <main className="container mx-auto px-4 py-8 pt-20">
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Cargando reseña...</div>
          </div>
        </main>
      </div>
    )
  }

  if (!review) {
    return (
      <div className="min-h-screen bg-background">
        <Header showBackButton={true} onBack={onBack} user={null} onPlaceSelect={handleHeaderPlaceSelect} />
        <main className="container mx-auto px-4 py-8 pt-20">
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">No se pudo cargar la reseña</div>
          </div>
        </main>
      </div>
    )
  }

  const averageRating = calculateAverageRating(review)
  const averageRatingColor = getRatingColor(Math.round(averageRating))
  const photos = getReviewPhotos()
  const primaryPhoto = photos.find((p) => p.is_primary) || photos[0]
  const otherPhotos = photos.filter((p) => !p.is_primary)

  return (
    <div className="min-h-screen bg-background">
      <Header
        showBackButton={true}
        onBack={onBack}
        user={review?.user}
        onPlaceSelect={handleHeaderPlaceSelect}
        onNotificationClick={onNotificationClick}
      />

      <main className="container mx-auto px-4 py-6 pt-20 max-w-2xl pb-24">
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
                  <Badge
                    variant="secondary"
                    className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200"
                  >
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

            {/* Photos mejoradas */}
            {photos.length > 0 && (
              <div className="space-y-4">
                {/* Foto principal */}
                {primaryPhoto && (
                  <div className="relative">
                    <div className="aspect-video max-w-lg mx-auto">
                      <img
                        src={primaryPhoto.photo_url || "/placeholder.svg"}
                        alt="Foto principal de la reseña"
                        className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                        crossOrigin="anonymous"
                        onClick={() => handleImageClick(primaryPhoto.photo_url, 0)}
                        onError={(e) => {
                          console.error("Error cargando foto principal:", primaryPhoto.photo_url)
                          const target = e.target as HTMLImageElement
                          target.src = "/placeholder.svg?height=400&width=600&text=Error+cargando+imagen"
                        }}
                        onLoad={() => {
                          console.log("✅ Foto principal cargada:", primaryPhoto.photo_url)
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Otras fotos en grid */}
                {otherPhotos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {otherPhotos.map((photo, index) => (
                      <div key={index} className="aspect-square">
                        <img
                          src={photo.photo_url || "/placeholder.svg"}
                          alt={`Foto adicional ${index + 1}`}
                          className="w-full h-full object-cover rounded-md cursor-pointer hover:opacity-90 transition-opacity"
                          crossOrigin="anonymous"
                          onClick={() => handleImageClick(photo.photo_url, index + 1)}
                          onError={(e) => {
                            console.error(`Error cargando foto ${index + 1}:`, photo.photo_url)
                            const target = e.target as HTMLImageElement
                            target.src = "/placeholder.svg?height=150&width=150&text=Error"
                          }}
                          onLoad={() => {
                            console.log(`✅ Foto ${index + 1} cargada:`, photo.photo_url)
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {photos.length > 1 && (
                  <div className="text-center text-xs text-muted-foreground">
                    {photos.length} foto{photos.length > 1 ? "s" : ""} • Toca para ampliar
                  </div>
                )}
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

            {/* Comment */}
            {review.comment && (
              <div className="pt-4 border-t">
                <h3 className="font-medium mb-2">Comentario</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{review.comment}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Image Modal mejorado */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={closeImageModal}>
          <div className="relative max-w-4xl max-h-full">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white"
              onClick={closeImageModal}
            >
              <X className="h-4 w-4" />
            </Button>

            {/* Navegación de imágenes */}
            {photos.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white"
                  onClick={(e) => {
                    e.stopPropagation()
                    navigateImage("prev")
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white"
                  onClick={(e) => {
                    e.stopPropagation()
                    navigateImage("next")
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>

                {/* Contador de fotos */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  {currentImageIndex + 1} / {photos.length}
                </div>
              </>
            )}

            <img
              src={selectedImage || "/placeholder.svg"}
              alt="Imagen ampliada"
              className="max-w-full max-h-full object-contain rounded-lg"
              crossOrigin="anonymous"
              onClick={(e) => e.stopPropagation()}
              onError={(e) => {
                console.error("Error cargando imagen en modal:", selectedImage)
                const target = e.target as HTMLImageElement
                target.src = "/placeholder.svg?height=600&width=600&text=Error+cargando+imagen"
              }}
              onLoad={() => {
                console.log("✅ Imagen cargada en modal:", selectedImage)
              }}
            />
          </div>
        </div>
      )}

      <BottomNavigation
        currentPage="home"
        onGoHome={onGoHome || (() => {})}
        onGoReview={onGoReview || (() => {})}
        onGoProfile={onGoProfile || (() => {})}
      />
    </div>
  )
}
