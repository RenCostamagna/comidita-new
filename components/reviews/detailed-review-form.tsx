"use client"

import { AlertDescription } from "@/components/ui/alert"

import { Alert } from "@/components/ui/alert"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RatingSlider } from "@/components/ui/rating-slider"
import { PriceSlider } from "@/components/ui/price-slider"
import { Checkbox } from "@/components/ui/checkbox"
import { PhotoUpload } from "@/components/photos/photo-upload"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import {
  Star,
  MapPin,
  Clock,
  DollarSign,
  Users,
  Utensils,
  Heart,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react"
import { getRatingLabel } from "@/lib/rating-labels"

interface PhotoData {
  file: File | string
  isPrimary: boolean
  id?: string
  isUploading?: boolean
  uploadProgress?: number
  uploadError?: string
  previewUrl?: string
}

interface DetailedReviewFormProps {
  placeId: string
  placeName: string
  placeAddress?: string
  onSuccess?: () => void
  onCancel?: () => void
}

interface DietaryOption {
  id: string
  label: string
  checked: boolean
}

export function DetailedReviewForm({ placeId, placeName, placeAddress, onSuccess, onCancel }: DetailedReviewFormProps) {
  // Estados principales
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Estados del formulario
  const [overallRating, setOverallRating] = useState(4)
  const [foodRating, setFoodRating] = useState(4)
  const [serviceRating, setServiceRating] = useState(4)
  const [ambianceRating, setAmbianceRating] = useState(4)
  const [valueRating, setValueRating] = useState(4)

  const [reviewText, setReviewText] = useState("")
  const [priceRange, setPriceRange] = useState(2)
  const [visitDate, setVisitDate] = useState("")
  const [partySize, setPartySize] = useState(2)
  const [wouldRecommend, setWouldRecommend] = useState(true)

  // Estados de opciones dietéticas
  const [dietaryOptions, setDietaryOptions] = useState<DietaryOption[]>([
    { id: "vegetarian", label: "Opciones vegetarianas", checked: false },
    { id: "vegan", label: "Opciones veganas", checked: false },
    { id: "gluten_free", label: "Sin gluten", checked: false },
    { id: "dairy_free", label: "Sin lácteos", checked: false },
    { id: "keto", label: "Keto-friendly", checked: false },
    { id: "halal", label: "Halal", checked: false },
  ])

  // Estados de fotos
  const [photos, setPhotos] = useState<PhotoData[]>([])

  const router = useRouter()
  const supabase = createClient()

  // Establecer fecha por defecto (hoy)
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0]
    setVisitDate(today)
  }, [])

  const handleDietaryOptionChange = (optionId: string, checked: boolean) => {
    setDietaryOptions((prev) => prev.map((option) => (option.id === optionId ? { ...option, checked } : option)))
  }

  const validateForm = () => {
    if (reviewText.trim().length < 10) {
      setError("La reseña debe tener al menos 10 caracteres")
      return false
    }

    if (!visitDate) {
      setError("Por favor selecciona la fecha de tu visita")
      return false
    }

    // Verificar que no haya fotos subiendo
    const uploadingPhotos = photos.filter((photo) => photo.isUploading)
    if (uploadingPhotos.length > 0) {
      setError(`Espera a que terminen de subir ${uploadingPhotos.length} foto${uploadingPhotos.length > 1 ? "s" : ""}`)
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)
    setError(null)

    try {
      // Obtener usuario actual
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error("Debes iniciar sesión para escribir una reseña")
      }

      // Preparar URLs de fotos (solo las que están subidas exitosamente)
      const photoUrls = photos
        .filter((photo) => typeof photo.file === "string" && !photo.isUploading && !photo.uploadError)
        .map((photo) => photo.file as string)

      console.log("📷 Fotos a guardar:", photoUrls)

      // Preparar opciones dietéticas seleccionadas
      const selectedDietaryOptions = dietaryOptions.filter((option) => option.checked).map((option) => option.id)

      // Datos de la reseña
      const reviewData = {
        place_id: placeId,
        user_id: user.id,
        overall_rating: overallRating,
        food_rating: foodRating,
        service_rating: serviceRating,
        ambiance_rating: ambianceRating,
        value_rating: valueRating,
        review_text: reviewText.trim(),
        price_range: priceRange,
        visit_date: visitDate,
        party_size: partySize,
        would_recommend: wouldRecommend,
        dietary_options: selectedDietaryOptions,
        photo_urls: photoUrls,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      console.log("📝 Datos de reseña a enviar:", reviewData)

      // Insertar reseña en la base de datos
      const { data: reviewResult, error: reviewError } = await supabase
        .from("reviews")
        .insert([reviewData])
        .select()
        .single()

      if (reviewError) {
        console.error("Error insertando reseña:", reviewError)
        throw new Error(reviewError.message || "Error al guardar la reseña")
      }

      console.log("✅ Reseña guardada exitosamente:", reviewResult)

      // Mostrar éxito
      setSuccess(true)

      // Llamar callback de éxito si existe
      setTimeout(() => {
        if (onSuccess) {
          onSuccess()
        } else {
          router.push(`/places/${placeId}`)
        }
      }, 2000)
    } catch (error) {
      console.error("Error enviando reseña:", error)
      setError(error instanceof Error ? error.message : "Error al enviar la reseña")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-green-700 mb-2">¡Reseña enviada!</h2>
          <p className="text-muted-foreground mb-4">Gracias por compartir tu experiencia en {placeName}</p>
          <div className="animate-pulse">
            <Loader2 className="h-4 w-4 animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground mt-2">Redirigiendo...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Escribir Reseña
          </CardTitle>
          <div className="space-y-1">
            <h3 className="font-semibold">{placeName}</h3>
            {placeAddress && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {placeAddress}
              </p>
            )}
          </div>
        </CardHeader>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Calificaciones */}
        <Card>
          <CardHeader>
            <CardTitle>Calificaciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-base font-medium">Calificación General</Label>
              <RatingSlider
                value={overallRating}
                onValueChange={setOverallRating}
                label={getRatingLabel(overallRating)}
                className="mt-2"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Comida</Label>
                <RatingSlider
                  value={foodRating}
                  onValueChange={setFoodRating}
                  label={getRatingLabel(foodRating)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Servicio</Label>
                <RatingSlider
                  value={serviceRating}
                  onValueChange={setServiceRating}
                  label={getRatingLabel(serviceRating)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Ambiente</Label>
                <RatingSlider
                  value={ambianceRating}
                  onValueChange={setAmbianceRating}
                  label={getRatingLabel(ambianceRating)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Relación Calidad-Precio</Label>
                <RatingSlider
                  value={valueRating}
                  onValueChange={setValueRating}
                  label={getRatingLabel(valueRating)}
                  className="mt-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reseña escrita */}
        <Card>
          <CardHeader>
            <CardTitle>Tu Experiencia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="review-text">Cuéntanos sobre tu experiencia *</Label>
              <Textarea
                id="review-text"
                placeholder="Describe tu experiencia: la comida, el servicio, el ambiente, etc."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className="mt-2 min-h-[120px]"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">{reviewText.length}/500 caracteres (mínimo 10)</p>
            </div>
          </CardContent>
        </Card>

        {/* Fotos */}
        <Card>
          <CardHeader>
            <CardTitle>Fotos</CardTitle>
            <p className="text-sm text-muted-foreground">Comparte fotos de tu experiencia (opcional)</p>
          </CardHeader>
          <CardContent>
            <PhotoUpload photos={photos} onPhotosChange={setPhotos} maxPhotos={6} maxSizePerPhoto={10} />
          </CardContent>
        </Card>

        {/* Detalles de la visita */}
        <Card>
          <CardHeader>
            <CardTitle>Detalles de tu Visita</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="visit-date" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Fecha de visita *
                </Label>
                <Input
                  id="visit-date"
                  type="date"
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  className="mt-2"
                  required
                />
              </div>

              <div>
                <Label htmlFor="party-size" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Tamaño del grupo
                </Label>
                <Input
                  id="party-size"
                  type="number"
                  min="1"
                  max="20"
                  value={partySize}
                  onChange={(e) => setPartySize(Number(e.target.value))}
                  className="mt-2"
                />
              </div>
            </div>

            <div>
              <Label className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Rango de precios
              </Label>
              <PriceSlider value={priceRange} onValueChange={setPriceRange} className="mt-2" />
            </div>
          </CardContent>
        </Card>

        {/* Opciones dietéticas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Utensils className="h-4 w-4" />
              Opciones Dietéticas
            </CardTitle>
            <p className="text-sm text-muted-foreground">¿Qué opciones dietéticas especiales encontraste?</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {dietaryOptions.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={option.id}
                    checked={option.checked}
                    onCheckedChange={(checked) => handleDietaryOptionChange(option.id, checked as boolean)}
                  />
                  <Label htmlFor={option.id} className="text-sm font-normal cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recomendación */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Recomendación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Input
                id="recommend"
                type="checkbox"
                checked={wouldRecommend}
                onChange={(e) => setWouldRecommend(e.target.checked)}
              />
              <Label htmlFor="recommend">¿Recomendarías este lugar a otros?</Label>
            </div>
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Botones */}
        <div className="flex gap-4 pt-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 bg-transparent"
            >
              Cancelar
            </Button>
          )}

          <Button type="submit" disabled={isSubmitting || photos.some((p) => p.isUploading)} className="flex-1">
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Enviando...
              </>
            ) : (
              "Enviar Reseña"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
