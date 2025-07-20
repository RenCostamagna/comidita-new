import { detectRealFileType, handleHEICFile } from "./image-compression"

// Función mejorada para limpiar archivos con mejor manejo de HEIC
async function cleanFiles(files: File[]): Promise<File[]> {
  console.log(`🧹 [CLEAN] Iniciando limpieza de ${files.length} archivos`)

  const cleanedFiles: File[] = []

  for (let index = 0; index < files.length; index++) {
    const file = files[index]
    console.log(`🧹 [CLEAN] Procesando archivo ${index + 1}/${files.length}:`, {
      name: file.name,
      type: file.type,
      size: file.size,
    })

    try {
      let processedFile = file

      // Detectar tipo real del archivo
      const { type: realType, extension } = detectRealFileType(file)

      // Manejar archivos HEIC especialmente
      if (
        file.name?.toLowerCase().includes("heic") ||
        file.name?.toLowerCase().includes("heif") ||
        realType === "image/heic" ||
        realType === "image/heif"
      ) {
        console.log(`📱 [CLEAN] Archivo HEIC detectado, procesando...`)
        try {
          processedFile = await handleHEICFile(file)
          console.log(`✅ [CLEAN] Archivo HEIC procesado exitosamente`)
        } catch (heicError) {
          console.error(`❌ [CLEAN] Error procesando HEIC:`, heicError)
          // Continuar con el archivo original si falla la conversión
        }
      }

      // Crear blob apropiado
      const blob = processedFile instanceof Blob ? processedFile : new Blob([processedFile], { type: realType })

      // Determinar nombre final
      let finalName = processedFile.name || file.name
      const isBadName = !finalName || finalName === "blob" || finalName === "image" || finalName === ""

      if (isBadName) {
        const timestamp = Date.now()
        const randomSuffix = Math.random().toString(36).substring(2, 8)
        finalName = `mobile_photo_${timestamp}_${index}.${extension}`
        console.log(`🔧 [CLEAN] Nombre generado para archivo sin nombre: ${finalName}`)
      }

      // Crear archivo final limpio
      const cleanedFile = new File([blob], finalName, {
        type: realType,
        lastModified: processedFile.lastModified || file.lastModified || Date.now(),
      })

      console.log(`✅ [CLEAN] Archivo ${index + 1} limpiado:`, {
        original: { name: file.name, type: file.type, size: file.size },
        cleaned: { name: cleanedFile.name, type: cleanedFile.type, size: cleanedFile.size },
        wasRenamed: file.name !== finalName,
        wasTypeFixed: file.type !== realType,
        wasHEIC: file.name?.toLowerCase().includes("heic") || file.name?.toLowerCase().includes("heif"),
      })

      cleanedFiles.push(cleanedFile)
    } catch (error) {
      console.error(`❌ [CLEAN] Error procesando archivo ${index + 1}:`, error)

      // Fallback: crear archivo básico limpio
      const { type: fallbackType, extension: fallbackExt } = detectRealFileType(file)
      const fallbackName = `error_recovery_${Date.now()}_${index}.${fallbackExt}`

      const fallbackFile = new File([file], fallbackName, {
        type: fallbackType,
        lastModified: file.lastModified || Date.now(),
      })

      console.log(`🔧 [CLEAN] Archivo de recuperación creado:`, fallbackName)
      cleanedFiles.push(fallbackFile)
    }
  }

  console.log(`✅ [CLEAN] Limpieza completada: ${cleanedFiles.length}/${files.length} archivos procesados`)
  return cleanedFiles
}

