import { put, del } from "@vercel/blob"
import { compressImageAdvanced, validateImageFile } from "./image-compression"

export async function uploadReviewPhoto(
  file: File,
  userId: string,
  reviewId: string,
  photoIndex: number,
): Promise<string | null> {
  try {
    // Validar archivo
    const validation = validateImageFile(file)
    if (!validation.isValid) {
      console.error("Archivo inválido:", validation.error)
      return `/placeholder.svg?height=300&width=300&text=Error+${photoIndex}`
    }

    // Comprimir la imagen con configuración optimizada para reseñas
    console.log(`Comprimiendo imagen ${photoIndex}...`)
    const compressedFile = await compressImageAdvanced(file, {
      maxWidth: 800,
      maxHeight: 600,
      quality: 0.85,
      maxSizeKB: 400, // Máximo 400KB por imagen
      outputFormat: "jpeg",
    })

    // Generar nombre único para el archivo
    const timestamp = Date.now()
    const fileName = `review-photos/${userId}_${reviewId}_${photoIndex}_${timestamp}.jpg`

    // Subir archivo comprimido a Vercel Blob
    const blob = await put(fileName, compressedFile, {
      access: "public",
      addRandomSuffix: false, // Ya tenemos timestamp para unicidad
    })

    return blob.url
  } catch (error) {
    console.error("Error uploading photo:", error)
    return `/placeholder.svg?height=300&width=300&text=Foto+${photoIndex}`
  }
}

export async function deleteReviewPhoto(photoUrl: string): Promise<boolean> {
  try {
    // Extraer el pathname de la URL para usar con del()
    const url = new URL(photoUrl)
    const pathname = url.pathname.substring(1) // Remover el '/' inicial

    await del(pathname)
    return true
  } catch (error) {
    console.error("Error deleting photo:", error)
    return false
  }
}

// Función alternativa para desarrollo que simula upload
export function createLocalPhotoUrl(file: File, photoIndex: number): string {
  // En desarrollo, crear URL local temporal
  if (typeof window !== "undefined") {
    return URL.createObjectURL(file)
  }
  return `/placeholder.svg?height=300&width=300&text=Foto+${photoIndex}`
}
