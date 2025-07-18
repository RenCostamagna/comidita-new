// Utilidad para validar y limpiar URLs de fotos
export function validatePhotoUrls(urls: string[]): string[] {
  return urls
    .filter((url) => url && typeof url === "string" && url.trim().length > 0)
    .map((url) => url.trim())
    .filter((url) => {
      // Validar que sea una URL válida
      try {
        new URL(url)
        return true
      } catch {
        console.warn("URL inválida filtrada:", url)
        return false
      }
    })
}

// Función para verificar si una URL es de Vercel Blob
export function isVercelBlobUrl(url: string): boolean {
  return url.includes("blob.vercel-storage.com")
}

// Función para debug de URLs
export function debugPhotoUrls(urls: string[], context = "") {
  console.log(`[DEBUG PHOTO URLS${context ? " - " + context : ""}]`, {
    totalUrls: urls.length,
    urls: urls.map((url, index) => ({
      index,
      url,
      isVercelBlob: isVercelBlobUrl(url),
      isValid: !!url && url.trim().length > 0,
    })),
  })
}
