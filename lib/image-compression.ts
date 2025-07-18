interface ImageInfo {
  width: number
  height: number
  size: number
  type: string
}

// Función para validar archivos de imagen
export function validateImageFile(file: File): { isValid: boolean; error?: string } {
  // Verificar que es un archivo
  if (!file) {
    return { isValid: false, error: "No se proporcionó archivo" }
  }

  // Verificar tipo de archivo
  if (!file.type.startsWith("image/")) {
    return { isValid: false, error: "El archivo debe ser una imagen" }
  }

  // Verificar tamaño (máximo 10MB)
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    return { isValid: false, error: "La imagen es muy grande (máximo 10MB)" }
  }

  // Verificar tipos permitidos
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: "Tipo de archivo no permitido. Use JPG, PNG o WebP" }
  }

  return { isValid: true }
}

// Función para obtener información de la imagen
export async function getImageInfo(file: File): Promise<ImageInfo> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
        size: file.size,
        type: file.type,
      })
    }
    img.onerror = () => reject(new Error("No se pudo cargar la imagen"))
    img.src = URL.createObjectURL(file)
  })
}

// Función para comprimir imagen usando Canvas (solo cliente)
export function compressImageWithCanvas(
  file: File,
  options: {
    maxWidth?: number
    maxHeight?: number
    quality?: number
    outputFormat?: string
  } = {},
): Promise<File> {
  return new Promise((resolve, reject) => {
    const { maxWidth = 800, maxHeight = 600, quality = 0.8, outputFormat = "image/jpeg" } = options

    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    const img = new Image()

    img.onload = () => {
      // Calcular nuevas dimensiones manteniendo aspect ratio
      let { width, height } = img

      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }

      if (height > maxHeight) {
        width = (width * maxHeight) / height
        height = maxHeight
      }

      // Configurar canvas
      canvas.width = width
      canvas.height = height

      // Dibujar imagen redimensionada
      ctx?.drawImage(img, 0, 0, width, height)

      // Convertir a blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: outputFormat,
              lastModified: Date.now(),
            })
            resolve(compressedFile)
          } else {
            reject(new Error("Error comprimiendo imagen"))
          }
        },
        outputFormat,
        quality,
      )
    }

    img.onerror = () => reject(new Error("Error cargando imagen"))
    img.src = URL.createObjectURL(file)
  })
}

// Función principal de compresión (solo para cliente)
export async function compressImageAdvanced(
  file: File,
  options: {
    maxWidth?: number
    maxHeight?: number
    quality?: number
    maxSizeKB?: number
    outputFormat?: "jpeg" | "png" | "webp"
  } = {},
): Promise<File> {
  // Solo funciona en el cliente
  if (typeof window === "undefined") {
    throw new Error("La compresión de imágenes solo funciona en el cliente")
  }

  const { maxWidth = 800, maxHeight = 600, quality = 0.8, maxSizeKB = 500, outputFormat = "jpeg" } = options

  const mimeType = `image/${outputFormat}`

  try {
    let compressedFile = await compressImageWithCanvas(file, {
      maxWidth,
      maxHeight,
      quality,
      outputFormat: mimeType,
    })

    // Si el archivo sigue siendo muy grande, reducir calidad
    let currentQuality = quality
    while (compressedFile.size > maxSizeKB * 1024 && currentQuality > 0.1) {
      currentQuality -= 0.1
      compressedFile = await compressImageWithCanvas(file, {
        maxWidth,
        maxHeight,
        quality: currentQuality,
        outputFormat: mimeType,
      })
    }

    return compressedFile
  } catch (error) {
    console.error("Error comprimiendo imagen:", error)
    // Si falla la compresión, devolver archivo original
    return file
  }
}
