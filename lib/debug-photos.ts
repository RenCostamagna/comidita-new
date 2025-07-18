// Utilidad para debuggear problemas con fotos
export function debugPhotoUrl(url: string, context = "") {
  console.log(`[DEBUG PHOTO ${context}]`, {
    url,
    isValidUrl: isValidUrl(url),
    isBlobUrl: url.includes("blob.vercel-storage.com"),
    isPlaceholder: url.includes("placeholder.svg"),
    urlLength: url.length,
    startsWithHttp: url.startsWith("http"),
  })
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function sanitizePhotoUrl(url: string | null | undefined): string {
  if (!url || typeof url !== "string") {
    return "/placeholder.svg?height=300&width=300&text=Sin+imagen"
  }

  const trimmedUrl = url.trim()

  if (!trimmedUrl) {
    return "/placeholder.svg?height=300&width=300&text=Sin+imagen"
  }

  // Verificar si es una URL válida
  if (!isValidUrl(trimmedUrl)) {
    console.error("URL inválida:", trimmedUrl)
    return "/placeholder.svg?height=300&width=300&text=URL+inválida"
  }

  return trimmedUrl
}
