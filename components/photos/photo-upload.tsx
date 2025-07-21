"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Camera, X, Loader2, AlertCircle, Check } from "lucide-react"
import { autoCompressImage } from "@/lib/image-compression"

interface PhotoUploadProps {
  onPhotosChange: (photos: { url: string; isUploading: boolean; error?: string }[]) => void
  maxPhotos?: number
  existingPhotos?: string[]
}

interface PhotoState {
  id: string
  file?: File
  previewUrl: string
  uploadedUrl?: string
  isUploading: boolean
  error?: string
  compressionStats?: {
    originalSize: number
    compressedSize: number
    compressionRatio: string
  }
}

export function PhotoUpload({ onPhotosChange, maxPhotos = 5, existingPhotos = [] }: PhotoUploadProps) {
  const [photos, setPhotos] = useState<PhotoState[]>(() => {
    // Inicializar con fotos existentes
    return existingPhotos.map((url, index) => ({
      id: `existing-${index}`,
      previewUrl: url,
      uploadedUrl: url,
      isUploading: false,
    }))
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  const updatePhotosCallback = (updatedPhotos: PhotoState[]) => {
    const photosForParent = updatedPhotos.map((photo) => ({
      url: photo.uploadedUrl || photo.previewUrl,
      isUploading: photo.isUploading,
      error: photo.error,
    }))
    onPhotosChange(photosForParent)
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])

    if (files.length === 0) return

    // Verificar límite de fotos
    if (photos.length + files.length > maxPhotos) {
      alert(`Solo puedes subir un máximo de ${maxPhotos} fotos`)
      return
    }

    // Procesar cada archivo
    for (const file of files) {
      // Validar tipo de archivo
      if (!file.type.startsWith("image/")) {
        alert(`${file.name} no es una imagen válida`)
        continue
      }

      // Validar tamaño (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} es demasiado grande (máximo 10MB)`)
        continue
      }

      const photoId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
      const previewUrl = URL.createObjectURL(file)

      // Agregar foto con estado de carga
      const newPhoto: PhotoState = {
        id: photoId,
        file,
        previewUrl,
        isUploading: true,
      }

      setPhotos((prev) => {
        const updated = [...prev, newPhoto]
        updatePhotosCallback(updated)
        return updated
      })

      // Comprimir y subir en background
      try {
        console.log(`📸 Iniciando procesamiento de: ${file.name}`)

        // Comprimir imagen
        const compressedFile = await autoCompressImage(file)

        const compressionStats = {
          originalSize: file.size,
          compressedSize: compressedFile.size,
          compressionRatio: ((1 - compressedFile.size / file.size) * 100).toFixed(1),
        }

        // Subir imagen comprimida
        const formData = new FormData()
        formData.append("file", compressedFile)

        const response = await fetch("/api/upload-single-photo", {
          method: "POST",
          body: formData,
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || "Error al subir la imagen")
        }

        console.log(`✅ Imagen subida exitosamente: ${result.url}`)

        // Actualizar estado con URL de la imagen subida
        setPhotos((prev) => {
          const updated = prev.map((photo) =>
            photo.id === photoId
              ? {
                  ...photo,
                  uploadedUrl: result.url,
                  isUploading: false,
                  compressionStats,
                }
              : photo,
          )
          updatePhotosCallback(updated)
          return updated
        })
      } catch (error) {
        console.error(`❌ Error subiendo ${file.name}:`, error)

        // Actualizar estado con error
        setPhotos((prev) => {
          const updated = prev.map((photo) =>
            photo.id === photoId
              ? {
                  ...photo,
                  isUploading: false,
                  error: error instanceof Error ? error.message : "Error desconocido",
                }
              : photo,
          )
          updatePhotosCallback(updated)
          return updated
        })
      }
    }

    // Limpiar input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const removePhoto = (photoId: string) => {
    setPhotos((prev) => {
      // Limpiar URL de preview si existe
      const photoToRemove = prev.find((p) => p.id === photoId)
      if (photoToRemove?.previewUrl && photoToRemove.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(photoToRemove.previewUrl)
      }

      const updated = prev.filter((photo) => photo.id !== photoId)
      updatePhotosCallback(updated)
      return updated
    })
  }

  const retryUpload = async (photoId: string) => {
    const photo = photos.find((p) => p.id === photoId)
    if (!photo?.file) return

    // Resetear estado de error y marcar como subiendo
    setPhotos((prev) => {
      const updated = prev.map((p) => (p.id === photoId ? { ...p, isUploading: true, error: undefined } : p))
      updatePhotosCallback(updated)
      return updated
    })

    // Intentar subir nuevamente
    try {
      const compressedFile = await autoCompressImage(photo.file)

      const formData = new FormData()
      formData.append("file", compressedFile)

      const response = await fetch("/api/upload-single-photo", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Error al subir la imagen")
      }

      // Actualizar con éxito
      setPhotos((prev) => {
        const updated = prev.map((p) => (p.id === photoId ? { ...p, uploadedUrl: result.url, isUploading: false } : p))
        updatePhotosCallback(updated)
        return updated
      })
    } catch (error) {
      // Actualizar con error
      setPhotos((prev) => {
        const updated = prev.map((p) =>
          p.id === photoId
            ? {
                ...p,
                isUploading: false,
                error: error instanceof Error ? error.message : "Error desconocido",
              }
            : p,
        )
        updatePhotosCallback(updated)
        return updated
      })
    }
  }

  const hasUploadingPhotos = photos.some((photo) => photo.isUploading)
  const hasErrorPhotos = photos.some((photo) => photo.error)

  return (
    <div className="space-y-4">
      {/* Botón para agregar fotos */}
      {photos.length < maxPhotos && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1"
            disabled={hasUploadingPhotos}
          >
            <Camera className="h-4 w-4 mr-2" />
            {photos.length === 0 ? "Agregar fotos" : "Agregar más fotos"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {/* Grid de fotos */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {photos.map((photo, index) => (
            <Card key={photo.id} className="relative overflow-hidden">
              <div className="aspect-square relative">
                <img
                  src={photo.previewUrl || "/placeholder.svg"}
                  alt={`Foto ${index + 1}`}
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                />

                {/* Overlay de estado */}
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  {photo.isUploading && (
                    <div className="text-white text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-1" />
                      <span className="text-xs">Subiendo...</span>
                    </div>
                  )}

                  {photo.error && (
                    <div className="text-white text-center">
                      <AlertCircle className="h-6 w-6 mx-auto mb-1 text-red-400" />
                      <span className="text-xs">Error</span>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => retryUpload(photo.id)}
                        className="mt-1 text-xs h-6"
                      >
                        Reintentar
                      </Button>
                    </div>
                  )}

                  {photo.uploadedUrl && !photo.isUploading && !photo.error && (
                    <div className="text-white text-center">
                      <Check className="h-6 w-6 mx-auto mb-1 text-green-400" />
                      <span className="text-xs">Subida</span>
                    </div>
                  )}
                </div>

                {/* Botón eliminar */}
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6"
                  onClick={() => removePhoto(photo.id)}
                >
                  <X className="h-3 w-3" />
                </Button>

                {/* Indicador de foto principal */}
                {index === 0 && photos.length > 1 && (
                  <div className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                    Principal
                  </div>
                )}
              </div>

              {/* Estadísticas de compresión */}
              {photo.compressionStats && (
                <div className="p-2 text-xs text-muted-foreground">
                  Reducido {photo.compressionStats.compressionRatio}%
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Información de estado */}
      <div className="text-sm text-muted-foreground space-y-1">
        {photos.length > 0 && (
          <p>
            {photos.length} de {maxPhotos} fotos
          </p>
        )}

        {hasUploadingPhotos && (
          <p className="text-blue-600 flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Subiendo fotos...
          </p>
        )}

        {hasErrorPhotos && (
          <p className="text-red-600 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Algunas fotos tuvieron errores. Puedes reintentarlas o continuar sin ellas.
          </p>
        )}

        {photos.length > 0 && !hasUploadingPhotos && !hasErrorPhotos && (
          <p className="text-green-600 flex items-center gap-1">
            <Check className="h-3 w-3" />
            Todas las fotos subidas correctamente
          </p>
        )}
      </div>

      {/* Ayuda */}
      <div className="text-xs text-muted-foreground">
        <p>• Las imágenes se comprimen automáticamente para ahorrar espacio</p>
        <p>• La primera foto será la imagen principal</p>
        <p>• Formatos soportados: JPG, PNG, GIF (máx. 10MB cada una)</p>
      </div>
    </div>
  )
}