// Función mejorada para subir múltiples fotos con logging detallado
export async function uploadMultipleReviewPhotos(files: File[], userId: string, reviewId: string): Promise<string[]> {
  console.log(`🚀 [UPLOAD] Iniciando upload de ${files.length} fotos para usuario ${userId}, reseña ${reviewId}`)
  console.log(`📊 [UPLOAD] Información inicial:`, {
    totalFiles: files.length,
    userId,
    reviewId,
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "server",
  })

  try {
    // Paso 1: Limpiar archivos antes de subir (ahora async)
    console.log(`🧹 [UPLOAD] Limpiando archivos...`)
    const cleanedFiles = await cleanFiles(files)

    // Paso 2: Log detallado de cada archivo limpio
    cleanedFiles.forEach((file, i) => {
      console.log(`📁 [UPLOAD] Archivo limpio ${i + 1}/${cleanedFiles.length}:`, {
        name: file.name,
        size: file.size,
        sizeFormatted: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        type: file.type,
        instanceof: file instanceof File,
        lastModified: new Date(file.lastModified).toISOString(),
        isValid: file.size > 0 && file.type.startsWith("image/"),
      })
    })

    // Paso 3: Crear FormData con logging detallado
    console.log(`📦 [UPLOAD] Creando FormData...`)
    const formData = new FormData()

    // Agregar archivos limpiados al FormData
    cleanedFiles.forEach((file, index) => {
      console.log(`➕ [UPLOAD] Agregando archivo ${index + 1}: ${file.name} (${file.size} bytes, ${file.type})`)
      formData.append("photos", file)
    })

    formData.append("reviewId", reviewId)
    console.log(`✅ [UPLOAD] FormData creado con ${cleanedFiles.length} archivos y reviewId: ${reviewId}`)

    // Paso 4: Log del FormData antes del envío
    console.log(`📋 [UPLOAD] Contenido del FormData:`)
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`  - ${key}: File(${value.name}, ${value.size} bytes, ${value.type})`)
      } else {
        console.log(`  - ${key}: ${value}`)
      }
    }

    // Paso 5: Realizar request con timeout y logging detallado
    console.log(`🌐 [UPLOAD] Enviando request a /api/upload-photos...`)
    const startTime = Date.now()

    // Crear AbortController para timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      console.log(`⏰ [UPLOAD] Timeout de 30 segundos alcanzado, abortando request`)
      controller.abort()
    }, 30000) // 30 segundos timeout

    let response: Response
    try {
      response = await fetch("/api/upload-photos", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
    } catch (fetchError) {
      clearTimeout(timeoutId)
      const requestTime = Date.now() - startTime
      console.error(`💥 [UPLOAD] Error en fetch después de ${requestTime}ms:`, {
        error: fetchError,
        errorMessage: fetchError instanceof Error ? fetchError.message : String(fetchError),
        errorName: fetchError instanceof Error ? fetchError.name : "Unknown",
        isAbortError: fetchError instanceof Error && fetchError.name === "AbortError",
        requestDuration: `${requestTime}ms`,
      })
      throw fetchError
    }

    const requestTime = Date.now() - startTime
    console.log(`📡 [UPLOAD] Response recibida en ${requestTime}ms:`, {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries()),
      requestDuration: `${requestTime}ms`,
    })

    // Paso 6: Procesar respuesta
    if (!response.ok) {
      console.error(`❌ [UPLOAD] Response no OK (${response.status}):`, response.statusText)

      let errorData: any
      try {
        errorData = await response.json()
        console.error(`📄 [UPLOAD] Error data del servidor:`, errorData)
      } catch (jsonError) {
        console.error(`💥 [UPLOAD] Error parseando JSON de error:`, jsonError)
        errorData = { error: `HTTP ${response.status}: ${response.statusText}` }
      }

      throw new Error(errorData.error || `Error HTTP ${response.status}`)
    }

    // Paso 7: Parsear respuesta exitosa
    let data: any
    try {
      data = await response.json()
      console.log(`✅ [UPLOAD] Response parseada exitosamente:`, {
        success: data.success,
        uploadedUrlsCount: data.uploadedUrls?.length || 0,
        errorsCount: data.errors?.length || 0,
        message: data.message,
      })
    } catch (jsonError) {
      console.error(`💥 [UPLOAD] Error parseando JSON de respuesta exitosa:`, jsonError)
      throw new Error("Error parseando respuesta del servidor")
    }

    // Paso 8: Validar URLs devueltas
    console.log(`🔍 [UPLOAD] Validando URLs devueltas...`)
    if (data.uploadedUrls && Array.isArray(data.uploadedUrls)) {
      data.uploadedUrls.forEach((url: string, index: number) => {
        console.log(`🔗 [UPLOAD] URL ${index + 1}:`, {
          url: url,
          isString: typeof url === "string",
          isValidUrl: url.startsWith("http"),
          isBlobUrl: url.includes("blob.vercel-storage.com"),
          length: url.length,
        })

        if (url.includes("blob.vercel-storage.com")) {
          console.log(`✅ [UPLOAD] URL ${index + 1} es de Vercel Blob correcta`)
        } else {
          console.warn(`⚠️ [UPLOAD] URL ${index + 1} no es de Vercel Blob:`, url)
        }
      })
    } else {
      console.warn(`⚠️ [UPLOAD] uploadedUrls no es un array válido:`, data.uploadedUrls)
    }

    // Paso 9: Log de errores si los hay
    if (data.errors && data.errors.length > 0) {
      console.warn(`⚠️ [UPLOAD] Algunos archivos tuvieron errores:`, {
        totalErrors: data.errors.length,
        errors: data.errors,
        successfulUploads: data.uploadedUrls?.length || 0,
        totalAttempted: cleanedFiles.length,
      })
    }

    // Paso 10: Resultado final
    const finalUrls = data.uploadedUrls || []
    console.log(`🎉 [UPLOAD] UPLOAD COMPLETADO:`, {
      totalFilesAttempted: cleanedFiles.length,
      successfulUploads: finalUrls.length,
      failedUploads: data.errors?.length || 0,
      successRate: `${Math.round((finalUrls.length / cleanedFiles.length) * 100)}%`,
      totalRequestTime: `${requestTime}ms`,
      finalUrls: finalUrls,
    })

    return finalUrls
  } catch (error) {
    console.error(`💥 [UPLOAD] ERROR GENERAL en uploadMultipleReviewPhotos:`, {
      error: error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      errorName: error instanceof Error ? error.name : "Unknown",
      userId,
      reviewId,
      fileCount: files.length,
      timestamp: new Date().toISOString(),
    })
    throw error
  }
}

