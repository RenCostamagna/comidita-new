import { put, del } from "@vercel/blob"
import { compressImageAdvanced, validateImageFile } from "./image-compression"

export async function uploadReviewPhoto(
  file: File,
  userId: string,
  reviewId: string,
  photoIndex: number,
): Promise<string | null> {
  try {
    console.log(`Iniciando upload de foto ${photoIndex} para usuario ${userId}`)

    // Validar archivo
    const validation = validateImageFile(file)
    if (!validation.isValid) {
      console.error("Archivo inválido:", validation.error)
      throw new Error(`Archivo inválido: ${validation.error}`)
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

    console.log(
      `Imagen comprimida. Tamaño original: ${file.size} bytes, Tamaño comprimido: ${compressedFile.size} bytes`,
    )

    // Generar nombre único para el archivo
    const timestamp = Date.now()
    const fileName = `review-photos/${userId}_${reviewId}_${photoIndex}_${timestamp}.jpg`

    console.log(`Subiendo archivo a Vercel Blob: ${fileName}`)

    // Verificar que tenemos el token de Blob
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("BLOB_READ_WRITE_TOKEN no está configurado")
      throw new Error("Token de Vercel Blob no configurado")
    }

    // Subir archivo comprimido a Vercel Blob
    const blob = await put(fileName, compressedFile, {
      access: "public",
      addRandomSuffix: false, // Ya tenemos timestamp para unicidad
    })

    console.log(`Foto subida exitosamente: ${blob.url}`)
    return blob.url
  } catch (error) {
    console.error("Error uploading photo:", error)
    // En lugar de retornar placeholder, lanzar el error para que se maneje apropiadamente
    throw error
  }
}

export async function uploadMultipleReviewPhotos(files: File[], userId: string, reviewId: string): Promise<string[]> {
  console.log(`Subiendo ${files.length} fotos para usuario ${userId}, reseña ${reviewId}`)

  const uploadPromises = files.map((file, index) => uploadReviewPhoto(file, userId, reviewId, index + 1))

  try {
    const results = await Promise.all(uploadPromises)
    const successfulUploads = results.filter((url): url is string => url !== null)
    console.log(`${successfulUploads.length} de ${files.length} fotos subidas exitosamente`)
    return successfulUploads
  } catch (error) {
    console.error("Error en upload múltiple:", error)
    // Intentar subir una por una para identificar cuáles fallan
    const results: string[] = []
    for (let i = 0; i < files.length; i++) {
      try {
        const url = await uploadReviewPhoto(files[i], userId, reviewId, i + 1)
        if (url) results.push(url)
      } catch (fileError) {
        console.error(`Error subiendo foto ${i + 1}:`, fileError)
        // Continuar con las demás fotos
      }
    }
    return results
  }
}

export async function deleteReviewPhoto(photoUrl: string): Promise<boolean> {
  try {
    // Extraer el pathname de la URL para usar con del()
    const url = new URL(photoUrl)
    const pathname = url.pathname.substring(1) // Remover el '/' inicial

    await del(pathname)
    console.log(`Foto eliminada: ${photoUrl}`)
    return true
  } catch (error) {
    console.error("Error deleting photo:", error)
    return false
  }
}

export async function deleteMultipleReviewPhotos(photoUrls: string[]): Promise<boolean[]> {
  const deletePromises = photoUrls.map((url) => deleteReviewPhoto(url))
  return Promise.all(deletePromises)
}

// Función alternativa para desarrollo que simula upload
export function createLocalPhotoUrl(file: File, photoIndex: number): string {
  // En desarrollo, crear URL local temporal
  if (typeof window !== "undefined") {
    return URL.createObjectURL(file)
  }
  return `/placeholder.svg?height=300&width=300&text=Foto+${photoIndex}`
}
