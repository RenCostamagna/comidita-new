"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RatingSlider } from "@/components/ui/rating-slider"
import { PriceSlider } from "@/components/ui/price-slider"
import { PhotoUpload } from "@/components/photos/photo-upload"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { MapPin, Star, DollarSign, Camera, Utensils } from "lucide-react"
import type { Place, DetailedReview } from "@/lib/types"

const RESTAURANT_CATEGORIES = [
  { value: "RESTAURANTES", label: "Restaurantes" },
  { value: "BARES", label: "Bares" },
  { value: "CAFETERIAS", label: "Cafeterías" },
  { value: "PIZZERIAS", label: "Pizzerías" },
  { value: "PARRILLAS", label: "Parrillas" },
  { value: "COMIDA_RAPIDA", label: "Comida rápida" },
  { value: "HELADERIAS", label: "Heladerías" },
  { value: "PANADERIAS", label: "Panaderías" },
  { value: "OTROS", label: "Otros" },
]

interface PhotoData {
  file?: File
  url?: string
  isExisting?: boolean
}

interface DetailedReviewFormProps {
  place?: Place
  existingReview?: DetailedReview
  onSuccess?: () => void
  onCancel?: () => void
}

export function DetailedReviewForm({ place, existingReview, onSuccess, onCancel }: DetailedReviewFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [photos, setPhotos] = useState<PhotoData[]>([])

  // Estados del formulario
  const [formData, setFormData] = useState({
    foodTaste: 5,
    presentation: 5,
    portionSize: 5,
    musicAcoustics: 5,
    ambiance: 5,
    furnitureComfort: 5,
    service: 5,
    celiacFriendly: false,
    vegetarianFriendly: false,
    recommendDish: false,
    dishName: "",
    priceRange: [10000, 25000] as [number, number],
    restaurantCategory: "",
    comment: "",
  })

  const { toast } = useToast()
  const supabase = createClient()
  const isEditMode = !!existingReview

  // Función para recopilar URLs de fotos desde campos individuales
  const collectPhotoUrls = (review: DetailedReview): string[] => {
    const urls: string[] = []

    // Recopilar desde campos individuales photo_1_url, photo_2_url, etc.
    for (let i = 1; i <= 5; i++) {
      const photoUrl = (review as any)[`photo_${i}_url`]
      if (photoUrl && typeof photoUrl === "string") {
        urls.push(photoUrl)
      }
    }

    console.log("[DEBUG] URLs de fotos recopiladas:", urls)
    return urls
  }

  useEffect(() => {
    if (existingReview) {
      console.log("[DEBUG RENDER] Cargando datos de reseña existente:", existingReview)

      // Cargar datos del formulario
      setFormData({
        foodTaste: existingReview.food_taste || 5,
        presentation: existingReview.presentation || 5,
        portionSize: existingReview.portion_size || 5,
        musicAcoustics: existingReview.music_acoustics || 5,
        ambiance: existingReview.ambiance || 5,
        furnitureComfort: existingReview.furniture_comfort || 5,
        service: existingReview.service || 5,
        celiacFriendly: existingReview.celiac_friendly || false,
        vegetarianFriendly: existingReview.vegetarian_friendly || false,
        recommendDish: !!existingReview.dish_name,
        dishName: existingReview.dish_name || "",
        priceRange: existingReview.price_range
          ? (existingReview.price_range.split("_").map((p) => Number.parseInt(p)) as [number, number])
          : [10000, 25000],
        restaurantCategory: existingReview.restaurant_category || "",
        comment: existingReview.comment || "",
      })

      console.log("[DEBUG] Categoría de la reseña:", existingReview.restaurant_category)

      // Cargar fotos existentes
      const photoUrls = collectPhotoUrls(existingReview)
      console.log("[DEBUG] Photo URLs de la reseña:", photoUrls)

      if (photoUrls.length > 0) {
        const existingPhotos: PhotoData[] = photoUrls.map((url) => ({
          url,
          isExisting: true,
        }))
        setPhotos(existingPhotos)
        console.log("[DEBUG] Fotos cargadas para edición:", existingPhotos)
      } else {
        console.log("[DEBUG] No hay fotos para cargar")
      }
    }
  }, [existingReview])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        toast({
          title: "Error",
          description: "Debes iniciar sesión para enviar una reseña",
          variant: "destructive",
        })
        return
      }

      // Subir fotos nuevas
      const photoUrls: string[] = []
      for (const photo of photos) {
        if (photo.isExisting && photo.url) {
          // Mantener fotos existentes
          photoUrls.push(photo.url)
        } else if (photo.file) {
          // Subir fotos nuevas
          const formData = new FormData()
          formData.append("files", photo.file)

          const uploadResponse = await fetch("/api/upload-photos", {
            method: "POST",
            body: formData,
          })

          if (uploadResponse.ok) {
            const uploadResult = await uploadResponse.json()
            if (uploadResult.urls && uploadResult.urls.length > 0) {
              photoUrls.push(uploadResult.urls[0])
            }
          }
        }
      }

      // Preparar datos para la base de datos
      const reviewData = {
        user_id: user.id,
        place_id: place?.id || existingReview?.place_id,
        food_taste: formData.foodTaste,
        presentation: formData.presentation,
        portion_size: formData.portionSize,
        music_acoustics: formData.musicAcoustics,
        ambiance: formData.ambiance,
        furniture_comfort: formData.furnitureComfort,
        service: formData.service,
        celiac_friendly: formData.celiacFriendly,
        vegetarian_friendly: formData.vegetarianFriendly,
        dish_name: formData.recommendDish ? formData.dishName : null,
        price_range: `${formData.priceRange[0]}_${formData.priceRange[1]}`,
        restaurant_category: formData.restaurantCategory,
        comment: formData.comment,
        // Mantener compatibilidad con ambos formatos
        photo_urls: photoUrls, // Formato array
        photo_1_url: photoUrls[0] || null, // Formato individual
        photo_2_url: photoUrls[1] || null,
        photo_3_url: photoUrls[2] || null,
        photo_4_url: photoUrls[3] || null,
        photo_5_url: photoUrls[4] || null,
      }

      let result
      if (isEditMode && existingReview) {
        // Actualizar reseña existente
        result = await supabase
          .from("detailed_reviews")
          .update({
            ...reviewData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingReview.id)
          .eq("user_id", user.id) // Verificación adicional de seguridad
      } else {
        // Crear nueva reseña
        result = await supabase.from("detailed_reviews").insert([reviewData])
      }

      if (result.error) {
        throw result.error
      }

      toast({
        title: isEditMode ? "Reseña actualizada" : "Reseña enviada",
        description: isEditMode
          ? "Tu reseña ha sido actualizada exitosamente"
          : "¡Gracias por compartir tu experiencia!",
      })

      onSuccess?.()
    } catch (error) {
      console.error("Error al enviar reseña:", error)
      toast({
        title: "Error",
        description: "No se pudo enviar la reseña. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const currentPlace = place || existingReview?.place

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            {isEditMode ? "Editar Reseña" : "Nueva Reseña"}
          </CardTitle>
          <CardDescription>
            {isEditMode ? "Modifica tu experiencia en este lugar" : "Comparte tu experiencia gastronómica"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentPlace && (
            <div className="mb-6 p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold">{currentPlace.name}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{currentPlace.address}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Calificaciones */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Calificaciones</h3>

              <RatingSlider
                label="Sabor de la comida"
                value={formData.foodTaste}
                onChange={(value) => setFormData((prev) => ({ ...prev, foodTaste: value }))}
              />

              <RatingSlider
                label="Presentación"
                value={formData.presentation}
                onChange={(value) => setFormData((prev) => ({ ...prev, presentation: value }))}
              />

              <RatingSlider
                label="Tamaño de la porción"
                value={formData.portionSize}
                onChange={(value) => setFormData((prev) => ({ ...prev, portionSize: value }))}
              />

              <RatingSlider
                label="Música/Acústica"
                value={formData.musicAcoustics}
                onChange={(value) => setFormData((prev) => ({ ...prev, musicAcoustics: value }))}
              />

              <RatingSlider
                label="Ambientación"
                value={formData.ambiance}
                onChange={(value) => setFormData((prev) => ({ ...prev, ambiance: value }))}
              />

              <RatingSlider
                label="Confort del mobiliario"
                value={formData.furnitureComfort}
                onChange={(value) => setFormData((prev) => ({ ...prev, furnitureComfort: value }))}
              />

              <RatingSlider
                label="Servicio de mesa"
                value={formData.service}
                onChange={(value) => setFormData((prev) => ({ ...prev, service: value }))}
              />
            </div>

            {/* Opciones dietéticas */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Opciones dietéticas</h3>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="celiac"
                  checked={formData.celiacFriendly}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, celiacFriendly: checked as boolean }))
                  }
                />
                <Label htmlFor="celiac" className="flex items-center gap-2">
                  🌾 Celíaco friendly
                  <span className="text-sm text-muted-foreground">Tiene opciones sin gluten/TACC</span>
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="vegetarian"
                  checked={formData.vegetarianFriendly}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, vegetarianFriendly: checked as boolean }))
                  }
                />
                <Label htmlFor="vegetarian" className="flex items-center gap-2">
                  🥗 Vegetariano friendly
                  <span className="text-sm text-muted-foreground">Tiene buenas opciones vegetarianas/veganas</span>
                </Label>
              </div>
            </div>

            {/* Recomendación de plato */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="recommend"
                  checked={formData.recommendDish}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, recommendDish: checked as boolean }))}
                />
                <Label htmlFor="recommend" className="flex items-center gap-2">
                  <Utensils className="h-4 w-4" />
                  ¿Querés recomendar algún plato?
                </Label>
              </div>

              {formData.recommendDish && (
                <div>
                  <Label htmlFor="dishName">Nombre del plato</Label>
                  <Input
                    id="dishName"
                    value={formData.dishName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, dishName: e.target.value }))}
                    placeholder="Ej: Milanesa con papas fritas"
                  />
                </div>
              )}
            </div>

            {/* Precio */}
            <div className="space-y-4">
              <Label className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Precio por persona *
              </Label>
              <PriceSlider
                value={formData.priceRange}
                onChange={(value) => setFormData((prev) => ({ ...prev, priceRange: value }))}
              />
            </div>

            {/* Categoría del restaurante */}
            {!isEditMode && (
              <div className="space-y-2">
                <Label htmlFor="category">Categoría del restaurante *</Label>
                <Select
                  value={formData.restaurantCategory}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, restaurantCategory: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {RESTAURANT_CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {isEditMode && (
              <div className="space-y-2">
                <Label htmlFor="category">Categoría del restaurante *</Label>
                <Select
                  value={formData.restaurantCategory}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, restaurantCategory: value }))}
                >
                  <SelectTrigger>
                    <SelectValue>
                      {RESTAURANT_CATEGORIES.find((cat) => cat.value === formData.restaurantCategory)?.label ||
                        "Selecciona una categoría"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {RESTAURANT_CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Fotos */}
            <div className="space-y-4">
              <Label className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Fotos (opcional)
              </Label>
              <PhotoUpload photos={photos} onPhotosChange={setPhotos} maxPhotos={5} />
            </div>

            {/* Comentario */}
            <div className="space-y-2">
              <Label htmlFor="comment">Comentario adicional (opcional)</Label>
              <Textarea
                id="comment"
                value={formData.comment}
                onChange={(e) => setFormData((prev) => ({ ...prev, comment: e.target.value }))}
                placeholder="Contanos más sobre tu experiencia..."
                rows={4}
              />
            </div>

            {/* Botones */}
            <div className="flex gap-4 pt-4">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel} className="flex-1 bg-transparent">
                  Cancelar
                </Button>
              )}
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting
                  ? isEditMode
                    ? "Actualizando..."
                    : "Enviando..."
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
