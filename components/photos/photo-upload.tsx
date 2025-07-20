"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { X, Upload, Camera, Star } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
  maxSizePerPhoto?: number // in MB
  acceptedFormats?: string[]
  userId?: string
}

export function PhotoUpload({
  photos,
  onPhotosChange,
  maxPhotos = 6,
  maxSizePerPhoto = 10,
  acceptedFormats = ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  userId = "temp-user",
}: PhotoUploadProps) {
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = async (fileList: FileList) => {
    setUploadError(null)
    setIsProcessing(true)
    setProcessingProgress(0)

    // Validación dura de FileList en el cliente
    const cleanedFiles = Array.from(fileList).map((file, i) => {
      const extension = file.type?.split("/")[1] || "jpg"
      const name =
        !file.name || file.name === "blob" || file.name === "image"
          ? `mobile_photo_${Date.now()}_${i}.${extension}`
          : file.name

      const type = file.type || "image/jpeg"

      return new File([file], name, {
        type,
        lastModified: file.lastModified,
      })
    })

    const newPhotoData: PhotoData[] = []
    const errors: string[] = []

    // Verificar límite total de fotos
    if (photos.length + cleanedFiles.length > maxPhotos) {
      setUploadError(`Máximo ${maxPhotos} fotos permitidas`)
      setIsProcessing(false)
      return
    }

    for (let i = 0; i < cleanedFiles.length; i++) {
      const file = cleanedFiles[i]
      setProcessingProgress(((i + 1) / cleanedFiles.length) * 100)

      try {
        // Validar archivo
        const validation = validateImageFile(file, maxSizePerPhoto, acceptedFormats)
        if (!validation.isValid) {
          errors.push(`${file.name}: ${validation.error}`)
          continue
        }

        // Obtener información de la imagen
        const imageInfo = await getImageInfo(file)
        console.log(`✅ Archivo procesado: ${file.name}`, {
          size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
          dimensions: `${imageInfo.width}x${imageInfo.height}`,
          type: file.type,
          originalName: fileList[i].name, // Log del nombre original para debugging
        })

        // Crear PhotoData object
        const photoData: PhotoData = {
          file: file,
          isPrimary: false, // Will be set based on user selection
          id: `photo-${Date.now()}-${i}`,
        }

        newPhotoData.push(photoData)
      } catch (error) {
        console.error(`Error procesando ${file.name}:`, error)
        errors.push(`${file.name}: Error al procesar`)
      }
    }

    if (errors.length > 0) {
      setUploadError(errors.join(", "))
    }

    if (newPhotoData.length > 0) {
      const updatedPhotos = updatePrimaryPhoto([...photos, ...newPhotoData])
      onPhotosChange(updatedPhotos)
      console.log(`✅ ${newPhotoData.length} fotos agregadas correctamente`)
    }

    setIsProcessing(false)
    setProcessingProgress(0)
  }

  // Update primary photo - if no photo is marked as primary, make the first one primary
  const updatePrimaryPhoto = (photoList: PhotoData[]): PhotoData[] => {
    const hasPrimary = photoList.some((photo) => photo.isPrimary)

    return photoList.map((photo, index) => ({
      ...photo,
      isPrimary: hasPrimary ? photo.isPrimary : index === 0,
    }))
  }

  // Set a specific photo as primary
  const setPrimaryPhoto = (targetIndex: number) => {
    const updatedPhotos = photos.map((photo, index) => ({
      ...photo,
      isPrimary: index === targetIndex,
    }))
    onPhotosChange(updatedPhotos)
    console.log(`⭐ Foto ${targetIndex + 1} marcada como principal`)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
    }
  }

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index)
    const updatedPhotos = updatePrimaryPhoto(newPhotos)
    onPhotosChange(updatedPhotos)
    console.log(`🗑️ Foto ${index + 1} eliminada`)
  }

  const openFileDialog = (e: React.MouseEvent) => {
    // Prevenir que el evento se propague al formulario padre
    e.preventDefault()
    e.stopPropagation()
    fileInputRef.current?.click()
  }

  const getPhotoPreviewUrl = (photo: PhotoData): string => {
    if (typeof photo.file === "string") {
      return photo.file // Already a URL
    } else {
      return URL.createObjectURL(photo.file) // File object
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload Button - More compact/narrow */}
      <div className="space-y-3">
        <div className="flex justify-center">
          <Button
            type="button"
            onClick={openFileDialog}
            disabled={photos.length >= maxPhotos || isProcessing}
            className="max-w-md bg-red-500 hover:bg-red-600 text-white font-medium rounded-full h-8 w-full"
            size="lg"
          >
            <Upload className="h-4 w-4 mr-2" />
            <Camera className="h-4 w-4 mr-2" />
            Subir fotos
          </Button>
        </div>

        <div className="text-center space-y-1">
          
          
          
        </div>
      </div>

      {/* Processing State */}
      {isProcessing && (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              <div className="space-y-2 w-full max-w-xs">
                <p className="text-sm text-muted-foreground text-center">Procesando fotos...</p>
                <Progress value={processingProgress} className="w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Photos Preview Section */}
      {photos.length > 0 && !isProcessing && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Fotos de la reseña</h3>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {photos.map((photo, index) => (
              <div key={photo.id || index} className="relative group">
                <div className="aspect-square relative overflow-hidden rounded-lg border">
                  <img
                    src={getPhotoPreviewUrl(photo) || "/placeholder.svg"}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />

                  {/* Overlay for better button visibility */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />

                  {/* Delete button - top right */}
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity z-20 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                      removePhoto(index)
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>

                  {/* Primary badge - top left when selected */}
                  {photo.isPrimary && (
                    <div className="absolute top-2 left-2 z-10">
                      <Badge className="text-xs bg-white/90 text-gray-800 border-0 rounded-full px-2 py-1">
                        <Star className="h-3 w-3 mr-1 fill-current text-yellow-500" />
                        Principal
                      </Badge>
                    </div>
                  )}

                  {/* Primary selection button - bottom center, minimalist with shorter text */}
                  {!photo.isPrimary && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute bottom-2 left-1/2 transform -translate-x-1/2 h-7 px-2 bg-white/90 hover:bg-white text-gray-700 hover:text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity z-20 rounded-full text-xs font-medium"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setPrimaryPhoto(index)
                      }}
                    >
                      <Star className="h-3 w-3 mr-1" />
                      Principal
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Instructions */}
          <div className="text-center">
            
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedFormats.join(",")}
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Error Message */}
      {uploadError && (
        <Alert variant="destructive">
          <AlertDescription>{uploadError}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
