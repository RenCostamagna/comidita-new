"use client"

import { useState, useRef } from "react"
import { Camera, Upload, X, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { validateImageFile, getImageInfo } from "@/lib/image-compression"

interface PhotoUploadProps {
  photos: (File | string)[]
  onPhotosChange: (photos: (File | string)[]) => void
  maxPhotos?: number
  userId: string
}

export function PhotoUpload({ photos, onPhotosChange, maxPhotos = 2, userId }: PhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (files: FileList | null, fromCamera = false) => {
    if (!files || files.length === 0) return

    const file = files[0]

    // Validar archivo usando la nueva utilidad
    const validation = validateImageFile(file)
    if (!validation.isValid) {
      alert(validation.error)
      return
    }

    if (photos.length >= maxPhotos) {
      alert(`Solo puedes subir hasta ${maxPhotos} fotos`)
      return
    }

    setIsUploading(true)

    try {
      // Obtener información de la imagen
      const imageInfo = await getImageInfo(file)
      console.log("Información de la imagen:", imageInfo)

      // Agregar el archivo a la lista de fotos
      onPhotosChange([...photos, file])
    } catch (error) {
      console.error("Error processing image:", error)
      alert("Error al procesar la imagen")
    } finally {
      setIsUploading(false)
    }
  }

  const removePhoto = (index: number) => {
    const photo = photos[index]

    // Si es un File (URL temporal), revocar la URL para liberar memoria
    if (photo instanceof File && typeof window !== "undefined") {
      const url = getPhotoUrl(photo)
      if (url.startsWith("blob:")) {
        URL.revokeObjectURL(url)
      }
    }

    const newPhotos = photos.filter((_, i) => i !== index)
    onPhotosChange(newPhotos)
  }

  const getPhotoUrl = (photo: File | string) => {
    if (typeof photo === "string") {
      return photo
    }
    // Crear URL temporal para preview
    if (typeof window !== "undefined") {
      return URL.createObjectURL(photo)
    }
    return "/placeholder.svg?height=300&width=300&text=Imagen"
  }

  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">Fotos (opcional - máximo {maxPhotos})</Label>

      {/* Fotos subidas */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {photos.map((photo, index) => (
            <Card key={index} className="relative">
              <CardContent className="p-2">
                <div className="relative aspect-square">
                  <img
                    src={getPhotoUrl(photo) || "/placeholder.svg"}
                    alt={`Foto ${index + 1}`}
                    className="w-full h-full object-cover rounded-md"
                    onError={(e) => {
                      // Fallback si la imagen no carga
                      const target = e.target as HTMLImageElement
                      target.src = "/placeholder.svg?height=300&width=300&text=Error+cargando+imagen"
                    }}
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6"
                    onClick={() => removePhoto(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Botones para agregar fotos */}
      {photos.length < maxPhotos && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => cameraInputRef.current?.click()}
            className="flex-1"
            disabled={isUploading}
          >
            <Camera className="mr-2 h-4 w-4" />
            Tomar foto
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1"
            disabled={isUploading}
          >
            <Upload className="mr-2 h-4 w-4" />
            Subir desde galería
          </Button>
        </div>
      )}

      {/* Input para cámara */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files, true)}
      />

      {/* Input para galería */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files, false)}
      />

      {photos.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-2">Agrega fotos de tu experiencia</p>
            <p className="text-xs text-muted-foreground">Hasta {maxPhotos} fotos • Máximo 10MB cada una</p>
            <div className="mt-2">
              <p className="text-xs text-muted-foreground">Formatos: JPG, PNG, WebP, GIF</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
