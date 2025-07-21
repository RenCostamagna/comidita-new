import { logDebug, logError } from "./debug-logger"

// Función para subir múltiples fotos de reseñas usando la API route
export async function uploadMultipleReviewPhotos(files: File[], userId: string, reviewId: string): Promise<string[]> {
  logDebug("uploadMultipleReviewPhotos", `Starting upload of ${files.length} photos`, { userId, reviewId })

  try {
    const formData = new FormData()

    // Agregar archivos al FormData con el nombre correcto
    files.forEach((file, index) => {
      logDebug("uploadMultipleReviewPhotos", `Appending file ${index + 1} to FormData`, {
        name: file.name,
        size: file.size,
        type: file.type,
      })
      formData.append("photos", file)
    })

    formData.append("reviewId", reviewId)

    logDebug("uploadMultipleReviewPhotos", "FormData created. Sending POST request to /api/upload-photos.")

    const response = await fetch("/api/upload-photos", {
      method: "POST",
      body: formData,
    })

    logDebug("uploadMultipleReviewPhotos", "Received response from API", {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    })

    if (!response.ok) {
      const errorText = await response.text()
      logError("uploadMultipleReviewPhotos", "API response not OK", {
        status: response.status,
        errorBody: errorText,
      })
      // Try to parse as JSON, but fallback to text
      try {
        const errorData = JSON.parse(errorText)
        throw new Error(errorData.error || `Error HTTP ${response.status}`)
      } catch (e) {
        throw new Error(errorText || `Error HTTP ${response.status}`)
      }
    }

    const data = await response.json()
    logDebug("uploadMultipleReviewPhotos", "Successfully parsed API response", data)

    if (data.errors && data.errors.length > 0) {
      logError("uploadMultipleReviewPhotos", "API reported errors for some files", data.errors)
    }

    return data.uploadedUrls || []
  } catch (error) {
    logError("uploadMultipleReviewPhotos", "Caught an exception in uploadMultipleReviewPhotos", error)
    throw error
  }
}

// Función para eliminar una foto usando la API route
export async function deleteReviewPhoto(photoUrl: string): Promise<boolean> {
  try {
    console.log("Eliminando foto:", photoUrl)

    const response = await fetch(`/api/delete-photo?url=${encodeURIComponent(photoUrl)}`, {
      method: "DELETE",
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Error eliminando foto:", errorData)
      return false
    }

    console.log("Foto eliminada exitosamente")
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
