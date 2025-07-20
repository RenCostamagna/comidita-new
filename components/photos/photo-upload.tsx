"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { X, Upload, Camera, Star, Bug, RefreshCw, CloudUpload } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { validateImageFile, getImageInfo } from "@/lib/image-compression"
import { uploadMultipleReviewPhotos } from "@/lib/storage"

interface PhotoData {
  file: File | string
  isPrimary: boolean
  id?: string
  uploadUrl?: string // Para trackear si ya fue subida
}

interface PhotoUploadProps {
  photos: PhotoData[]
  onPhotosChange: (photos: PhotoData[]) => void
  maxPhotos?: number
  maxSizePerPhoto?: number // in MB
  acceptedFormats?: string[]
  userId?: string
  reviewId?: string
  onUploadComplete?: (urls: string[]) => void
}

interface DebugLog {
  timestamp: string
  type: "info" | "error" | "warning"
  message: string
  data?: any
}

interface FileProcessingResult {
  success: boolean
  photoData?: PhotoData
  error?: string
  retries?: number
}

export function PhotoUpload({
  photos,
  onPhotosChange,
  maxPhotos = 6,
  maxSizePerPhoto = 10,
  acceptedFormats = ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  userId = "temp-user",
  reviewId,
  onUploadComplete,
}: PhotoUploadProps) {
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([])
  const [showDebug, setShowDebug] = useState(false)
  const [currentProcessingFile, setCurrentProcessingFile] = useState<string>("")
  const [failedFiles, setFailedFiles] = useState<File[]>([])

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Debug logging function - aumentado a 50 logs
  const addDebugLog = (type: "info" | "error" | "warning", message: string, data?: any) => {
    const log: DebugLog = {
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
      data,
    }
    setDebugLogs((prev) => [...prev.slice(-49), log]) // Keep last 50 logs
    console.log(`[DEBUG ${type.toUpperCase()}]`, message, data)
  }

  const clearDebugLogs = () => {
    setDebugLogs([])
  }

  // Función para subir fotos procesadas a la API
  const uploadPhotosToAPI = async (photoFiles: File[]) => {
    if (!reviewId) {
      addDebugLog("error", "❌ No hay reviewId para subir fotos")
      throw new Error("reviewId es requerido para subir fotos")
    }

    addDebugLog("info", "🚀 INICIANDO UPLOAD A API", {
      fileCount: photoFiles.length,
      reviewId,
      userId,
      files: photoFiles.map((f) => ({ name: f.name, size: f.size, type: f.type })),
    })

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Simular progreso durante el upload
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90))
      }, 500)

      const uploadedUrls = await uploadMultipleReviewPhotos(photoFiles, userId, reviewId)

      clearInterval(progressInterval)
      setUploadProgress(100)

      addDebugLog("info", "✅ UPLOAD COMPLETADO EXITOSAMENTE", {
        uploadedCount: uploadedUrls.length,
        totalAttempted: photoFiles.length,
        urls: uploadedUrls,
        successRate: `${Math.round((uploadedUrls.length / photoFiles.length) * 100)}%`,
      })

      // Actualizar photos con las URLs
      const updatedPhotos = photos.map((photo, index) => {
        if (typeof photo.file !== "string" && uploadedUrls[index]) {
          return {
            ...photo,
            uploadUrl: uploadedUrls[index],
            file: uploadedUrls[index], // Cambiar a URL string
          }
        }
        return photo
      })

      onPhotosChange(updatedPhotos)

      if (onUploadComplete) {
        onUploadComplete(uploadedUrls)
      }

      return uploadedUrls
    } catch (error) {
      addDebugLog("error", "💥 ERROR EN UPLOAD A API", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        reviewId,
        userId,
        fileCount: photoFiles.length,
      })
      throw error
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  // Función más robusta para procesar un solo archivo con reintentos
  const processFileWithRetry = async (file: File, maxRetries = 2): Promise<FileProcessingResult> => {
    let lastError: any = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const startTime = Date.now()
      const isRetry = attempt > 0

      try {
        addDebugLog("info", `🔄 ${isRetry ? `Reintento ${attempt}` : "Procesando"}: ${file.name}`, {
          attempt: attempt + 1,
          maxRetries: maxRetries + 1,
          size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
          type: file.type,
          lastModified: new Date(file.lastModified).toISOString(),
        })

        // Validación básica
        addDebugLog("info", `🔍 Iniciando validación para ${file.name}`)
        const validation = validateImageFile(file, maxSizePerPhoto, acceptedFormats)
        if (!validation.isValid) {
          const error = `Validación falló: ${validation.error}`
          addDebugLog("error", `❌ ${error}`, { file: file.name, validation })
          return { success: false, error }
        }

        addDebugLog("info", `✅ Validación OK para ${file.name}`, {
          validatedSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
          validatedType: file.type,
        })

        // Crear una promesa con timeout más corto para detectar problemas rápido
        addDebugLog("info", `📊 Iniciando getImageInfo para ${file.name}`)
        const processImageInfo = () => {
          return new Promise<any>((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error(`Timeout después de 5 segundos`))
            }, 5000) // Timeout más corto

            getImageInfo(file)
              .then((info) => {
                clearTimeout(timeout)
                addDebugLog("info", `📊 getImageInfo completado exitosamente para ${file.name}`, info)
                resolve(info)
              })
              .catch((error) => {
                clearTimeout(timeout)
                addDebugLog("error", `📊 getImageInfo falló para ${file.name}`, error)
                reject(error)
              })
          })
        }

        let imageInfo
        try {
          imageInfo = await processImageInfo()
          const processingTime = Date.now() - startTime
          addDebugLog("info", `📊 Info de imagen obtenida en ${processingTime}ms`, {
            file: file.name,
            dimensions: `${imageInfo.width}x${imageInfo.height}`,
            processingTime: `${processingTime}ms`,
            attempt: attempt + 1,
            imageInfo: imageInfo,
          })
        } catch (imageError) {
          const processingTime = Date.now() - startTime
          addDebugLog("warning", `⚠️ getImageInfo falló en ${processingTime}ms, usando fallback`, {
            error: imageError instanceof Error ? imageError.message : String(imageError),
            attempt: attempt + 1,
            processingTime: `${processingTime}ms`,
          })

          // Si es el último intento, usar valores por defecto
          if (attempt === maxRetries) {
            imageInfo = { width: 800, height: 600 }
            addDebugLog("info", `🔧 Usando dimensiones por defecto para ${file.name}`, imageInfo)
          } else {
            // Si no es el último intento, fallar para reintentar
            throw imageError
          }
        }

        // Crear PhotoData
        addDebugLog("info", `🏗️ Creando PhotoData para ${file.name}`)
        const photoData: PhotoData = {
          file: file,
          isPrimary: false,
          id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        }

        const totalTime = Date.now() - startTime
        addDebugLog("info", `✅ Archivo procesado exitosamente: ${file.name}`, {
          totalTime: `${totalTime}ms`,
          attempt: attempt + 1,
          id: photoData.id,
          fileSize: file.size,
          fileName: file.name,
        })

        return { success: true, photoData, retries: attempt }
      } catch (error) {
        const processingTime = Date.now() - startTime
        lastError = error

        addDebugLog("error", `💥 Intento ${attempt + 1} falló para ${file.name}`, {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          processingTime: `${processingTime}ms`,
          attempt: attempt + 1,
          willRetry: attempt < maxRetries,
          fileName: file.name,
          fileSize: file.size,
        })

        // Si no es el último intento, esperar antes de reintentar
        if (attempt < maxRetries) {
          const retryDelay = 1000 * (attempt + 1) // 1s, 2s, 3s...
          addDebugLog("info", `⏳ Esperando ${retryDelay}ms antes del reintento para ${file.name}`)
          await new Promise((resolve) => setTimeout(resolve, retryDelay))
        }
      }
    }

    // Si llegamos aquí, todos los intentos fallaron
    const errorMsg = `Falló después de ${maxRetries + 1} intentos: ${lastError instanceof Error ? lastError.message : String(lastError)}`
    addDebugLog("error", `❌ FALLO DEFINITIVO: ${file.name} - ${errorMsg}`, {
      totalAttempts: maxRetries + 1,
      finalError: lastError,
    })
    return { success: false, error: errorMsg, retries: maxRetries }
  }

  // Función principal para procesar múltiples archivos
  const processMultipleFiles = async (files: File[]) => {
    const results: PhotoData[] = []
    const errors: string[] = []
    const failed: File[] = []

    addDebugLog("info", `🚀 Iniciando procesamiento robusto de ${files.length} archivos`, {
      totalFiles: files.length,
      fileNames: files.map((f) => f.name),
      totalSize: `${(files.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024).toFixed(2)}MB`,
    })

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      addDebugLog("info", `📂 Iniciando procesamiento del archivo ${i + 1}/${files.length}: ${file.name}`, {
        index: i,
        fileName: file.name,
        fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        fileType: file.type,
      })

      setCurrentProcessingFile(`${file.name} (${i + 1}/${files.length})`)
      setProcessingProgress(((i + 1) / files.length) * 100)

      const result = await processFileWithRetry(file, 2) // Máximo 3 intentos total

      if (result.success && result.photoData) {
        results.push(result.photoData)
        addDebugLog(
          "info",
          `🎉 ÉXITO: ${file.name}${result.retries ? ` (después de ${result.retries + 1} intentos)` : ""}`,
          {
            fileName: file.name,
            photoId: result.photoData.id,
            totalRetries: result.retries || 0,
            successfulFiles: results.length,
          },
        )
      } else {
        errors.push(`${file.name}: ${result.error}`)
        failed.push(file)
        addDebugLog("error", `❌ FALLO DEFINITIVO: ${file.name} - ${result.error}`, {
          fileName: file.name,
          error: result.error,
          failedFiles: failed.length,
        })
      }

      // Pausa entre archivos para no sobrecargar
      if (i < files.length - 1) {
        addDebugLog("info", `⏳ Pausa de 300ms antes del siguiente archivo`)
        await new Promise((resolve) => setTimeout(resolve, 300))
      }
    }

    addDebugLog("info", `🏁 PROCESAMIENTO COMPLETADO`, {
      totalFiles: files.length,
      successful: results.length,
      failed: failed.length,
      successRate: `${Math.round((results.length / files.length) * 100)}%`,
      errors: errors,
    })

    setFailedFiles(failed)
    return { results, errors }
  }

  const handleFiles = async (fileList: FileList) => {
    addDebugLog("info", `🚀 NUEVA SESIÓN DE UPLOAD INICIADA`, {
      timestamp: new Date().toISOString(),
      totalFiles: fileList.length,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
    })

    addDebugLog("info", `📱 Información del dispositivo`, {
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      touchSupport: "ontouchstart" in window,
      screenSize: `${window.screen.width}x${window.screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
    })

    setUploadError(null)
    setIsProcessing(true)
    setProcessingProgress(0)
    setCurrentProcessingFile("")
    setFailedFiles([])

    // Log detallado de archivos recibidos
    const fileDetails = Array.from(fileList).map((f, i) => ({
      index: i,
      name: f.name,
      size: f.size,
      sizeFormatted: `${(f.size / 1024 / 1024).toFixed(2)}MB`,
      type: f.type,
      lastModified: new Date(f.lastModified).toISOString(),
      isBlob: f.name === "blob" || f.name === "image",
    }))

    addDebugLog("info", "📋 ARCHIVOS RECIBIDOS DEL FILELIST:", {
      total: fileList.length,
      files: fileDetails,
      totalSize: `${(Array.from(fileList).reduce((sum, f) => sum + f.size, 0) / 1024 / 1024).toFixed(2)}MB`,
      blobFiles: fileDetails.filter((f) => f.isBlob).length,
      validTypes: fileDetails.filter((f) => f.type && f.type.startsWith("image/")).length,
    })

    // Limpiar nombres de archivos
    addDebugLog("info", `🧹 Iniciando limpieza de nombres de archivos`)
    const cleanedFiles = Array.from(fileList).map((file, i) => {
      const extension = file.type?.split("/")[1] || "jpg"
      const originalName = file.name
      const name =
        !file.name || file.name === "blob" || file.name === "image"
          ? `mobile_photo_${Date.now()}_${i}.${extension}`
          : file.name

      const type = file.type || "image/jpeg"

      const cleanedFile = new File([file], name, {
        type,
        lastModified: file.lastModified,
      })

      addDebugLog("info", `📝 Archivo ${i + 1} limpiado`, {
        index: i,
        original: { name: originalName, type: file.type, size: file.size },
        cleaned: { name: cleanedFile.name, type: cleanedFile.type, size: cleanedFile.size },
        wasRenamed: originalName !== name,
        wasTypeFixed: file.type !== type,
      })

      return cleanedFile
    })

    // Verificar límites
    addDebugLog("info", `🔢 Verificando límites de fotos`, {
      currentPhotos: photos.length,
      newFiles: cleanedFiles.length,
      total: photos.length + cleanedFiles.length,
      maxAllowed: maxPhotos,
      withinLimit: photos.length + cleanedFiles.length <= maxPhotos,
    })

    if (photos.length + cleanedFiles.length > maxPhotos) {
      const errorMsg = `Máximo ${maxPhotos} fotos permitidas`
      addDebugLog("error", `❌ LÍMITE EXCEDIDO: ${errorMsg}`, {
        current: photos.length,
        trying: cleanedFiles.length,
        max: maxPhotos,
        excess: photos.length + cleanedFiles.length - maxPhotos,
      })
      setUploadError(errorMsg)
      setIsProcessing(false)
      return
    }

    addDebugLog("info", `✅ Límites OK, iniciando procesamiento de archivos`)

    // Procesar archivos con sistema de reintentos
    const { results: newPhotoData, errors } = await processMultipleFiles(cleanedFiles)

    // Mostrar resultados finales
    if (errors.length > 0) {
      addDebugLog("warning", `⚠️ ERRORES ENCONTRADOS: ${errors.length}/${cleanedFiles.length} archivos fallaron`, {
        totalErrors: errors.length,
        totalFiles: cleanedFiles.length,
        errors: errors,
        failureRate: `${Math.round((errors.length / cleanedFiles.length) * 100)}%`,
      })
      setUploadError(
        `${errors.length} archivos fallaron: ${errors.slice(0, 2).join(", ")}${errors.length > 2 ? "..." : ""}`,
      )
    }

    if (newPhotoData.length > 0) {
      const updatedPhotos = updatePrimaryPhoto([...photos, ...newPhotoData])
      onPhotosChange(updatedPhotos)
      addDebugLog("info", `🎉 RESULTADO FINAL EXITOSO`, {
        exitosos: newPhotoData.length,
        fallidos: errors.length,
        total: cleanedFiles.length,
        tasa_exito: `${Math.round((newPhotoData.length / cleanedFiles.length) * 100)}%`,
        nuevasPhotos: newPhotoData.map((p) => ({ id: p.id, isPrimary: p.isPrimary })),
        totalPhotosAhora: updatedPhotos.length,
      })

      // Si tenemos reviewId, subir automáticamente
      if (reviewId && newPhotoData.length > 0) {
        addDebugLog("info", "🚀 Iniciando upload automático a API...")
        try {
          const photoFiles = newPhotoData.map((p) => p.file).filter((f): f is File => f instanceof File)

          if (photoFiles.length > 0) {
            await uploadPhotosToAPI(photoFiles)
          }
        } catch (uploadError) {
          addDebugLog("error", "💥 Error en upload automático", uploadError)
          setUploadError(
            `Error subiendo fotos: ${uploadError instanceof Error ? uploadError.message : String(uploadError)}`,
          )
        }
      }
    } else {
      addDebugLog("error", `❌ NINGÚN ARCHIVO FUE PROCESADO EXITOSAMENTE`, {
        totalAttempted: cleanedFiles.length,
        allFailed: true,
        errors: errors,
      })
    }

    setIsProcessing(false)
    setProcessingProgress(0)
    setCurrentProcessingFile("")

    addDebugLog("info", `🏁 SESIÓN DE UPLOAD FINALIZADA`, {
      timestamp: new Date().toISOString(),
      duration: "Calculado en el cliente",
      finalState: {
        totalPhotos: photos.length + newPhotoData.length,
        newPhotosAdded: newPhotoData.length,
        failedFiles: errors.length,
      },
    })
  }

  // Función para reintentar archivos fallidos
  const retryFailedFiles = async () => {
    if (failedFiles.length === 0) return

    addDebugLog("info", `🔄 INICIANDO REINTENTO DE ARCHIVOS FALLIDOS`, {
      failedFilesCount: failedFiles.length,
      failedFileNames: failedFiles.map((f) => f.name),
    })
    await processMultipleFiles(failedFiles)
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
    addDebugLog("info", `📁 INPUT CHANGE DETECTADO`, {
      hasFiles: !!(e.target.files && e.target.files.length > 0),
      fileCount: e.target.files?.length || 0,
      inputElement: {
        multiple: e.target.multiple,
        accept: e.target.accept,
      },
    })

    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
    } else {
      addDebugLog("warning", `⚠️ No hay archivos en el input change`)
    }
    e.target.value = ""
  }

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index)
    const updatedPhotos = updatePrimaryPhoto(newPhotos)
    onPhotosChange(updatedPhotos)
    addDebugLog("info", `🗑️ Foto ${index + 1} eliminada`, {
      removedIndex: index,
      remainingPhotos: newPhotos.length,
    })
  }

  const openFileDialog = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addDebugLog("info", "🖱️ ABRIENDO SELECTOR DE ARCHIVOS", {
      timestamp: new Date().toISOString(),
      eventType: e.type,
    })
    fileInputRef.current?.click()
  }

  const getPhotoPreviewUrl = (photo: PhotoData): string => {
    if (typeof photo.file === "string") {
      return photo.file
    } else {
      return URL.createObjectURL(photo.file)
    }
  }

  // Función manual para subir fotos ya procesadas
  const handleManualUpload = async () => {
    const photoFiles = photos.map((p) => p.file).filter((f): f is File => f instanceof File)

    if (photoFiles.length === 0) {
      addDebugLog("warning", "⚠️ No hay archivos File para subir")
      return
    }

    try {
      await uploadPhotosToAPI(photoFiles)
    } catch (error) {
      setUploadError(`Error subiendo fotos: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  return (
    <div className="space-y-6">
      {/* Debug Controls */}
      <div className="flex justify-between items-center">
        <Button type="button" variant="outline" size="sm" onClick={() => setShowDebug(!showDebug)} className="text-xs">
          <Bug className="h-3 w-3 mr-1" />
          Debug {showDebug ? "OFF" : "ON"}
        </Button>
        <div className="flex gap-2">
          {failedFiles.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={retryFailedFiles}
              className="text-xs bg-transparent"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Reintentar ({failedFiles.length})
            </Button>
          )}
          {photos.length > 0 && reviewId && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleManualUpload}
              disabled={isUploading}
              className="text-xs bg-blue-50 hover:bg-blue-100"
            >
              <CloudUpload className="h-3 w-3 mr-1" />
              {isUploading ? "Subiendo..." : "Subir a API"}
            </Button>
          )}
          {debugLogs.length > 0 && (
            <Button type="button" variant="ghost" size="sm" onClick={clearDebugLogs} className="text-xs">
              Limpiar
            </Button>
          )}
        </div>
      </div>

      {/* Debug Panel - Aumentado el tamaño */}
      {showDebug && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <Bug className="h-4 w-4 text-yellow-600" />
                <h4 className="font-semibold text-yellow-800">Debug Mobile Upload - Logs Completos + API</h4>
                <Badge variant="outline" className="text-xs">
                  {debugLogs.length}/50 logs
                </Badge>
              </div>

              {/* Aumentado la altura máxima para ver más logs */}
              <div className="max-h-96 overflow-y-auto space-y-1 text-xs font-mono">
                {debugLogs.length === 0 ? (
                  <p className="text-gray-500 italic">
                    Selecciona múltiples fotos para ver el debug completo del proceso + upload API...
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
                      <div className="mt-1 font-medium">{log.message}</div>
                      {log.data && (
                        <details className="mt-1">
                          <summary className="cursor-pointer text-xs opacity-75 hover:opacity-100">
                            Ver datos técnicos
                          </summary>
                          <pre className="mt-1 text-xs bg-white/50 p-2 rounded overflow-x-auto border">
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

      {/* Upload Button */}
      <div className="space-y-3">
        <div className="flex justify-center">
          <Button
            type="button"
            onClick={openFileDialog}
            disabled={photos.length >= maxPhotos || isProcessing || isUploading}
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

      {/* Processing State */}
      {(isProcessing || isUploading) && (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              <div className="space-y-2 w-full max-w-xs">
                {isProcessing && (
                  <>
                    <p className="text-sm text-muted-foreground text-center">
                      {currentProcessingFile ? `Procesando: ${currentProcessingFile}` : "Procesando fotos..."}
                    </p>
                    <Progress value={processingProgress} className="w-full" />
                    <p className="text-xs text-muted-foreground text-center">
                      Sistema de reintentos automáticos activo
                    </p>
                  </>
                )}
                {isUploading && (
                  <>
                    <p className="text-sm text-muted-foreground text-center">Subiendo fotos a la API...</p>
                    <Progress value={uploadProgress} className="w-full" />
                    <p className="text-xs text-muted-foreground text-center">Enviando a Vercel Blob Storage</p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Photos Preview Section */}
      {photos.length > 0 && !isProcessing && !isUploading && (
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

                  {/* Upload status indicator */}
                  {photo.uploadUrl && (
                    <div className="absolute top-2 right-8 z-10">
                      <Badge className="text-xs bg-green-100 text-green-800 border-green-200 rounded-full px-2 py-1">
                        ✓ Subida
                      </Badge>
                    </div>
                  )}

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

                  {/* Primary selection button */}
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
