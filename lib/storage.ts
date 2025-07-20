// Función para subir múltiples fotos de reseñas usando la API route
export async function uploadMultipleReviewPhotos(files: File[], userId: string, reviewId: string): Promise<string[]> {
  console.log(`Iniciando upload de ${files.length} fotos para usuario ${userId}, reseña ${reviewId}`)

  try {
    const formData = new FormData()

    // Filtrar y validar que todos los elementos sean archivos válidos
    const validFiles: File[] = []

    for (let index = 0; index < files.length; index++) {
      const file = files[index]

      // Verificar que sea un File válido y no un string
      if (!(file instanceof File)) {
        console.warn(`Elemento ${index + 1} no es un File válido:`, typeof file, file)
        continue
      }

      console.log(`Validando archivo ${index + 1}: ${file.name} (${file.size} bytes)`)

      if (!file.type.startsWith("image/")) {
        console.warn(`Archivo ${file.name} no es una imagen, saltando...`)
        continue
      }

      // Verificar que el archivo tenga contenido
      if (file.size === 0) {
        console.warn(`Archivo ${file.name} está vacío, saltando...`)
        continue
      }

      let cleanFile = file
      if (!file.name || file.name === "blob" || file.name === "image" || file.name.includes("�")) {
        const timestamp = Date.now()
        const extension = file.type.split("/")[1] || "jpg"
        const newName = `photo_${timestamp}_${index}.${extension}`

        try {
          cleanFile = new File([file], newName, {
            type: file.type,
            lastModified: file.lastModified,
          })
          console.log(`Archivo renombrado: ${file.name} -> ${newName}`)
        } catch (error) {
          console.error(`Error renombrando archivo ${file.name}:`, error)
          continue
        }
      }

      validFiles.push(cleanFile)
    }

    if (validFiles.length === 0) {
      throw new Error("No se encontraron archivos válidos para subir")
    }

    // Agregar solo archivos válidos al FormData
    validFiles.forEach((file, index) => {
      console.log(`Agregando al FormData: ${file.name} (${file.size} bytes, tipo: ${file.type})`)
      formData.append("photos", file)
    })

    formData.append("reviewId", reviewId)

    console.log(`Enviando ${validFiles.length} archivos válidos a /api/upload-photos...`)

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

// Función para extraer solo los archivos File del array de fotos
export function extractFilesFromPhotos(
  photos: Array<{ file: File | string; isPrimary: boolean; id?: string }>,
): File[] {
  console.log(`Extrayendo archivos File de ${photos.length} fotos...`)

  const files: File[] = []

  photos.forEach((photo, index) => {
    console.log(`Foto ${index + 1}:`, {
      type: typeof photo.file,
      isFile: photo.file instanceof File,
      isString: typeof photo.file === "string",
      constructor: photo.file?.constructor?.name,
    })

    if (photo.file instanceof File) {
      files.push(photo.file)
      console.log(`✅ Archivo File agregado: ${photo.file.name}`)
    } else if (typeof photo.file === "string") {
      console.log(`⚠️ Saltando URL string: ${photo.file.substring(0, 50)}...`)
    } else {
      console.warn(`❌ Tipo de archivo no reconocido:`, typeof photo.file, photo.file)
    }
  })

  console.log(`Resultado: ${files.length} archivos File extraídos de ${photos.length} fotos`)
  return files
}

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

export function generateUniqueFileName(originalName: string, userId: string, reviewId: string): string {
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 15)

  const cleanName = originalName
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .replace(/_{2,}/g, "_")
    .toLowerCase()

  const fileExtension = cleanName.split(".").pop() || "jpg"
  return `reviews/${userId}/${reviewId}/${timestamp}_${randomString}.${fileExtension}`
}

export function createLocalPhotoUrl(file: File, photoIndex: number): string {
  if (typeof window !== "undefined") {
    return URL.createObjectURL(file)
  }
  return `/placeholder.svg?height=300&width=300&text=Foto+${photoIndex}`
}
