export function sanitizePhotoUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") {
    return null
  }

  const trimmed = url.trim()
  if (!trimmed) {
    return null
  }

  // Verificar que sea una URL válida
  try {
    new URL(trimmed)
    return trimmed
  } catch {
    return null
  }
}

export function debugPhotoUrl(url: string | null | undefined, context: string) {
  const sanitized = sanitizePhotoUrl(url)
  const isValidUrl = sanitized !== null
  const isBlobUrl = sanitized?.includes("blob.vercel-storage.com") || false
  const isPlaceholder = sanitized?.includes("placeholder.svg") || false
  const startsWithHttp = sanitized?.startsWith("http") || false

  console.log(`[DEBUG PHOTO ${isValidUrl ? "SUCCESS" : "ERROR"} - ${context}]`, {
    url: sanitized || url,
    isValidUrl,
    isBlobUrl,
    isPlaceholder,
    startsWithHttp,
    urlLength: sanitized?.length || 0,
  })
}

export function getReviewPhotos(review: any): string[] {
  const photos: string[] = []

  // Primero intentar con la nueva estructura de fotos
  if (review.photos && Array.isArray(review.photos)) {
    review.photos.forEach((photo: any, index: number) => {
      const url = typeof photo === "string" ? photo : photo?.photo_url
      const sanitized = sanitizePhotoUrl(url)
      if (sanitized) {
        debugPhotoUrl(sanitized, `Foto ${index + 1} (nueva estructura)`)
        photos.push(sanitized)
      }
    })
  }

  // Si no hay fotos en la nueva estructura, intentar con campos legacy
  if (photos.length === 0) {
    const legacyFields = ["photo_1_url", "photo_2_url", "photo_3_url", "photo_4_url", "photo_5_url", "photo_6_url"]
    legacyFields.forEach((field, index) => {
      const url = review[field]
      const sanitized = sanitizePhotoUrl(url)
      if (sanitized) {
        debugPhotoUrl(sanitized, `Foto ${index + 1} (legacy)`)
        photos.push(sanitized)
      }
    })
  }

  console.log(`[DEBUG] Total fotos válidas encontradas: ${photos.length}`)
  return photos
}
