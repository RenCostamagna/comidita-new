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
import { getRatingColor } from "@/lib/rating-labels"
import { createClient } from "@/lib/supabase/client"
import { uploadMultipleReviewPhotos } from "@/lib/storage"

interface PhotoData {
  file: File | string
  isPrimary: boolean
  id?: string
}

interface DetailedReviewFormProps {
  onSubmit: (reviewData: any) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
  preSelectedPlace?: any
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
  const [photos, setPhotos] = useState<PhotoData[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [wantsToRecommendDish, setWantsToRecommendDish] = useState(false)

  // Puntuaciones (1-10) - valores iniciales en 5
  const [ratings, setRatings] = useState({
    food_taste: 5,
    presentation: 5,
    portion_size: 5,
    music_acoustics: 5,
    ambiance: 5,
    furniture_comfort: 5,
    service: 5,
  })

  // Nuevos campos booleanos para opciones dietéticas
  const [dietaryOptions, setDietaryOptions] = useState({
    celiac_friendly: false,
    vegetarian_friendly: false,
  })

  const [priceRange, setPriceRange] = useState("under_10000")
  const [category, setCategory] = useState("")

  const supabase = createClient()

  useEffect(() => {
    if (preSelectedPlace) {
      if (preSelectedPlace.name) {
        setSelectedPlace(preSelectedPlace)
      }
    }
  }, [preSelectedPlace])

  // Labels actualizados sin las opciones dietéticas
  const ratingLabels = {
    food_taste: "Sabor de la comida",
    presentation: "Presentación del plato",
    portion_size: "Tamaño de la porción",
    music_acoustics: "Música y acústica",
    ambiance: "Ambientación",
    furniture_comfort: "Confort del mobiliario",
    service: "Servicio de mesa",
    // Eliminamos drinks_variety: "Carta de bebidas" y cleanliness: "Limpieza"
  }

  const handleRatingChange = (key: string, value: number[]) => {
    setRatings((prev) => ({ ...prev, [key]: value[0] }))
  }

  const handlePlaceSelect = (place: any) => {
    setSelectedPlace(place)
  }

  const handleDietaryOptionChange = (option: string, checked: boolean) => {
    setDietaryOptions((prev) => ({ ...prev, [option]: checked }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPlace || !priceRange || !category) {
      alert("Por favor completa todos los campos obligatorios")
      return
    }

    // Enhanced place validation
    if (!selectedPlace.place_id && !selectedPlace.google_place_id) {
      alert("Error: Información del lugar incompleta. Por favor selecciona el lugar nuevamente.")
      return
    }

    // Ensure we have the required place fields
    const placeId = selectedPlace.google_place_id || selectedPlace.place_id
    const placeName = selectedPlace.name
    const placeAddress = selectedPlace.formatted_address || selectedPlace.address

    if (!placeId || !placeName || !placeAddress) {
      alert("Error: Información del lugar incompleta. Por favor selecciona el lugar nuevamente.")
      return
    }

    setIsSubmitting(true)

    try {
      // Generar un ID temporal para la reseña
      const tempReviewId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Obtener el usuario actual
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        alert("Debes estar autenticado para enviar una reseña")
        return
      }

      // Subir fotos a Vercel Blob si hay fotos
      let uploadedPhotoUrls: string[] = []
      if (photos.length > 0) {
        console.log("Subiendo fotos a Vercel Blob...")

        // Filtrar solo los archivos File (no strings que ya son URLs)
        const filesToUpload = photos.map((photo) => photo.file).filter((file): file is File => file instanceof File)

        if (filesToUpload.length > 0) {
          uploadedPhotoUrls = await uploadMultipleReviewPhotos(filesToUpload, user.id, tempReviewId)
          console.log("Fotos subidas:", uploadedPhotoUrls)
        }

        // También incluir URLs que ya existen (strings)
        const existingUrls = photos
          .map((photo) => photo.file)
          .filter((file): file is string => typeof file === "string")

        uploadedPhotoUrls = [...uploadedPhotoUrls, ...existingUrls]
      }

      const placeData = {
        google_place_id: placeId,
        name: placeName,
        address: placeAddress,
        latitude: selectedPlace.geometry?.location?.lat || selectedPlace.latitude || -32.9442426,
        longitude: selectedPlace.geometry?.location?.lng || selectedPlace.longitude || -60.6505388,
        phone: selectedPlace.formatted_phone_number || selectedPlace.phone || null,
        website: selectedPlace.website || null,
        id: selectedPlace.id || null,
      }

      // Crear el objeto de datos de la reseña con las URLs de las fotos subidas
      const reviewData = {
        place: placeData,
        dish_name: dishName.trim() || null,
        ...ratings,
        celiac_friendly: dietaryOptions.celiac_friendly,
        vegetarian_friendly: dietaryOptions.vegetarian_friendly,
        price_range: priceRange,
        restaurant_category: category,
        comment: comment.trim() || null,
        photo_urls: uploadedPhotoUrls, // Enviar las URLs de las fotos subidas
        primary_photo_url: uploadedPhotoUrls.length > 0 ? uploadedPhotoUrls[0] : null, // Primera foto como primaria
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
          <CardTitle>Nueva Reseña</CardTitle>
          <CardDescription>Comparte tu experiencia completa</CardDescription>
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
                      Debug: Lugar preseleccionado - {preSelectedPlace.name} (ID:{" "}
                      {preSelectedPlace.google_place_id || preSelectedPlace.place_id})
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 border rounded-md bg-muted">
                  <div>
                    <p className="font-medium">{selectedPlace.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedPlace.formatted_address || selectedPlace.address}
                    </p>
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

            {/* Opciones dietéticas - NUEVAS CHECKBOXES */}
            <div className="space-y-4">
              <div className="space-y-1">
                <Label className="text-base font-semibold">Opciones dietéticas</Label>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center space-x-3 p-3 border rounded-lg bg-muted/30">
                  <Checkbox
                    id="celiac-friendly"
                    checked={dietaryOptions.celiac_friendly}
                    onCheckedChange={(checked) => handleDietaryOptionChange("celiac_friendly", !!checked)}
                  />
                  <div className="flex-1">
                    <Label htmlFor="celiac-friendly" className="text-sm font-medium cursor-pointer">
                      🌾 Celíaco friendly
                    </Label>
                    <p className="text-xs text-muted-foreground">Tiene opciones sin gluten/TACC</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 border rounded-lg bg-muted/30">
                  <Checkbox
                    id="vegetarian-friendly"
                    checked={dietaryOptions.vegetarian_friendly}
                    onCheckedChange={(checked) => handleDietaryOptionChange("vegetarian_friendly", !!checked)}
                  />
                  <div className="flex-1">
                    <Label htmlFor="vegetarian-friendly" className="text-sm font-medium cursor-pointer">
                      🥬 Vegetariano friendly
                    </Label>
                    <p className="text-xs text-muted-foreground">Tiene buenas opciones vegetarianas/veganas</p>
                  </div>
                </div>
              </div>
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
                      setDishName("")
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
                <SelectContent className="rounded-[var(--radius-dropdown)]">
                  {Object.entries(RESTAURANT_CATEGORIES).map(([key, label]) => (
                    <SelectItem key={key} value={key} className="rounded-[var(--radius-dropdown)]">
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Fotos - Componente mejorado */}
            <PhotoUpload photos={photos} onPhotosChange={setPhotos} maxPhotos={6} userId="temp-user" />

            {/* Comentario */}
            <div className="space-y-2">
              <Label htmlFor="comment">Comentario adicional (opcional)</Label>
              <Textarea
                className="py-3"
                id="comment"
                placeholder="Cuéntanos más detalles..."
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
