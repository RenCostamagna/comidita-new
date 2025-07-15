// Utilidad adicional para compresión de imágenes con más opciones

export interface CompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  maxSizeKB?: number
  outputFormat?: "jpeg" | "webp" | "png"
}

export async function compressImageAdvanced(file: File, options: CompressionOptions = {}): Promise<File> {
  const {
    maxWidth = 800,
    maxHeight = 600,
    quality = 0.8,
    maxSizeKB = 500, // 500KB máximo
    outputFormat = "jpeg",
  } = options

  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      reject(new Error("No se pudo obtener el contexto del canvas"))
      return
    }

    const img = new Image()

    img.onload = async () => {
      try {
        // Calcular nuevas dimensiones manteniendo aspect ratio
        let { width, height } = img

        const aspectRatio = width / height

        if (width > maxWidth) {
          width = maxWidth
          height = width / aspectRatio
        }

        if (height > maxHeight) {
          height = maxHeight
          width = height * aspectRatio
        }

        // Configurar canvas
        canvas.width = Math.round(width)
        canvas.height = Math.round(height)

        // Mejorar la calidad del redimensionado
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = "high"

        // Dibujar imagen redimensionada
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

        // Función para comprimir con calidad ajustable
        const compressWithQuality = (currentQuality: number): Promise<File> => {
          return new Promise((resolveCompress) => {
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  const compressedFile = new File([blob], file.name, {
                    type: `image/${outputFormat}`,
                    lastModified: Date.now(),
                  })
                  resolveCompress(compressedFile)
                } else {
                  resolveCompress(file)
                }
              },
              `image/${outputFormat}`,
              currentQuality,
            )
          })
        }

        // Comprimir y ajustar calidad si es necesario
        let currentQuality = quality
        let compressedFile = await compressWithQuality(currentQuality)

        // Si el archivo sigue siendo muy grande, reducir calidad
        while (compressedFile.size > maxSizeKB * 1024 && currentQuality > 0.1) {
          currentQuality -= 0.1
          compressedFile = await compressWithQuality(currentQuality)
        }

        console.log(`Compresión completada:`)
        console.log(`- Tamaño original: ${(file.size / 1024).toFixed(1)}KB`)
        console.log(`- Tamaño final: ${(compressedFile.size / 1024).toFixed(1)}KB`)
        console.log(`- Reducción: ${(((file.size - compressedFile.size) / file.size) * 100).toFixed(1)}%`)
        console.log(`- Calidad final: ${(currentQuality * 100).toFixed(0)}%`)

        resolve(compressedFile)
      } catch (error) {
        console.error("Error durante la compresión:", error)
        resolve(file) // Fallback al archivo original
      }
    }

    img.onerror = () => {
      console.error("Error cargando la imagen para compresión")
      resolve(file) // Fallback al archivo original
    }

    // Configurar CORS para evitar problemas
    img.crossOrigin = "anonymous"
    img.src = URL.createObjectURL(file)
  })
}

// Función para obtener información de una imagen
export function getImageInfo(file: File): Promise<{
  width: number
  height: number
  size: number
  type: string
}> {
  return new Promise((resolve, reject) => {
    const img = new Image()

    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
        size: file.size,
        type: file.type,
      })
      URL.revokeObjectURL(img.src)
    }

    img.onerror = () => {
      reject(new Error("No se pudo cargar la imagen"))
    }

    img.src = URL.createObjectURL(file)
  })
}

// Función para validar si un archivo es una imagen válida
export function validateImageFile(file: File): {
  isValid: boolean
  error?: string
} {
  // Verificar tipo MIME
  if (!file.type.startsWith("image/")) {
    return {
      isValid: false,
      error: "El archivo debe ser una imagen",
    }
  }

  // Verificar extensión
  const validExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"]
  const fileName = file.name.toLowerCase()
  const hasValidExtension = validExtensions.some((ext) => fileName.endsWith(ext))

  if (!hasValidExtension) {
    return {
      isValid: false,
      error: "Formato de imagen no soportado. Usa JPG, PNG, WebP o GIF",
    }
  }

  // Verificar tamaño máximo (10MB)
  if (file.size > 10 * 1024 * 1024) {
    return {
      isValid: false,
      error: "La imagen es muy grande. Máximo 10MB",
    }
  }

  return { isValid: true }
}
