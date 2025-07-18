"use client"

import { useState, useRef } from "react"
import { Camera, Upload, X, ImageIcon, Star, StarOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { validateImageFile, getImageInfo } from "@/lib/image-compression"

interface PhotoData {
  file: File | string
  isPrimary: boolean
  id?: string
}

interface PhotoUploadProps {
  photos: PhotoData[]
  onPhotosChange: (photos: PhotoData[]) => void
  maxPhotos?: number
  userId: string
}

export function PhotoUpload({ photos, onPhotosChange, maxPhotos = 6, userId }: PhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (files: FileList | null, fromCamera = false) => {
    if (!files || files.length === 0) return

    const selectedFiles = Array.from(files).slice(0, maxPhotos - photos.length)

    if (photos.length >= maxPhotos) {
      alert(`Solo puedes subir hasta ${maxPhotos} fotos`)
      return
    }

    setIsUploading(true)

    try {
      const newPhotos: PhotoData[] = []

      for (const file of selectedFiles) {
        // Validar archivo usando la nueva utilidad
        const validation = validateImageFile(file)
        if (!validation.isValid) {
          alert(`Error en ${file.name}: ${validation.error}`)
          continue
        }

        // Obtener información de la imagen
        const imageInfo = await getImageInfo(file)
        console.log("Información de la imagen:", imageInfo)

        // Agregar el archivo a la lista de fotos
        newPhotos.push({
          file,
          isPrimary: photos.length === 0 && newPhotos.length === 0, // Primera foto es primaria por defecto
        })
      }

      onPhotosChange([...photos, ...newPhotos])
    } catch (error) {
      console.error("Error processing images:", error)
      alert("Error al procesar las imágenes")
    } finally {
      setIsUploading(false)
    }
  }

  const removePhoto = (index: number) => {
    const photo = photos[index]

    // Si es un File (URL temporal), revocar la URL para liberar memoria
    if (photo.file instanceof File && typeof window !== "undefined") {
      const url = getPhotoUrl(photo.file)
      if (url.startsWith("blob:")) {
        URL.revokeObjectURL(url)
      }
    }

    const newPhotos = photos.filter((_, i) => i !== index)

    // Si eliminamos la foto primaria y hay otras fotos, hacer primaria la primera
    if (photo.isPrimary && newPhotos.length > 0) {
      newPhotos[0].isPrimary = true
    }

    onPhotosChange(newPhotos)
  }

  const setPrimaryPhoto = (index: number) => {
    const newPhotos = photos.map((photo, i) => ({
      ...photo,
      isPrimary: i === index,
    }))
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
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Fotos (opcional - máximo {maxPhotos})</Label>
        <Badge variant="outline" className="text-xs">
          {photos.length}/{maxPhotos}
        </Badge>
      </div>

      {/* Fotos subidas */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {photos.map((photoData, index) => (
            <Card key={index} className="relative">
              <CardContent className="p-2">
                <div className="relative aspect-square">
                  <img
                    src={getPhotoUrl(photoData.file) || "/placeholder.svg"}
                    alt={`Foto ${index + 1}`}
                    className="w-full h-full object-cover rounded-md"
                    onError={(e) => {
                      // Fallback si la imagen no carga
                      const target = e.target as HTMLImageElement
                      target.src = "/placeholder.svg?height=300&width=300&text=Error+cargando+imagen"
                    }}
                  />

                  {/* Botón para eliminar */}
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6"
                    onClick={() => removePhoto(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>

                  {/* Indicador de foto primaria */}
                  {photoData.isPrimary && (
                    <Badge
                      variant="default"
                      className="absolute top-1 left-1 text-xs bg-yellow-500 hover:bg-yellow-600"
                    >
                      <Star className="h-3 w-3 mr-1 fill-current" />
                      Principal
                    </Badge>
                  )}

                  {/* Botón para hacer primaria */}
                  {!photoData.isPrimary && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="absolute bottom-1 left-1 h-6 text-xs px-2"
                      onClick={() => setPrimaryPhoto(index)}
                    >
                      <StarOff className="h-3 w-3 mr-1" />
                      Hacer principal
                    </Button>
                  )}
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

      {/* Input para galería - permitir múltiples archivos */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
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
              <p className="text-xs text-muted-foreground mt-1">La primera foto será la imagen principal del plato</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Información sobre foto principal */}
      {photos.length > 0 && (
        <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
          <p className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
            La foto principal se mostrará destacada en las reseñas
          </p>
          <p className="mt-1">Toca "Hacer principal" en cualquier foto para cambiarla</p>
        </div>
      )}
    </div>
  )
}
