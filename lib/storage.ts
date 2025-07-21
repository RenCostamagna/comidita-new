import { compressImageAdvanced, isMobileDevice, willExceedPayloadLimit } from "./image-compression"

// Función para subir una sola foto
async function uploadSinglePhoto(file: File, userId: string, reviewId: string): Promise<string> {
  console.log(`Subiendo foto individual: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`)

  const formData = new FormData()
  formData.append("photos", file)
  formData.append("reviewId", reviewId)

  const response = await fetch("/api/upload-photos", {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || `Error HTTP ${response.status}`)
  }

  const data = await response.json()

  if (!data.uploadedUrls || data.uploadedUrls.length === 0) {
    throw new Error("No se recibió URL de la foto subida")
  }

  return data.uploadedUrls[0]
}

// Función para subir múltiples fotos de forma secuencial
export async function uploadMultipleReviewPhotos(
  files: File[],
  userId: string,
  reviewId: string,
  onProgress?: (progress: number, status: string) => void,
): Promise<string[]> {
  console.log(`🚀 Iniciando upload secuencial de ${files.length} fotos para usuario ${userId}, reseña ${reviewId}`)

  if (files.length === 0) {
    return []
  }

  try {
    const uploadedUrls: string[] = []
    const errors: string[] = []

    // Comprimir fotos si es necesario (especialmente en móvil)
    onProgress?.(10, "Optimizando fotos...")

    let processedFiles = files
    const isMobile = isMobileDevice()
    const totalSizeExceedsLimit = willExceedPayloadLimit(files, 3.5) // Usar 3.5MB como límite seguro

    if (isMobile || totalSizeExceedsLimit) {
      console.log("📱 Dispositivo móvil o archivos grandes detectados, comprimiendo...")

      const compressedFiles: File[] = []
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        try {
          // Comprimir con configuración agresiva para móvil
          const compressed = await compressImageAdvanced(file, {
            maxWidth: isMobile ? 800 : 1200,
            maxHeight: isMobile ? 600 : 900,
            quality: isMobile ? 0.6 : 0.7,
            outputFormat: "jpeg",
            isMobile,
          })
          compressedFiles.push(compressed)

          onProgress?.(10 + (i / files.length) * 20, `Optimizando ${file.name}...`)
        } catch (error) {
          console.error(`Error comprimiendo ${file.name}:`, error)
          compressedFiles.push(file) // Usar original si falla la compresión
        }
      }
      processedFiles = compressedFiles

      const originalSize = files.reduce((sum, f) => sum + f.size, 0)
      const compressedSize = processedFiles.reduce((sum, f) => sum + f.size, 0)
      console.log(
        `✅ Compresión completada: ${(originalSize / 1024 / 1024).toFixed(2)}MB → ${(compressedSize / 1024 / 1024).toFixed(2)}MB`,
      )
    }

    // Subir fotos una por una para evitar el límite de payload
    onProgress?.(30, "Subiendo fotos...")

    for (let i = 0; i < processedFiles.length; i++) {
      const file = processedFiles[i]
      const progressPercent = 30 + ((i + 1) / processedFiles.length) * 60

      try {
        onProgress?.(progressPercent, `Subiendo foto ${i + 1} de ${processedFiles.length}...`)

        const url = await uploadSinglePhoto(file, userId, reviewId)
        uploadedUrls.push(url)

        console.log(`✅ Foto ${i + 1}/${processedFiles.length} subida: ${file.name}`)

        // Pequeña pausa entre uploads para evitar rate limiting
        if (i < processedFiles.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 100))
        }
      } catch (error) {
        console.error(`❌ Error subiendo foto ${i + 1} (${file.name}):`, error)
        errors.push(`${file.name}: ${error instanceof Error ? error.message : "Error desconocido"}`)
      }
    }

    onProgress?.(100, "Upload completado")

    console.log(`📊 Resultado final: ${uploadedUrls.length}/${files.length} fotos subidas exitosamente`)

    if (errors.length > 0) {
      console.warn("⚠️ Errores durante el upload:", errors)
    }

    // Si no se subió ninguna foto, lanzar error
    if (uploadedUrls.length === 0 && files.length > 0) {
      throw new Error("No se pudo subir ninguna foto. " + (errors.length > 0 ? errors[0] : "Error desconocido"))
    }

    return uploadedUrls
  } catch (error) {
    console.error("💥 Error general en uploadMultipleReviewPhotos:", error)
    throw error
  }
}

// Función para eliminar una foto usando la API route
export async function deleteReviewPhoto(photoUrl: string): Promise<boolean> {
  try {
    console.log("🗑️ Eliminando foto:", photoUrl)

    const response = await fetch(`/api/delete-photo?url=${encodeURIComponent(photoUrl)}`, {
      method: "DELETE",
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Error eliminando foto:", errorData)
      return false
    }

    console.log("✅ Foto eliminada exitosamente")
    return true
  } catch (error) {
    console.error("Error en deleteReviewPhoto:", error)
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
