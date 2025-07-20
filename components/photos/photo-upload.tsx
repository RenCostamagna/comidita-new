"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { X, Upload, Camera, Star, Bug } from "lucide-react"
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

interface DebugLog {
  timestamp: string
  type: "info" | "error" | "warning"
  message: string
  data?: any
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
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([])
  const [showDebug, setShowDebug] = useState(false)
  const [currentProcessingFile, setCurrentProcessingFile] = useState<string>("")

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Debug logging function
  const addDebugLog = (type: "info" | "error" | "warning", message: string, data?: any) => {
    const log: DebugLog = {
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
      data,
    }
    setDebugLogs((prev) => [...prev.slice(-9), log]) // Keep last 10 logs
    console.log(`[DEBUG ${type.toUpperCase()}]`, message, data)
  }

  const clearDebugLogs = () => {
    setDebugLogs([])
  }

  // Función para liberar memoria de URLs de objetos
  const cleanupObjectUrls = () => {
    // Limpiar URLs de objetos que ya no se usan
    if (typeof window !== "undefined") {
      // Forzar garbage collection si está disponible
      if (window.gc) {
        window.gc()
      }
    }
  }

  // Función para procesar archivos con delays más largos y mejor manejo de memoria
  const processFilesWithDelay = async (files: File[]) => {
    const results: PhotoData[] = []
    const errors: string[] = []
    const DELAY_BETWEEN_FILES = 500 // Aumentado a 500ms
    const MAX_CONCURRENT_PROCESSING = 1 // Solo procesar 1 archivo a la vez

    addDebugLog("info", `⏱️ Iniciando procesamiento con delay de ${DELAY_BETWEEN_FILES}ms entre archivos`)

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const startTime = Date.now()

      setCurrentProcessingFile(`${file.name} (${i + 1}/${files.length})`)
      setProcessingProgress(((i + 1) / files.length) * 100)

      addDebugLog("info", `🔄 [${i + 1}/${files.length}] Iniciando procesamiento: ${file.name}`, {
        size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        type: file.type,
        timestamp: new Date().toISOString(),
      })

      try {
        // Validar archivo primero (rápido)
        const validation = validateImageFile(file, maxSizePerPhoto, acceptedFormats)
        if (!validation.isValid) {
          const errorMsg = `${file.name}: ${validation.error}`
          addDebugLog("error", `❌ Validación falló: ${errorMsg}`)
          errors.push(errorMsg)
          continue
        }

        addDebugLog("info", `✅ Validación OK para ${file.name}`)

        // Delay antes del procesamiento pesado
        await new Promise((resolve) => setTimeout(resolve, 200))

        // Obtener información de la imagen con timeout
        let imageInfo
        try {
          const imageInfoPromise = getImageInfo(file)
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout obteniendo info de imagen")), 10000),
          )

          imageInfo = await Promise.race([imageInfoPromise, timeoutPromise])

          const processingTime = Date.now() - startTime
          addDebugLog("info", `📊 Info de imagen obtenida en ${processingTime}ms`, {
            file: file.name,
            size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
            dimensions: `${imageInfo.width}x${imageInfo.height}`,
            type: file.type,
            processingTime: `${processingTime}ms`,
          })
        } catch (imageError) {
          const processingTime = Date.now() - startTime
          addDebugLog(
            "warning",
            `⚠️ Error/timeout obteniendo info de imagen para ${file.name} después de ${processingTime}ms`,
            imageError,
          )
          // Continuar con valores por defecto
          imageInfo = { width: 800, height: 600 }
        }

        // Crear PhotoData object
        const photoData: PhotoData = {
          file: file,
          isPrimary: false,
          id: `photo-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
        }

        results.push(photoData)

        const totalProcessingTime = Date.now() - startTime
        addDebugLog("info", `✅ PhotoData creado para ${file.name} en ${totalProcessingTime}ms`, {
          id: photoData.id,
          totalTime: `${totalProcessingTime}ms`,
        })

        // Delay más largo entre archivos para dar tiempo al navegador
        if (i < files.length - 1) {
          addDebugLog("info", `⏳ Esperando ${DELAY_BETWEEN_FILES}ms antes del siguiente archivo...`)
          await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_FILES))

          // Limpiar memoria entre archivos
          cleanupObjectUrls()
        }
      } catch (error) {
        const processingTime = Date.now() - startTime
        const errorMsg = `Error procesando ${file.name} después de ${processingTime}ms: ${error instanceof Error ? error.message : "Error desconocido"}`
        addDebugLog("error", `💥 ${errorMsg}`, {
          error,
          processingTime: `${processingTime}ms`,
          fileIndex: i,
        })
        errors.push(errorMsg)
      }
    }

    setCurrentProcessingFile("")
    return { results, errors }
  }

  const handleFiles = async (fileList: FileList) => {
    addDebugLog("info", `🚀 MÚLTIPLES ARCHIVOS: Iniciando procesamiento de ${fileList.length} archivos`)

    // Debug específico para selección múltiple
    if (fileList.length > 1) {
      addDebugLog(
        "warning",
        `📱 SELECCIÓN MÚLTIPLE DETECTADA: ${fileList.length} archivos - usando procesamiento con delay`,
      )
    }

    setUploadError(null)
    setIsProcessing(true)
    setProcessingProgress(0)
    setCurrentProcessingFile("")

    // Debug: Log initial FileList info con más detalle
    const fileListInfo = Array.from(fileList).map((f, i) => ({
      index: i,
      name: f.name,
      size: f.size,
      type: f.type,
      lastModified: f.lastModified,
      isBlob: f.name === "blob" || f.name === "image",
      hasValidType: f.type && f.type.startsWith("image/"),
    }))

    addDebugLog("info", "📋 FileList detallada recibida", {
      length: fileList.length,
      totalSize: `${(Array.from(fileList).reduce((sum, f) => sum + f.size, 0) / 1024 / 1024).toFixed(2)}MB`,
      files: fileListInfo,
      blobFiles: fileListInfo.filter((f) => f.isBlob).length,
      invalidTypes: fileListInfo.filter((f) => !f.hasValidType).length,
    })

    // Validación dura de FileList en el cliente con mejor manejo de errores
    let cleanedFiles: File[] = []
    try {
      cleanedFiles = Array.from(fileList).map((file, i) => {
        const extension = file.type?.split("/")[1] || "jpg"
        const originalName = file.name
        const name =
          !file.name || file.name === "blob" || file.name === "image"
            ? `mobile_photo_${Date.now()}_${i}.${extension}`
            : file.name

        const type = file.type || "image/jpeg"

        // Verificar que el archivo tenga contenido
        if (file.size === 0) {
          throw new Error(`Archivo ${originalName} está vacío`)
        }

        const cleanedFile = new File([file], name, {
          type,
          lastModified: file.lastModified,
        })

        addDebugLog("info", `📝 Archivo ${i + 1} limpiado`, {
          original: { name: originalName, type: file.type, size: file.size },
          cleaned: { name: cleanedFile.name, type: cleanedFile.type, size: cleanedFile.size },
          wasRenamed: originalName !== name,
        })

        return cleanedFile
      })
    } catch (cleanError) {
      addDebugLog("error", `💥 Error en limpieza de archivos: ${cleanError}`)
      setUploadError(`Error procesando archivos: ${cleanError}`)
      setIsProcessing(false)
      return
    }

    // Verificar límite total de fotos
    if (photos.length + cleanedFiles.length > maxPhotos) {
      const errorMsg = `Máximo ${maxPhotos} fotos permitidas`
      addDebugLog("error", errorMsg, { current: photos.length, trying: cleanedFiles.length, max: maxPhotos })
      setUploadError(errorMsg)
      setIsProcessing(false)
      return
    }

    addDebugLog("info", `✅ Límite de fotos OK: ${photos.length + cleanedFiles.length}/${maxPhotos}`)

    // Procesar archivos con delays para evitar problemas de tiempo
    const { results: newPhotoData, errors } = await processFilesWithDelay(cleanedFiles)

    if (errors.length > 0) {
      addDebugLog("warning", `⚠️ ${errors.length} errores encontrados`, errors)
      setUploadError(errors.join(", "))
    }

    if (newPhotoData.length > 0) {
      const updatedPhotos = updatePrimaryPhoto([...photos, ...newPhotoData])
      onPhotosChange(updatedPhotos)
      addDebugLog(
        "info",
        `🎉 ${newPhotoData.length} fotos agregadas correctamente de ${cleanedFiles.length} intentadas`,
        {
          totalPhotos: updatedPhotos.length,
          newPhotos: newPhotoData.map((p) => ({ id: p.id, isPrimary: p.isPrimary })),
          successRate: `${newPhotoData.length}/${cleanedFiles.length}`,
        },
      )
    } else {
      addDebugLog("warning", "⚠️ No se agregaron fotos nuevas - todas fallaron")
    }

    setIsProcessing(false)
    setProcessingProgress(0)
    setCurrentProcessingFile("")
    addDebugLog("info", "🏁 Procesamiento completado")
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
    addDebugLog("info", `⭐ Foto ${targetIndex + 1} marcada como principal`)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    addDebugLog("info", "📁 Input change detectado")

    if (e.target.files && e.target.files.length > 0) {
      addDebugLog("info", `📁 ${e.target.files.length} archivos seleccionados`, {
        isMultiple: e.target.files.length > 1,
        inputType: e.target.multiple ? "multiple" : "single",
      })
      handleFiles(e.target.files)
    } else {
      addDebugLog("warning", "⚠️ No hay archivos en el input")
    }

    // Limpiar el input para permitir seleccionar los mismos archivos de nuevo
    e.target.value = ""
  }

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index)
    const updatedPhotos = updatePrimaryPhoto(newPhotos)
    onPhotosChange(updatedPhotos)
    addDebugLog("info", `🗑️ Foto ${index + 1} eliminada`)
  }

  const openFileDialog = (e: React.MouseEvent) => {
    // Prevenir que el evento se propague al formulario padre
    e.preventDefault()
    e.stopPropagation()
    addDebugLog("info", "🖱️ Abriendo selector de archivos")
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
      {/* Debug Toggle Button */}
      <div className="flex justify-between items-center">
        <Button type="button" variant="outline" size="sm" onClick={() => setShowDebug(!showDebug)} className="text-xs">
          <Bug className="h-3 w-3 mr-1" />
          Debug {showDebug ? "OFF" : "ON"}
        </Button>
        {debugLogs.length > 0 && (
          <Button type="button" variant="ghost" size="sm" onClick={clearDebugLogs} className="text-xs">
            Limpiar logs
          </Button>
        )}
      </div>

      {/* Debug Panel */}
      {showDebug && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <Bug className="h-4 w-4 text-yellow-600" />
                <h4 className="font-semibold text-yellow-800">Debug Mobile Upload - Timing Issues</h4>
                <Badge variant="outline" className="text-xs">
                  {debugLogs.length} logs
                </Badge>
              </div>

              <div className="max-h-40 overflow-y-auto space-y-1 text-xs font-mono">
                {debugLogs.length === 0 ? (
                  <p className="text-gray-500 italic">
                    No hay logs aún... Intenta seleccionar múltiples fotos para ver los tiempos de procesamiento
                  </p>
                ) : (
                  debugLogs.map((log, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded border-l-2 ${
                        log.type === "error"
                          ? "bg-red-50 border-red-400 text-red-800"
                          : log.type === "warning"
                            ? "bg-yellow-50 border-yellow-400 text-yellow-800"
                            : "bg-blue-50 border-blue-400 text-blue-800"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-medium">[{log.timestamp}]</span>
                        <span className="text-xs opacity-75">{log.type.toUpperCase()}</span>
                      </div>
                      <div className="mt-1">{log.message}</div>
                      {log.data && (
                        <details className="mt-1">
                          <summary className="cursor-pointer text-xs opacity-75">Ver datos</summary>
                          <pre className="mt-1 text-xs bg-white/50 p-1 rounded overflow-x-auto">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Button - More compact/narrow */}
      <div className="space-y-3">
        <div className="flex justify-center">
          <Button
            type="button"
            onClick={openFileDialog}
            disabled={photos.length >= maxPhotos || isProcessing}
            className="max-w-md bg-red-500 hover:bg-red-600 text-white font-medium rounded-full h-11 w-full"
            size="lg"
          >
            <Upload className="h-4 w-4 mr-2" />
            <Camera className="h-4 w-4 mr-2" />
            Subir fotos
          </Button>
        </div>

        <div className="text-center space-y-1">
          <p className="text-sm text-muted-foreground">
            Máximo {maxPhotos} fotos • {maxSizePerPhoto}MB por foto
          </p>
          <p className="text-xs text-muted-foreground">JPG, PNG, WebP</p>
          <p className="text-sm font-medium text-foreground">
            {photos.length} de {maxPhotos} fotos
          </p>
        </div>
      </div>

      {/* Processing State with current file info */}
      {isProcessing && (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              <div className="space-y-2 w-full max-w-xs">
                <p className="text-sm text-muted-foreground text-center">
                  {currentProcessingFile ? `Procesando: ${currentProcessingFile}` : "Procesando fotos..."}
                </p>
                <Progress value={processingProgress} className="w-full" />
                <p className="text-xs text-muted-foreground text-center">
                  Procesamiento lento para mejor compatibilidad móvil
                </p>
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
            <p className="text-sm text-muted-foreground">
              Selecciona la foto principal que mejor represente tu experiencia
            </p>
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
