"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RatingSlider } from "@/components/ui/rating-slider"
import { PriceSlider } from "@/components/ui/price-slider"
import { Checkbox } from "@/components/ui/checkbox"
import { PlaceSearch } from "@/components/places/place-search"
import { RESTAURANT_CATEGORIES } from "@/lib/types"
import { PhotoUpload } from "@/components/photos/photo-upload"
import { uploadReviewPhoto } from "@/lib/storage"
import { getRatingColor } from "@/lib/rating-labels"

interface DetailedReviewFormProps {
  onSubmit: (reviewData: any) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
  preSelectedPlace?: any // Nuevo prop para lugar preseleccionado
}

export function DetailedReviewForm({
  onSubmit,
  onCancel,
  isLoading = false,
  preSelectedPlace,
}: DetailedReviewFormProps) {
  const [selectedPlace, setSelectedPlace] = useState<any>(preSelectedPlace || null)
  const [dishName, setDishName] = useState("")
  const [comment, setComment] = useState("")
  const [photos, setPhotos] = useState<(File | string)[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [wantsToRecommendDish, setWantsToRecommendDish] = useState(false)

  // Puntuaciones (1-10) - valores iniciales en 5
  const [ratings, setRatings] = useState({
    food_taste: 5,
    presentation: 5,
    portion_size: 5,
    drinks_variety: 5,
    veggie_options: 5,
    gluten_free_options: 5,
    vegan_options: 5,
    music_acoustics: 5,
    ambiance: 5,
    furniture_comfort: 5,
    cleanliness: 5,
    service: 5,
  })

  const [priceRange, setPriceRange] = useState("under_10000") // Valor inicial
  const [category, setCategory] = useState("")

  // Efecto para actualizar el lugar seleccionado cuando cambia el prop
  useEffect(() => {
    if (preSelectedPlace) {
      // Validar que el lugar tenga los campos mínimos necesarios
      if (preSelectedPlace.name) {
        setSelectedPlace(preSelectedPlace)
      }
    }
  }, [preSelectedPlace])

  const ratingLabels = {
    food_taste: "Sabor de la comida",
    presentation: "Presentación del plato",
    portion_size: "Tamaño de la porción",
    drinks_variety: "Carta de bebidas",
    veggie_options: "Variedad platos veggies",
    gluten_free_options: "Variedad platos sin TACC",
    vegan_options: "Variedad platos veganos",
    music_acoustics: "Música y acústica",
    ambiance: "Ambientación",
    furniture_comfort: "Confort del mobiliario",
    cleanliness: "Limpieza",
    service: "Servicio de mesa",
  }

  const handleRatingChange = (key: string, value: number[]) => {
    setRatings((prev) => ({ ...prev, [key]: value[0] }))
  }

  const handlePlaceSelect = (place: any) => {
    setSelectedPlace(place)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPlace || !priceRange || !category) {
      alert("Por favor completa todos los campos obligatorios")
      return
    }

    // Validar que el lugar tenga los campos requeridos
    if (!selectedPlace.google_place_id || !selectedPlace.name || !selectedPlace.address) {
      alert("Error: Información del lugar incompleta. Por favor selecciona el lugar nuevamente.")
      return
    }

    setIsSubmitting(true)

    try {
      // Procesar fotos
      let photo1Url = null
      let photo2Url = null

      if (photos.length > 0) {
        const reviewId = `review_${Date.now()}`

        // Procesar primera foto
        if (photos[0] instanceof File) {
          photo1Url = await uploadReviewPhoto(photos[0], "temp-user", reviewId, 1)
        } else if (typeof photos[0] === "string") {
          photo1Url = photos[0]
        }

        // Procesar segunda foto
        if (photos[1]) {
          if (photos[1] instanceof File) {
            photo2Url = await uploadReviewPhoto(photos[1], "temp-user", reviewId, 2)
          } else if (typeof photos[1] === "string") {
            photo2Url = photos[1]
          }
        }
      }

      // Asegurar que todos los campos del lugar estén presentes
      const placeData = {
        google_place_id: selectedPlace.google_place_id,
        name: selectedPlace.name,
        address: selectedPlace.address,
        latitude: selectedPlace.latitude || -32.9442426,
        longitude: selectedPlace.longitude || -60.6505388,
        phone: selectedPlace.phone || null,
        website: selectedPlace.website || null,
        id: selectedPlace.id || null, // Puede ser null si es un lugar nuevo
      }

      const reviewData = {
        place: placeData,
        dish_name: dishName.trim() || null,
        ...ratings,
        price_range: priceRange,
        restaurant_category: category,
        comment: comment.trim() || null,
        photo_1_url: photo1Url,
        photo_2_url: photo2Url,
      }

      await onSubmit(reviewData)
    } catch (error) {
      console.error("Error submitting review:", error)
      alert("Error al enviar la reseña. Inténtalo de nuevo.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Nueva Reseña Detallada</CardTitle>
          <CardDescription>Comparte tu experiencia completa en este lugar</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Búsqueda de lugar */}
            <div className="space-y-2">
              <Label>Lugar *</Label>
              {!selectedPlace ? (
                <div className="w-full">
                  <PlaceSearch onPlaceSelect={handlePlaceSelect} searchMode="api" />
                  {preSelectedPlace && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                      Debug: Lugar preseleccionado detectado pero no cargado correctamente
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 border rounded-md bg-muted">
                  <div>
                    <p className="font-medium">{selectedPlace.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedPlace.address}</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => setSelectedPlace(null)}>
                    Cambiar
                  </Button>
                </div>
              )}
            </div>

            {/* Puntuaciones */}
            <div className="space-y-4">
              <div className="space-y-1">
                <Label className="text-base font-semibold">Puntuaciones (1-10)</Label>
              </div>

              {Object.entries(ratingLabels).map(([key, label]) => {
                const currentRating = ratings[key as keyof typeof ratings]
                const ratingColor = getRatingColor(currentRating)

                return (
                  <div key={key} className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-medium">{label}</Label>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-lg font-bold ${ratingColor} bg-muted/50 px-2 py-1 rounded-md min-w-[50px] text-center`}
                        >
                          {currentRating}/10
                        </span>
                      </div>
                    </div>
                    <RatingSlider
                      value={[currentRating]}
                      onValueChange={(value) => handleRatingChange(key, value)}
                      min={1}
                      max={10}
                      step={1}
                      className="w-full"
                    />
                  </div>
                )
              })}
            </div>

            {/* Checkbox para recomendar plato */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="recommend-dish"
                  checked={wantsToRecommendDish}
                  onCheckedChange={(checked) => {
                    setWantsToRecommendDish(!!checked)
                    if (!checked) {
                      setDishName("") // Limpiar el nombre del plato si se desmarca
                    }
                  }}
                />
                <Label htmlFor="recommend-dish" className="text-sm font-medium">
                  ¿Querés recomendar algún plato?
                </Label>
              </div>

              {wantsToRecommendDish && (
                <div className="space-y-2 ml-6">
                  <Label htmlFor="dish">Nombre del plato</Label>
                  <Input
                    id="dish"
                    placeholder="Ej: Milanesa napolitana, Pizza margherita..."
                    value={dishName}
                    onChange={(e) => setDishName(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Precio por persona - Slider */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Precio por persona *</Label>
              <PriceSlider value={priceRange} onValueChange={setPriceRange} className="w-full" />
            </div>

            {/* Categorías - Dropdown */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">Categoría del restaurante *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(RESTAURANT_CATEGORIES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Fotos */}
            <PhotoUpload photos={photos} onPhotosChange={setPhotos} maxPhotos={2} userId="temp-user" />

            {/* Comentario */}
            <div className="space-y-2">
              <Label htmlFor="comment">Comentario adicional (opcional)</Label>
              <Textarea
                id="comment"
                placeholder="Cuéntanos más detalles sobre tu experiencia..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading || isSubmitting}
                className="flex-1 bg-transparent"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading || isSubmitting} className="flex-1">
                {isSubmitting ? "Enviando..." : "Enviar reseña"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
