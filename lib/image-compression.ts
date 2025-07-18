export interface ImageValidationResult {
  isValid: boolean
  error?: string
}

export interface ImageInfo {
  width: number
  height: number
  size: number
  type: string
  name: string
}

export interface CompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  maxSizeKB?: number
  outputFormat?: "jpeg" | "png" | "webp"
}

// Validar archivo de imagen
export function validateImageFile(file: File): ImageValidationResult {
  // Verificar que sea un archivo
  if (!file) {
    return { isValid: false, error: "No se seleccionó ningún archivo" }
  }

  // Verificar tipo de archivo
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: "Formato no válido. Solo se permiten JPG, PNG, WebP y GIF",
    }
  }

  // Verificar tamaño (máximo 10MB)
  const maxSize = 10 * 1024 * 1024 // 10MB en bytes
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: "El archivo es demasiado grande. Máximo 10MB",
    }
  }

  return { isValid: true }
}

// Obtener información de la imagen
export async function getImageInfo(file: File): Promise<ImageInfo> {
  return new Promise((resolve, reject) => {
    const img = new Image()

    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
        size: file.size,
        type: file.type,
        name: file.name,
      })
      URL.revokeObjectURL(img.src)
    }

    img.onerror = () => {
      URL.revokeObjectURL(img.src)
      reject(new Error("No se pudo cargar la imagen"))
    }

    img.src = URL.createObjectURL(file)
  })
}

// Comprimir imagen con opciones avanzadas
export async function compressImageAdvanced(file: File, options: CompressionOptions = {}): Promise<File> {
  const { maxWidth = 800, maxHeight = 600, quality = 0.8, maxSizeKB = 500, outputFormat = "jpeg" } = options

  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    const img = new Image()

    img.onload = () => {
      try {
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
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height)
        }

        // Función para comprimir con calidad ajustable
        const compressWithQuality = (currentQuality: number) => {
          const mimeType = `image/${outputFormat}`

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const sizeKB = blob.size / 1024

                // Si el archivo es muy grande y podemos reducir más la calidad
                if (sizeKB > maxSizeKB && currentQuality > 0.1) {
                  compressWithQuality(currentQuality - 0.1)
                  return
                }

                // Crear archivo comprimido
                const compressedFile = new File([blob], file.name, {
                  type: mimeType,
                  lastModified: Date.now(),
                })

                resolve(compressedFile)
              } else {
                resolve(file) // Fallback al archivo original
              }
            },
            mimeType,
            currentQuality,
          )
        }

        // Iniciar compresión
        compressWithQuality(quality)
      } catch (error) {
        console.error("Error during compression:", error)
        resolve(file) // Fallback al archivo original
      }
    }

    img.onerror = () => {
      reject(new Error("No se pudo cargar la imagen para comprimir"))
    }

    img.src = URL.createObjectURL(file)
  })
}

// Redimensionar imagen manteniendo aspect ratio
export function calculateAspectRatio(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number,
): { width: number; height: number } {
  let width = originalWidth
  let height = originalHeight

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

  return { width: Math.round(width), height: Math.round(height) }
}
