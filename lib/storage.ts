// Función para subir múltiples fotos de reseñas usando la API route
export async function uploadMultipleReviewPhotos(files: File[], userId: string, reviewId: string): Promise<string[]> {
  console.log(`📱 Iniciando upload de ${files.length} fotos para usuario ${userId}, reseña ${reviewId}`)

  try {
    const formData = new FormData()

    // Procesar archivos para móviles con nombres únicos
    const processedFiles: File[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      console.log(`📱 Procesando archivo ${i + 1}: ${file.name} (${file.size} bytes)`)

      // Validar archivo antes de agregarlo
      if (!file.type.startsWith("image/")) {
        console.warn(`⚠️ Archivo ${file.name} no es una imagen, saltando...`)
        continue
      }

      // Para móviles, asegurar que el archivo tenga un nombre válido y único
      let fileName = file.name
      if (!fileName || fileName === "blob" || fileName === "image") {
        // Generar nombre si no tiene uno válido (común en móviles)
        const timestamp = Date.now()
        const extension = file.type.split("/")[1] || "jpg"
        fileName = `mobile_photo_${timestamp}_${i}.${extension}`
        console.log(`📱 Archivo móvil sin nombre, generando: ${fileName}`)
      }

      // Limpiar nombre y agregar índice para evitar duplicados
      const cleanName = fileName
        .replace(/[^a-zA-Z0-9.-]/g, "_")
        .replace(/_{2,}/g, "_")
        .toLowerCase()

      const nameParts = cleanName.split(".")
      const extension = nameParts.pop() || "jpg"
      const baseName = nameParts.join(".")
      const uniqueName = `${baseName}_${i}_${Date.now()}.${extension}`

      // Crear nuevo archivo con nombre único si es necesario
      const processedFile =
        fileName !== uniqueName
          ? new File([file], uniqueName, {
              type: file.type,
              lastModified: file.lastModified,
            })
          : file

      processedFiles.push(processedFile)
      console.log(`✅ Archivo ${i + 1} procesado: ${processedFile.name}`)
    }

    // Agregar archivos procesados al FormData
    processedFiles.forEach((file, index) => {
      formData.append("photos", file)
      console.log(`📤 Agregando al FormData: ${file.name} (índice ${index})`)
    })

    formData.append("reviewId", reviewId)

    console.log(`📡 Enviando ${processedFiles.length} archivos a /api/upload-photos...`)

    const response = await fetch("/api/upload-photos", {
      method: "POST",
      body: formData,
    })

    console.log("📡 Response status:", response.status)

    if (!response.ok) {
      const errorData = await response.json()
      console.error("❌ Error response:", errorData)
      throw new Error(errorData.error || `Error HTTP ${response.status}`)
    }

    const data = await response.json()
    console.log("✅ Upload response:", data)

    // Debug: verificar que las URLs sean de Vercel Blob
    console.log("🔗 URLs devueltas por la API:", data.uploadedUrls)
    data.uploadedUrls?.forEach((url: string, index: number) => {
      console.log(`🔗 URL ${index + 1}:`, url)
      if (url.includes("blob.vercel-storage.com")) {
        console.log("✅ URL de Vercel Blob correcta")
      } else {
        console.warn("⚠️ URL no es de Vercel Blob:", url)
      }
    })

    if (data.errors && data.errors.length > 0) {
      console.warn("⚠️ Algunos archivos tuvieron errores:", data.errors)
    }

    return data.uploadedUrls || []
  } catch (error) {
    console.error("💥 Error en uploadMultipleReviewPhotos:", error)
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
      console.error("❌ Error eliminando foto:", errorData)
      return false
    }

    console.log("✅ Foto eliminada exitosamente")
    return true
  } catch (error) {
    console.error("💥 Error en deleteReviewPhoto:", error)
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

  // Limpiar nombre original
  const cleanName = originalName
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .replace(/_{2,}/g, "_")
    .toLowerCase()

  const fileExtension = cleanName.split(".").pop() || "jpg"
  return `reviews/${userId}/${reviewId}/${timestamp}_${randomString}.${fileExtension}`
}

// Función alternativa para desarrollo que simula upload
export function createLocalPhotoUrl(file: File, photoIndex: number): string {
  if (typeof window !== "undefined") {
    return URL.createObjectURL(file)
  }
  return `/placeholder.svg?height=300&width=300&text=Foto+${photoIndex}`
}
