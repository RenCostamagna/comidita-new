import { autoCompressImage } from "./image-compression"

// Función para subir una sola foto inmediatamente (estilo Twitter)
export async function uploadSingleReviewPhoto(file: File, tempReviewId: string): Promise<string> {
  console.log(`Iniciando upload individual de foto: ${file.name}`)

  try {
    // Comprimir imagen automáticamente
    console.log("🗜️ Comprimiendo imagen...")
    const compressedFile = await autoCompressImage(file)

    const formData = new FormData()
    formData.append("photo", compressedFile)
    formData.append("tempReviewId", tempReviewId)

    console.log("Enviando request a /api/upload-single-photo...")

    const response = await fetch("/api/upload-single-photo", {
      method: "POST",
      body: formData,
    })

    console.log("Response status:", response.status)

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Error response:", errorData)
      throw new Error(errorData.error || `Error HTTP ${response.status}`)
    }

    const data = await response.json()
    console.log("Upload response:", data)

    if (!data.success || !data.url) {
      throw new Error("No se recibió URL válida del servidor")
    }

    // Verificar que la URL sea de Vercel Blob
    if (data.url.includes("blob.vercel-storage.com")) {
      console.log("✅ URL de Vercel Blob correcta:", data.url)
    } else {
      console.warn("⚠️ URL no es de Vercel Blob:", data.url)
    }

    return data.url
  } catch (error) {
    console.error("Error en uploadSingleReviewPhoto:", error)
    throw error
  }
}

// Función para subir múltiples fotos de reseñas usando la API route (LEGACY - mantener por compatibilidad)
export async function uploadMultipleReviewPhotos(files: File[], userId: string, reviewId: string): Promise<string[]> {
  console.log(`Iniciando upload de ${files.length} fotos para usuario ${userId}, reseña ${reviewId}`)

  try {
    const formData = new FormData()

    // Agregar archivos al FormData con el nombre correcto
    files.forEach((file, index) => {
      console.log(`Agregando archivo ${index + 1}: ${file.name} (${file.size} bytes)`)
      formData.append("photos", file)
    })

    formData.append("reviewId", reviewId)

    console.log("Enviando request a /api/upload-photos...")

    const response = await fetch("/api/upload-photos", {
      method: "POST",
      body: formData,
    })

    console.log("Response status:", response.status)

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Error response:", errorData)
      throw new Error(errorData.error || `Error HTTP ${response.status}`)
    }

    const data = await response.json()
    console.log("Upload response:", data)

    // Debug: verificar que las URLs sean de Vercel Blob
    console.log("URLs devueltas por la API:", data.uploadedUrls)
    data.uploadedUrls?.forEach((url: string, index: number) => {
      console.log(`URL ${index + 1}:`, url)
      if (url.includes("blob.vercel-storage.com")) {
        console.log("✅ URL de Vercel Blob correcta")
      } else {
        console.warn("⚠️ URL no es de Vercel Blob:", url)
      }
    })

    if (data.errors && data.errors.length > 0) {
      console.warn("Algunos archivos tuvieron errores:", data.errors)
    }

    return data.uploadedUrls || []
  } catch (error) {
    console.error("Error en uploadMultipleReviewPhotos:", error)
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

// Función para generar ID temporal único
export function generateTempReviewId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
