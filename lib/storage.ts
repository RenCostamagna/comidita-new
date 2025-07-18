// Función para subir fotos usando la API route
export async function uploadMultipleReviewPhotos(files: File[], userId: string, reviewId: string): Promise<string[]> {
  console.log(`Subiendo ${files.length} fotos para usuario ${userId}, reseña ${reviewId}`)

  try {
    const formData = new FormData()

    // Agregar archivos al FormData
    files.forEach((file, index) => {
      formData.append("photos", file)
    })

    formData.append("reviewId", reviewId)

    console.log("Enviando fotos a la API...")

    const response = await fetch("/api/upload-photos", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Error al subir fotos")
    }

    const result = await response.json()

    if (result.errors && result.errors.length > 0) {
      console.warn("Algunos archivos tuvieron errores:", result.errors)
    }

    console.log(`${result.uploadedUrls.length} fotos subidas exitosamente`)
    return result.uploadedUrls || []
  } catch (error) {
    console.error("Error en upload múltiple:", error)
    throw error
  }
}

// Función para eliminar fotos (también necesita ser una API route)
export async function deleteReviewPhoto(photoUrl: string): Promise<boolean> {
  try {
    const response = await fetch("/api/delete-photo", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ photoUrl }),
    })

    return response.ok
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
  if (typeof window !== "undefined") {
    return URL.createObjectURL(file)
  }
  return `/placeholder.svg?height=300&width=300&text=Foto+${photoIndex}`
}
