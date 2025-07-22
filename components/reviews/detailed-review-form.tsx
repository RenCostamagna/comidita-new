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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { cleanAddress, formatPlaceForStorage } from "@/lib/address-utils"
import type { DetailedReview } from "@/lib/types"

interface PhotoData {
  file: File | string
  isPrimary: boolean
  id?: string
  url?: string
  isUploading?: boolean
  uploadError?: string
  previewUrl?: string
}

interface DetailedReviewFormProps {
  onSubmit?: (reviewData: any) => Promise<void>
  onCancel: () => void
  onSuccess?: () => void
  isLoading?: boolean
  preSelectedPlace?: any
  place?: any
  existingReview?: DetailedReview | null
}

export function DetailedReviewForm({
  onSubmit,
  onCancel,
  onSuccess,
  isLoading = false,
  preSelectedPlace,
  place,
  existingReview,
}: DetailedReviewFormProps) {
  const isEditMode = !!existingReview
  const selectedPlaceFromProps = place || preSelectedPlace

  const [selectedPlace, setSelectedPlace] = useState<any>(selectedPlaceFromProps || null)
  const [dishName, setDishName] = useState("")
  const [comment, setComment] = useState("")
  const [photos, setPhotos] = useState<PhotoData[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
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

  // Función para recopilar URLs de fotos desde campos individuales
  const collectPhotoUrls = (review: any): string[] => {
    const photoUrls: string[] = []

    // Primero intentar con photo_urls array
    if (review.photo_urls && Array.isArray(review.photo_urls)) {
      photoUrls.push(...review.photo_urls.filter((url) => url))
    }

    // Luego recopilar desde campos individuales photo_1_url, photo_2_url, etc.
    for (let i = 1; i <= 6; i++) {
      const photoUrl = review[`photo_${i}_url`]
      if (photoUrl && typeof photoUrl === "string" && !photoUrls.includes(photoUrl)) {
        photoUrls.push(photoUrl)
      }
    }

    return photoUrls.filter((url) => url && url.trim() !== "")
  }

  // Efecto para cargar datos de la reseña existente en modo edición
  useEffect(() => {
    if (isEditMode && existingReview) {
      console.log("[DEBUG] Cargando datos de reseña existente:", existingReview)

      // Cargar datos básicos
      setDishName(existingReview.dish_name || "")
      setComment(existingReview.comment || "")
      setPriceRange(existingReview.price_range || "under_10000")

      // CORREGIR: Cargar categoría correctamente
      const reviewCategory = existingReview.restaurant_category || ""
      console.log("[DEBUG] Categoría de la reseña:", reviewCategory)
      setCategory(reviewCategory)

      // Cargar puntuaciones
      setRatings({
        food_taste: existingReview.food_taste || 5,
        presentation: existingReview.presentation || 5,
        portion_size: existingReview.portion_size || 5,
        music_acoustics: existingReview.music_acoustics || 5,
        ambiance: existingReview.ambiance || 5,
        furniture_comfort: existingReview.furniture_comfort || 5,
        service: existingReview.service || 5,
      })

      // Cargar opciones dietéticas
      setDietaryOptions({
        celiac_friendly: existingReview.celiac_friendly || false,
        vegetarian_friendly: existingReview.vegetarian_friendly || false,
      })

      // Configurar recomendación de plato
      const hasDishName = !!existingReview.dish_name?.trim()
      setWantsToRecommendDish(hasDishName)

      // Cargar lugar
      if (existingReview.place) {
        setSelectedPlace(existingReview.place)
      }

      // CORREGIR: Cargar fotos existentes desde campos individuales
      const photoUrls = collectPhotoUrls(existingReview)
      console.log("[DEBUG] URLs de fotos recopiladas:", photoUrls)

      if (photoUrls.length > 0) {
        const existingPhotos: PhotoData[] = photoUrls.map((url: string, index: number) => ({
          file: url,
          isPrimary: index === 0,
          url: url,
          id: `existing-${index}`,
          previewUrl: url,
        }))
        console.log("[DEBUG] Fotos procesadas:", existingPhotos)
        setPhotos(existingPhotos)
      } else {
        console.log("[DEBUG] No hay fotos para cargar")
        setPhotos([])
      }
    } else if (selectedPlaceFromProps) {
      if (selectedPlaceFromProps.name) {
        setSelectedPlace(selectedPlaceFromProps)
      }
    }
  }, [isEditMode, existingReview, selectedPlaceFromProps])

  // Labels actualizados sin las opciones dietéticas
  const ratingLabels = {
    food_taste: "Sabor de la comida",
    presentation: "Presentación del plato",
    portion_size: "Tamaño de la porción",
    music_acoustics: "Música y acústica",
    ambiance: "Ambientación",
    furniture_comfort: "Confort del mobiliario",
    service: "Servicio de mesa",
  }

  const handleRatingChange = (key: string, value: number[]) => {
    setRatings((prev) => ({ ...prev, [key]: value[0] }))
  }

  const handlePlaceSelect = (place: any) => {
    // Format the place with cleaned address before setting it
    const formattedPlace = formatPlaceForStorage(place)
    setSelectedPlace(formattedPlace)
  }

  const handleDietaryOptionChange = (option: string, checked: boolean) => {
    setDietaryOptions((prev) => ({ ...prev, [option]: checked }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    if (!selectedPlace || !priceRange || !category) {
      alert("Por favor completa todos los campos obligatorios")
      return
    }

    // Enhanced place validation
    if (!selectedPlace.place_id && !selectedPlace.google_place_id && !selectedPlace.id) {
      alert("Error: Información del lugar incompleta. Por favor selecciona el lugar nuevamente.")
      return
    }

    // Ensure we have the required place fields
    const placeId = selectedPlace.google_place_id || selectedPlace.place_id || selectedPlace.id
    const placeName = selectedPlace.name
    const placeAddress = selectedPlace.formatted_address || selectedPlace.address

    if (!placeId || !placeName || !placeAddress) {
      alert("Error: Información del lugar incompleta. Por favor selecciona el lugar nuevamente.")
      return
    }

    // Verificar que no hay fotos subiendo
    const uploadingPhotos = photos.filter((photo) => photo.isUploading)
    if (uploadingPhotos.length > 0) {
      alert(`Espera a que terminen de subir ${uploadingPhotos.length} foto(s)`)
      return
    }

    // Verificar fotos con errores
    const photosWithErrors = photos.filter((photo) => photo.uploadError)
    if (photosWithErrors.length > 0) {
      const continueWithErrors = confirm(
        `${photosWithErrors.length} foto(s) tuvieron errores al subir. ¿Quieres continuar sin ellas?`,
      )
      if (!continueWithErrors) {
        return
      }
    }

    setIsSubmitting(true)

    try {
      // Obtener el usuario actual
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        alert("Debes estar autenticado para enviar una reseña")
        return
      }

      // Clean the address before saving to database
      const cleanedAddress = cleanAddress(placeAddress)

      const placeData = {
        google_place_id: placeId,
        name: placeName,
        address: cleanedAddress, // Use cleaned address
        latitude: selectedPlace.geometry?.location?.lat || selectedPlace.latitude || -32.9442426,
        longitude: selectedPlace.geometry?.location?.lng || selectedPlace.longitude || -60.6505388,
        phone: selectedPlace.formatted_phone_number || selectedPlace.phone || null,
        website: selectedPlace.website || null,
        id: selectedPlace.id || null,
      }

      // Obtener solo las URLs de fotos ya subidas exitosamente
      const uploadedPhotoUrls = photos
        .filter((photo) => photo.url && !photo.uploadError && !photo.isUploading)
        .map((photo) => photo.url!)

      console.log("[DEBUG PHOTOS]", {
        totalPhotos: photos.length,
        uploadedUrls: uploadedPhotoUrls.length,
        uploadingPhotos: photos.filter((p) => p.isUploading).length,
        errorPhotos: photos.filter((p) => p.uploadError).length,
        urls: uploadedPhotoUrls,
      })

      // Crear el objeto de datos de la reseña con las URLs ya subidas
      const reviewData = {
        place: placeData,
        dish_name: dishName.trim()
          ? dishName.trim().toLowerCase().charAt(0).toUpperCase() + dishName.trim().toLowerCase().slice(1)
          : null,
        ...ratings,
        celiac_friendly: dietaryOptions.celiac_friendly,
        vegetarian_friendly: dietaryOptions.vegetarian_friendly,
        price_range: priceRange,
        restaurant_category: category,
        comment: comment.trim() || null,
        photo_urls: uploadedPhotoUrls,
        primary_photo_url: uploadedPhotoUrls.length > 0 ? uploadedPhotoUrls[0] : null,
      }

      console.log("[DEBUG REVIEW DATA]", {
        photo_urls: reviewData.photo_urls,
        primary_photo_url: reviewData.primary_photo_url,
        total_photos: uploadedPhotoUrls.length,
        cleaned_address: cleanedAddress,
        original_address: placeAddress,
        isEditMode,
        existingReviewId: existingReview?.id,
        category: reviewData.restaurant_category,
      })

      if (isEditMode && existingReview) {
        // Modo edición: actualizar reseña existente
        const updateData: any = {
          dish_name: reviewData.dish_name,
          food_taste: reviewData.food_taste,
          presentation: reviewData.presentation,
          portion_size: reviewData.portion_size,
          music_acoustics: reviewData.music_acoustics,
          ambiance: reviewData.ambiance,
          furniture_comfort: reviewData.furniture_comfort,
          service: reviewData.service,
          celiac_friendly: reviewData.celiac_friendly,
          vegetarian_friendly: reviewData.vegetarian_friendly,
          price_range: reviewData.price_range,
          restaurant_category: reviewData.restaurant_category,
          comment: reviewData.comment,
          photo_urls: reviewData.photo_urls,
          primary_photo_url: reviewData.primary_photo_url,
          updated_at: new Date().toISOString(),
        }

        // También actualizar campos individuales de fotos para compatibilidad
        for (let i = 1; i <= 6; i++) {
          updateData[`photo_${i}_url`] = uploadedPhotoUrls[i - 1] || null
        }

        const { error: updateError } = await supabase
          .from("detailed_reviews")
          .update(updateData)
          .eq("id", existingReview.id)

        if (updateError) {
          throw updateError
        }

        if (onSuccess) {
          onSuccess()
        }
      } else {
        // Modo creación: usar la función onSubmit existente
        if (onSubmit) {
          await onSubmit(reviewData)
        }
      }
    } catch (error) {
      console.error("Error submitting review:", error)
      const errorMessage = error instanceof Error ? error.message : "Error desconocido"
      setSubmitError(`Error al ${isEditMode ? "actualizar" : "enviar"} la reseña: ${errorMessage}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Contar fotos en diferentes estados
  const uploadingCount = photos.filter((photo) => photo.isUploading).length
  const errorCount = photos.filter((photo) => photo.uploadError).length
  const successCount = photos.filter((photo) => photo.url && !photo.uploadError).length

  // Debug logs para verificar el estado
  console.log("[DEBUG RENDER]", {
    isEditMode,
    category,
    photosCount: photos.length,
    existingReviewCategory: existingReview?.restaurant_category,
    categoryInCategories: category in RESTAURANT_CATEGORIES,
    availableCategories: Object.keys(RESTAURANT_CATEGORIES),
  })

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{isEditMode ? "Editar Reseña" : "Nueva Reseña"}</CardTitle>
          <CardDescription>
            {isEditMode ? "Modifica tu experiencia" : "Comparte tu experiencia completa"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Alert */}
            {submitError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            {/* Upload Status Alert */}
            {(uploadingCount > 0 || errorCount > 0) && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {uploadingCount > 0 && `${uploadingCount} foto(s) subiendo... `}
                  {errorCount > 0 && `${errorCount} foto(s) con errores. `}
                  {successCount > 0 && `${successCount} foto(s) listas.`}
                </AlertDescription>
              </Alert>
            )}

            {/* Búsqueda de lugar */}
            <div className="space-y-2">
              <Label>Lugar *</Label>
              {!selectedPlace ? (
                <div className="w-full">
                  <PlaceSearch onPlaceSelect={handlePlaceSelect} searchMode="api" />
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 border rounded-md bg-muted">
                  <div>
                    <p className="font-medium">{selectedPlace.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {cleanAddress(selectedPlace.formatted_address || selectedPlace.address)}
                    </p>
                  </div>
                  {!isEditMode && (
                    <Button type="button" variant="outline" size="sm" onClick={() => setSelectedPlace(null)}>
                      Cambiar
                    </Button>
                  )}
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
                {/* Celíaco friendly */}
                <label
                  htmlFor="celiac-friendly"
                  className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    dietaryOptions.celiac_friendly ? "bg-red-100 border-red-400" : "bg-muted/30"
                  }`}
                >
                  <Checkbox
                    id="celiac-friendly"
                    checked={dietaryOptions.celiac_friendly}
                    onCheckedChange={(checked) => handleDietaryOptionChange("celiac_friendly", !!checked)}
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium">🌾 Celíaco friendly</span>
                    <p className="text-xs text-muted-foreground">Tiene opciones sin gluten/TACC</p>
                  </div>
                </label>

                {/* Vegetariano friendly */}
                <label
                  htmlFor="vegetarian-friendly"
                  className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    dietaryOptions.vegetarian_friendly ? "bg-red-100 border-red-400" : "bg-muted/30"
                  }`}
                >
                  <Checkbox
                    id="vegetarian-friendly"
                    checked={dietaryOptions.vegetarian_friendly}
                    onCheckedChange={(checked) => handleDietaryOptionChange("vegetarian_friendly", !!checked)}
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium">🥬 Vegetariano friendly</span>
                    <p className="text-xs text-muted-foreground">Tiene buenas opciones vegetarianas/veganas</p>
                  </div>
                </label>
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

            {/* Categorías - Dropdown CORREGIDO */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">Categoría del restaurante *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona una categoría">
                    {category && RESTAURANT_CATEGORIES[category]
                      ? RESTAURANT_CATEGORIES[category]
                      : "Selecciona una categoría"}
                  </SelectValue>
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
              <Button type="submit" disabled={isLoading || isSubmitting || uploadingCount > 0} className="flex-1">
                {isSubmitting
                  ? isEditMode
                    ? "Actualizando..."
                    : "Enviando..."
                  : uploadingCount > 0
                    ? `Subiendo ${uploadingCount} foto(s)...`
                    : isEditMode
                      ? "Actualizar reseña"
                      : "Enviar reseña"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