// Función para eliminar una foto usando la API route
export async function deleteReviewPhoto(photoUrl: string): Promise<boolean> {
  try {
    console.log("🗑️ [DELETE] Eliminando foto:", photoUrl)

    const response = await fetch(`/api/delete-photo?url=${encodeURIComponent(photoUrl)}`, {
      method: "DELETE",
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("❌ [DELETE] Error eliminando foto:", errorData)
      return false
    }

    console.log("✅ [DELETE] Foto eliminada exitosamente")
    return true
  } catch (error) {
    console.error("💥 [DELETE] Error en deleteReviewPhoto:", error)
    return false
  }
}

export async function deleteMultipleReviewPhotos(photoUrls: string[]): Promise<boolean[]> {
  const deletePromises = photoUrls.map((url) => deleteReviewPhoto(url))
  return Promise.all(deletePromises)
}

// Función para generar nombre único de archivo
export function generateUniqueFileName(originalName: string, userId: string, reviewId: string): string {
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 15)
  const fileExtension = originalName.split(".").pop() || "jpg"
  return `reviews/${userId}/${reviewId}/${timestamp}_${randomString}.${fileExtension}`
}

// Función alternativa para desarrollo que simula upload
export function createLocalPhotoUrl(file: File, photoIndex: number): string {
  if (typeof window !== "undefined") {
    return URL.createObjectURL(file)
  }
  return `/placeholder.svg?height=300&width=300&text=Foto+${photoIndex}`
}
