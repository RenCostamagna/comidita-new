"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { X, Upload, Camera, AlertCircle, Plus, GripVertical, Smartphone, Zap } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  validateImageFile,
  getImageInfo,
  compressImageAdvanced,
  isMobileDevice,
  willExceedPayloadLimit,
} from "@/lib/image-compression"

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
  const [dragActive, setDragActive] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [processingStatus, setProcessingStatus] = useState("")
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  // Touch/mobile drag state
  const [touchDragIndex, setTouchDragIndex] = useState<number | null>(null)
  const [touchStartPos, setTouchStartPos] = useState<{ x: number; y: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const isMobile = isMobileDevice()

  const handleFiles = async (fileList: FileList) => {
    setUploadError(null)
    setIsProcessing(true)
    setProcessingProgress(0)
    setProcessingStatus("Validando archivos...")

    const newPhotoData: PhotoData[] = []
    const errors: string[] = []

    // Verificar límite total de fotos
    if (photos.length + fileList.length > maxPhotos) {
      setUploadError(`Máximo ${maxPhotos} fotos permitidas`)
      setIsProcessing(false)
      return
    }

    // Convertir FileList a Array para mejor manejo
    const filesArray = Array.from(fileList)

    // Verificar si el payload será muy grande
    const willExceedLimit = willExceedPayloadLimit(filesArray, 3.5)
    const shouldCompress = isMobile || willExceedLimit || filesArray.some((f) => f.size > 2 * 1024 * 1024)

    if (shouldCompress) {
      console.log("📱 Compresión automática activada:", {
        isMobile,
        willExceedLimit,
        totalFiles: filesArray.length,
        totalSize: `${(filesArray.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024).toFixed(2)}MB`,
      })
    }

    for (let i = 0; i < filesArray.length; i++) {
      const file = filesArray[i]
      const progressBase = (i / filesArray.length) * 100
      setProcessingProgress(progressBase)
      setProcessingStatus(`Procesando ${file.name}...`)

      try {
        // Validar archivo
        const validation = validateImageFile(file, maxSizePerPhoto, acceptedFormats)
        if (!validation.isValid) {
          errors.push(`${file.name}: ${validation.error}`)
          continue
        }

        let processedFile = file

        // Comprimir si es necesario
        if (shouldCompress) {
          setProcessingStatus(`Optimizando ${file.name}...`)

          try {
            processedFile = await compressImageAdvanced(file, {
              maxWidth: isMobile ? 800 : 1200,
              maxHeight: isMobile ? 600 : 900,
              quality: isMobile ? 0.6 : 0.7,
              outputFormat: "jpeg",
              isMobile,
            })

            console.log(`✅ Foto optimizada: ${file.name}`, {
              original: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
              compressed: `${(processedFile.size / 1024 / 1024).toFixed(2)}MB`,
              reduction: `${(((file.size - processedFile.size) / file.size) * 100).toFixed(1)}%`,
            })
          } catch (compressionError) {
            console.warn(`⚠️ Error comprimiendo ${file.name}, usando original:`, compressionError)
            // Si falla la compresión, usar el archivo original
          }
        }

        // Obtener información de la imagen procesada
        const imageInfo = await getImageInfo(processedFile)
        console.log(`📷 Archivo procesado: ${processedFile.name}`, {
          size: `${(processedFile.size / 1024 / 1024).toFixed(2)}MB`,
          dimensions: `${imageInfo.width}x${imageInfo.height}`,
          type: processedFile.type,
        })

        // Crear PhotoData object
        const photoData: PhotoData = {
          file: processedFile,
          isPrimary: false, // Will be set based on position
          id: `photo-${Date.now()}-${i}`,
        }

        newPhotoData.push(photoData)
      } catch (error) {
        console.error(`❌ Error procesando ${file.name}:`, error)
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

      // Mostrar mensaje de optimización si se comprimieron fotos
      if (shouldCompress && newPhotoData.length > 0) {
        setProcessingStatus(`✨ ${newPhotoData.length} fotos optimizadas para móvil`)
        setTimeout(() => setProcessingStatus(""), 3000)
      }
    }

    setIsProcessing(false)
    setProcessingProgress(0)
  }

  // Update primary photo based on position (first photo is always primary)
  const updatePrimaryPhoto = (photoList: PhotoData[]): PhotoData[] => {
    return photoList.map((photo, index) => ({
      ...photo,
      isPrimary: index === 0,
    }))
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
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

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  const getPhotoPreviewUrl = (photo: PhotoData): string => {
    if (typeof photo.file === "string") {
      return photo.file // Already a URL
    } else {
      return URL.createObjectURL(photo.file) // File object
    }
  }

  // Reorder photos function
  const reorderPhotos = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex) return

      const newPhotos = [...photos]
      const draggedPhoto = newPhotos[fromIndex]

      // Remove dragged photo from its original position
      newPhotos.splice(fromIndex, 1)

      // Insert at new position
      newPhotos.splice(toIndex, 0, draggedPhoto)

      // Update primary photo based on new positions
      const updatedPhotos = updatePrimaryPhoto(newPhotos)
      onPhotosChange(updatedPhotos)

      console.log(`📷 Foto movida de posición ${fromIndex + 1} a ${toIndex + 1}`)
    },
    [photos, onPhotosChange],
  )

  // Desktop drag handlers
  const handlePhotosDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/html", "photo-reorder")
  }

  const handlePhotosDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"

    // Only handle photo reordering, not file uploads
    if (e.dataTransfer.types.includes("text/html")) {
      setDragOverIndex(index)
    }
  }

  const handlePhotosDragLeave = () => {
    setDragOverIndex(null)
  }

  const handlePhotosDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    e.stopPropagation()

    // Only handle photo reordering
    if (draggedIndex !== null && e.dataTransfer.getData("text/html") === "photo-reorder") {
      reorderPhotos(draggedIndex, dropIndex)
    }

    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handlePhotosDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  // Mobile touch handlers
  const handleTouchStart = (e: React.TouchEvent, index: number) => {
    const touch = e.touches[0]
    setTouchStartPos({ x: touch.clientX, y: touch.clientY })
    setTouchDragIndex(index)

    // Add a small delay to distinguish between tap and drag
    setTimeout(() => {
      if (touchDragIndex === index && touchStartPos) {
        setIsDragging(true)
      }
    }, 150)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || touchDragIndex === null || !touchStartPos) return

    e.preventDefault() // Prevent scrolling while dragging

    const touch = e.touches[0]
    const deltaX = Math.abs(touch.clientX - touchStartPos.x)
    const deltaY = Math.abs(touch.clientY - touchStartPos.y)

    // Only start dragging if moved significantly
    if (deltaX > 10 || deltaY > 10) {
      // Find which photo we're over
      const element = document.elementFromPoint(touch.clientX, touch.clientY)
      const photoElement = element?.closest("[data-photo-index]")

      if (photoElement) {
        const overIndex = Number.parseInt(photoElement.getAttribute("data-photo-index") || "0")
        setDragOverIndex(overIndex)
      }
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging || touchDragIndex === null) {
      // Reset states for tap
      setTouchDragIndex(null)
      setTouchStartPos(null)
      setIsDragging(false)
      return
    }

    // Handle drop
    if (dragOverIndex !== null && dragOverIndex !== touchDragIndex) {
      reorderPhotos(touchDragIndex, dragOverIndex)
    }

    // Reset all touch states
    setTouchDragIndex(null)
    setTouchStartPos(null)
    setIsDragging(false)
    setDragOverIndex(null)
  }

  const handleTouchCancel = () => {
    setTouchDragIndex(null)
    setTouchStartPos(null)
    setIsDragging(false)
    setDragOverIndex(null)
  }

  return (
    <div className="space-y-4">
      {/* Mobile optimization notice */}
      {isMobile && (
        <Alert className="border-blue-200 bg-blue-50">
          <Smartphone className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <div className="flex items-center gap-2">
              <Zap className="h-3 w-3" />
              <span className="text-xs">Optimización automática activada para móvil</span>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Upload Area */}
      <Card
        className={`border-2 border-dashed transition-colors cursor-pointer ${
          dragActive
            ? "border-primary bg-primary/5"
            : photos.length >= maxPhotos
              ? "border-muted bg-muted/20"
              : "border-muted-foreground/25 hover:border-primary hover:bg-primary/5"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={photos.length < maxPhotos ? openFileDialog : undefined}
      >
        <CardContent className="p-6">
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              <div className="space-y-2 w-full max-w-xs">
                <p className="text-sm text-muted-foreground text-center">{processingStatus}</p>
                <Progress value={processingProgress} className="w-full" />
                {isMobile && <p className="text-xs text-blue-600 text-center">✨ Optimizando para móvil...</p>}
              </div>
            </div>
          ) : photos.length === 0 ? (
            // Empty state - show upload instructions
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
              <div className="flex items-center justify-center space-x-2">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <Camera className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Arrastra fotos aquí o haz clic para seleccionar</p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Máximo {maxPhotos} fotos • JPG, PNG, WebP</p>
                  {isMobile && <p className="text-blue-600">📱 Se optimizarán automáticamente para móvil</p>}
                </div>
              </div>
            </div>
          ) : (
            // Photos grid with add more option
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {photos.map((photo, index) => (
                  <div
                    key={photo.id || index}
                    data-photo-index={index}
                    className={`relative group ${dragOverIndex === index ? "ring-2 ring-primary ring-offset-2" : ""} ${
                      draggedIndex === index || touchDragIndex === index ? "opacity-50" : ""
                    } ${isDragging && touchDragIndex === index ? "scale-105 z-10" : ""} transition-all duration-200`}
                    draggable
                    onDragStart={(e) => handlePhotosDragStart(e, index)}
                    onDragOver={(e) => handlePhotosDragOver(e, index)}
                    onDragLeave={handlePhotosDragLeave}
                    onDrop={(e) => handlePhotosDrop(e, index)}
                    onDragEnd={handlePhotosDragEnd}
                    onTouchStart={(e) => handleTouchStart(e, index)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onTouchCancel={handleTouchCancel}
                  >
                    <div className="aspect-square relative overflow-hidden rounded-lg border cursor-move touch-none">
                      <img
                        src={getPhotoPreviewUrl(photo) || "/placeholder.svg"}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover pointer-events-none"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />

                      {/* Drag handle */}
                      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <div className="bg-black/50 rounded p-1">
                          <GripVertical className="h-3 w-3 text-white" />
                        </div>
                      </div>

                      {/* Delete button */}
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity z-20"
                        onClick={(e) => {
                          e.stopPropagation()
                          e.preventDefault()
                          removePhoto(index)
                        }}
                        onTouchEnd={(e) => {
                          e.stopPropagation()
                          e.preventDefault()
                          removePhoto(index)
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>

                      {/* Primary badge */}
                      {photo.isPrimary && (
                        <Badge className="absolute bottom-2 left-2 text-xs pointer-events-none" variant="secondary">
                          Plato
                        </Badge>
                      )}

                      {/* Mobile drag indicator */}
                      {isDragging && touchDragIndex === index && (
                        <div className="absolute inset-0 bg-primary/20 border-2 border-primary rounded-lg" />
                      )}
                    </div>
                  </div>
                ))}

                {/* Add more photos button */}
                {photos.length < maxPhotos && (
                  <div
                    className="aspect-square relative overflow-hidden rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary hover:bg-primary/5 transition-colors flex items-center justify-center cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation()
                      openFileDialog()
                    }}
                  >
                    <div className="text-center space-y-2">
                      <Plus className="h-6 w-6 text-muted-foreground mx-auto" />
                      <p className="text-xs text-muted-foreground">Agregar más</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Instructions when photos are present */}
              <div className="text-center space-y-2">
                <p className="text-xs text-muted-foreground">
                  {isMobile ? "Mantén presionado para reordenar" : "Arrastra las fotos para reordenar"}
                </p>
                <div className="flex items-center justify-center gap-2">
                  <Badge variant="outline">
                    {photos.length} de {maxPhotos} fotos
                  </Badge>
                  {isMobile && (
                    <Badge variant="outline" className="text-blue-600 border-blue-200">
                      <Zap className="h-3 w-3 mr-1" />
                      Optimizado
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {uploadError}
            {isMobile && uploadError.includes("muy grande") && (
              <div className="mt-2 text-xs">
                💡 Tip: Las fotos se optimizan automáticamente en móvil. Si persiste el error, intenta con menos fotos.
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
