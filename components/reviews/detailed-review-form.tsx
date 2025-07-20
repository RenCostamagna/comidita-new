"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { MapPin, Star, Upload, AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { PhotoUpload } from "@/components/photos/photo-upload"
import { RatingSlider } from "@/components/ui/rating-slider"
import { uploadMultipleReviewPhotos, extractFilesFromPhotos } from "@/lib/storage"
import { compressImage } from "@/lib/image-compression"
import type { User } from "@supabase/supabase-js"

interface PhotoData {
  file: File | string
  isPrimary: boolean
  id?: string
}

interface Place {
  place_id: string
  name: string
  formatted_address: string
  rating?: number
  price_level?: number
  types?: string[]
  geometry?: {
    location: {
      lat: number
      lng: number
    }
  }
}

interface DetailedReviewFormProps {
  place: Place
  onSuccess?: () => void
  onCancel?: () => void
}

export function DetailedReviewForm({ place, onSuccess, onCancel }: DetailedReviewFormProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitProgress, setSubmitProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Form state
  const [reviewText, setReviewText] = useState("")
  const [photos, setPhotos] = useState<PhotoData[]>([])
  const [ratings, setRatings] = useState({
    overall: 5,
    food_taste: 5,
    presentation: 5,
    portion_size: 5,
    value_for_money: 5,
    service_quality: 5,
    ambiance: 5,
    cleanliness: 5,
  })

  // Dietary options
  const [dietaryOptions, setDietaryOptions] = useState({
    vegetarian_friendly: false,
    vegan_options: false,
    gluten_free: false,
    halal: false,
    kosher: false,
  })

  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase.auth])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setError("Debes iniciar sesión para escribir una reseña")
      return
    }

    setIsSubmitting(true)
    setError(null)
    setSubmitProgress(0)

    try {
      // Step 1: Create review record (10%)
      setSubmitProgress(10)
      const { data: reviewData, error: reviewError } = await supabase
        .from("reviews")
        .insert({
          user_id: user.id,
          place_id: place.place_id,
          place_name: place.name,
          place_address: place.formatted_address,
          review_text: reviewText,
          overall_rating: ratings.overall,
          food_taste: ratings.food_taste,
          presentation: ratings.presentation,
          portion_size: ratings.portion_size,
          value_for_money: ratings.value_for_money,
          service_quality: ratings.service_quality,
          ambiance: ratings.ambiance,
          cleanliness: ratings.cleanliness,
          vegetarian_friendly: dietaryOptions.vegetarian_friendly,
          vegan_options: dietaryOptions.vegan_options,
          gluten_free: dietaryOptions.gluten_free,
          halal: dietaryOptions.halal,
          kosher: dietaryOptions.kosher,
        })
        .select()
        .single()

      if (reviewError) throw reviewError

      const reviewId = reviewData.id
      console.log("✅ Reseña creada con ID:", reviewId)

      // Step 2: Process and upload photos if any (20-80%)
      let photoUrls: string[] = []
      if (photos.length > 0) {
        console.log(`📸 Procesando ${photos.length} fotos...`)

        // Extract only File objects from photos array
        const filesToUpload = extractFilesFromPhotos(photos)
        console.log(`📸 ${filesToUpload.length} archivos File encontrados para subir`)

        if (filesToUpload.length > 0) {
          setSubmitProgress(30)

          // Compress images before upload
          const compressedFiles: File[] = []
          for (let i = 0; i < filesToUpload.length; i++) {
            const file = filesToUpload[i]
            console.log(`🗜️ Comprimiendo imagen ${i + 1}/${filesToUpload.length}: ${file.name}`)

            try {
              const compressedFile = await compressImage(file, {
                maxWidth: 1920,
                maxHeight: 1920,
                quality: 0.8,
                maxSizeMB: 2,
              })
              compressedFiles.push(compressedFile)
              console.log(`✅ Imagen ${i + 1} comprimida: ${file.size} -> ${compressedFile.size} bytes`)
            } catch (compressionError) {
              console.warn(`⚠️ Error comprimiendo ${file.name}, usando original:`, compressionError)
              compressedFiles.push(file)
            }

            setSubmitProgress(30 + (i / filesToUpload.length) * 20)
          }

          // Upload compressed images
          setSubmitProgress(50)
          console.log(`📤 Subiendo ${compressedFiles.length} imágenes comprimidas...`)

          photoUrls = await uploadMultipleReviewPhotos(compressedFiles, user.id, reviewId.toString())
          console.log(`✅ ${photoUrls.length} fotos subidas exitosamente`)
        }
      }

      // Step 3: Update review with photo URLs (85%)
      setSubmitProgress(85)
      if (photoUrls.length > 0) {
        const { error: updateError } = await supabase
          .from("reviews")
          .update({
            photo_url: photoUrls[0], // Primary photo
            photo_url_2: photoUrls[1] || null,
            photo_url_3: photoUrls[2] || null,
            photo_url_4: photoUrls[3] || null,
            photo_url_5: photoUrls[4] || null,
            photo_url_6: photoUrls[5] || null,
          })
          .eq("id", reviewId)

        if (updateError) throw updateError
        console.log("✅ URLs de fotos actualizadas en la reseña")
      }

      // Step 4: Award points and check achievements (95%)
      setSubmitProgress(95)
      try {
        const { error: pointsError } = await supabase.rpc("award_review_points", {
          p_user_id: user.id,
          p_review_id: reviewId,
          p_photo_count: photoUrls.length,
        })

        if (pointsError) {
          console.warn("Error otorgando puntos:", pointsError)
        } else {
          console.log("✅ Puntos otorgados exitosamente")
        }
      } catch (pointsError) {
        console.warn("Error en sistema de puntos:", pointsError)
      }

      // Step 5: Complete (100%)
      setSubmitProgress(100)
      setSuccess(true)

      // Reset form
      setTimeout(() => {
        setReviewText("")
        setPhotos([])
        setRatings({
          overall: 5,
          food_taste: 5,
          presentation: 5,
          portion_size: 5,
          value_for_money: 5,
          service_quality: 5,
          ambiance: 5,
          cleanliness: 5,
        })
        setDietaryOptions({
          vegetarian_friendly: false,
          vegan_options: false,
          gluten_free: false,
          halal: false,
          kosher: false,
        })
        onSuccess?.()
      }, 2000)
    } catch (error) {
      console.error("Error enviando reseña:", error)
      setError(error instanceof Error ? error.message : "Error desconocido")
    } finally {
      setIsSubmitting(false)
      setSubmitProgress(0)
    }
  }

  const handleRatingChange = (category: string, value: number) => {
    setRatings((prev) => ({
      ...prev,
      [category]: value,
    }))
  }

  const handleDietaryChange = (option: string, checked: boolean) => {
    setDietaryOptions((prev) => ({
      ...prev,
      [option]: checked,
    }))
  }

  if (success) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-green-700 mb-2">¡Reseña Enviada!</h3>
          <p className="text-muted-foreground mb-4">
            Tu reseña ha sido publicada exitosamente. ¡Gracias por compartir tu experiencia!
          </p>
          <div className="flex justify-center space-x-4">
            <Button onClick={onSuccess} variant="default">
              Ver Reseñas
            </Button>
            <Button onClick={onCancel} variant="outline">
              Cerrar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Star className="h-5 w-5 text-yellow-500" />
          <span>Nueva Reseña</span>
        </CardTitle>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{place.name}</span>
        </div>
        <p className="text-xs text-muted-foreground">{place.formatted_address}</p>
      </CardHeader>

      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Review Text */}
          <div className="space-y-2">
            <Label htmlFor="review">Tu Experiencia</Label>
            <Textarea
              id="review"
              placeholder="Comparte los detalles de tu experiencia en este lugar..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              className="min-h-[120px]"
              required
            />
          </div>

          {/* Photo Upload */}
          <div className="space-y-2">
            <Label>Fotos del Plato</Label>
            <PhotoUpload photos={photos} onPhotosChange={setPhotos} maxPhotos={6} userId={user?.id} />
          </div>

          {/* Ratings */}
          <div className="space-y-4">
            <Label>Puntuaciones (1-10)</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <RatingSlider
                label="Sabor de la comida"
                value={ratings.food_taste}
                onChange={(value) => handleRatingChange("food_taste", value)}
              />
              <RatingSlider
                label="Presentación del plato"
                value={ratings.presentation}
                onChange={(value) => handleRatingChange("presentation", value)}
              />
              <RatingSlider
                label="Tamaño de la porción"
                value={ratings.portion_size}
                onChange={(value) => handleRatingChange("portion_size", value)}
              />
              <RatingSlider
                label="Relación calidad-precio"
                value={ratings.value_for_money}
                onChange={(value) => handleRatingChange("value_for_money", value)}
              />
              <RatingSlider
                label="Calidad del servicio"
                value={ratings.service_quality}
                onChange={(value) => handleRatingChange("service_quality", value)}
              />
              <RatingSlider
                label="Ambiente"
                value={ratings.ambiance}
                onChange={(value) => handleRatingChange("ambiance", value)}
              />
              <RatingSlider
                label="Limpieza"
                value={ratings.cleanliness}
                onChange={(value) => handleRatingChange("cleanliness", value)}
              />
              <RatingSlider
                label="Puntuación General"
                value={ratings.overall}
                onChange={(value) => handleRatingChange("overall", value)}
              />
            </div>
          </div>

          {/* Dietary Options */}
          <div className="space-y-3">
            <Label>Opciones Dietéticas Disponibles</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { key: "vegetarian_friendly", label: "Vegetariano" },
                { key: "vegan_options", label: "Vegano" },
                { key: "gluten_free", label: "Sin Gluten" },
                { key: "halal", label: "Halal" },
                { key: "kosher", label: "Kosher" },
              ].map((option) => (
                <label key={option.key} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dietaryOptions[option.key as keyof typeof dietaryOptions]}
                    onChange={(e) => handleDietaryChange(option.key, e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Progress Bar */}
          {isSubmitting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Enviando reseña...</span>
                <span>{submitProgress}%</span>
              </div>
              <Progress value={submitProgress} className="w-full" />
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !user}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Enviar Reseña
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
