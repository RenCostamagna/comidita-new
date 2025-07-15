import { createClient } from "@/lib/supabase/client"
import { compressImageAdvanced, validateImageFile } from "./image-compression"

// Función para comprimir imagen
async function compressImage(file: File, maxWidth = 800, maxHeight = 600, quality = 0.8): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")!
    const img = new Image()

    img.onload = () => {
      // Calcular nuevas dimensiones manteniendo aspect ratio
      let { width, height } = img

      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }
      }

      // Configurar canvas
      canvas.width = width
      canvas.height = height

      // Dibujar imagen redimensionada
      ctx.drawImage(img, 0, 0, width, height)

      // Convertir a blob comprimido
      canvas.toBlob(
        (blob) => {
          if (blob) {
            // Crear nuevo archivo con el blob comprimido
            const compressedFile = new File([blob], file.name, {
              type: "image/jpeg", // Siempre convertir a JPEG para mejor compresión
              lastModified: Date.now(),
            })
            resolve(compressedFile)
          } else {
            resolve(file) // Fallback al archivo original
          }
        },
        "image/jpeg",
        quality,
      )
    }

    img.onerror = () => {
      resolve(file) // Fallback al archivo original si hay error
    }

    img.src = URL.createObjectURL(file)
  })
}

export async function uploadReviewPhoto(
  file: File,
  userId: string,
  reviewId: string,
  photoIndex: number,
): Promise<string | null> {
  const supabase = createClient()

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
    const fileName = `${userId}_${reviewId}_${photoIndex}_${timestamp}.jpg`

    // Subir archivo comprimido a Supabase Storage
    const { data, error } = await supabase.storage.from("review-photos").upload(fileName, compressedFile, {
      cacheControl: "3600",
      upsert: true,
    })

    if (error) {
      console.error("Error uploading photo:", error)
      return `/placeholder.svg?height=300&width=300&text=Foto+${photoIndex}`
    }

    // Obtener URL pública
    const {
      data: { publicUrl },
    } = supabase.storage.from("review-photos").getPublicUrl(fileName)

    return publicUrl
  } catch (error) {
    console.error("Error uploading photo:", error)
    return `/placeholder.svg?height=300&width=300&text=Foto+${photoIndex}`
  }
}

export async function deleteReviewPhoto(photoUrl: string): Promise<boolean> {
  const supabase = createClient()

  try {
    // Extraer el nombre del archivo de la URL
    const urlParts = photoUrl.split("/")
    const fileName = urlParts[urlParts.length - 1]

    const { error } = await supabase.storage.from("review-photos").remove([fileName])

    if (error) {
      console.error("Error deleting photo:", error)
      return false
    }

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
