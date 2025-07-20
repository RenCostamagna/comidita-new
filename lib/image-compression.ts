// Tipos para la información de imagen
export interface ImageInfo {
  width: number
  height: number
  size: number
  type: string
  name: string
}

// Opciones de compresión
export interface CompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  maxSizeKB?: number
  outputFormat?: "jpeg" | "png" | "webp"
}

// Validación de archivos de imagen
export interface ValidationResult {
  isValid: boolean
  error?: string
}

// Función para validar archivos de imagen con mejor soporte móvil
export function validateImageFile(
  file: File,
  maxSizePerPhoto = 10,
  acceptedFormats: string[] = ["image/jpeg", "image/jpg", "image/png", "image/webp"],
): ValidationResult {
  // Verificar que es un archivo
  if (!file) {
    return { isValid: false, error: "No se proporcionó archivo" }
  }

  // Verificar tipo de archivo - más flexible para móviles
  if (!file.type) {
    // Si no hay tipo, intentar inferir del nombre
    const fileName = file.name?.toLowerCase() || ""
    const hasImageExtension = /\.(jpg|jpeg|png|webp)$/i.test(fileName)
    if (!hasImageExtension) {
      return { isValid: false, error: "El archivo no parece ser una imagen" }
    }
  } else if (!file.type.startsWith("image/")) {
    return { isValid: false, error: "El archivo no es una imagen" }
  }

  // Verificar tamaño (convertir MB a bytes)
  const maxSize = maxSizePerPhoto * 1024 * 1024
  if (file.size > maxSize) {
    return { isValid: false, error: `El archivo es muy grande (máximo ${maxSizePerPhoto}MB)` }
  }

  // Verificar tamaño mínimo (evitar archivos corruptos)
  if (file.size < 100) {
    return { isValid: false, error: "El archivo es muy pequeño" }
  }

  // Verificar tipos permitidos - más flexible para móviles
  if (
    file.type &&
    !acceptedFormats.some(
      (format) =>
        file.type === format ||
        file.type === format.replace("jpeg", "jpg") ||
        file.type === format.replace("jpg", "jpeg"),
    )
  ) {
    return { isValid: false, error: "Tipo de archivo no permitido. Use JPG, PNG o WebP" }
  }

  return { isValid: true }
}

// Función para obtener información de la imagen con mejor manejo de errores
export async function getImageInfo(file: File): Promise<ImageInfo> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    // Timeout para evitar cuelgues en móviles
    const timeout = setTimeout(() => {
      URL.revokeObjectURL(url)
      reject(new Error("Timeout cargando la imagen"))
    }, 10000)

    img.onload = () => {
      clearTimeout(timeout)
      URL.revokeObjectURL(url)
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
        size: file.size,
        type: file.type || "image/jpeg",
        name: file.name || "image.jpg",
      })
    }

    img.onerror = () => {
      clearTimeout(timeout)
      URL.revokeObjectURL(url)
      reject(new Error("Error cargando la imagen"))
    }

    img.src = url
  })
}

// Función para comprimir imagen usando Canvas (solo cliente) con mejor soporte móvil
export async function compressImageAdvanced(file: File, options: CompressionOptions = {}): Promise<File> {
  const { maxWidth = 800, maxHeight = 600, quality = 0.8, outputFormat = "jpeg" } = options

  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")

    if (!ctx) {
      reject(new Error("No se pudo crear contexto de canvas"))
      return
    }

    img.onload = () => {
      try {
        // Calcular nuevas dimensiones manteniendo proporción
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

        // Limpiar canvas
        ctx.fillStyle = "#FFFFFF"
        ctx.fillRect(0, 0, width, height)

        // Dibujar imagen redimensionada
        ctx.drawImage(img, 0, 0, width, height)

        // Convertir a blob con mejor manejo de errores
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Error comprimiendo imagen"))
              return
            }

            // Crear nuevo archivo con nombre limpio
            const fileName = file.name || `compressed_image.${outputFormat}`
            const compressedFile = new File([blob], fileName, {
              type: `image/${outputFormat}`,
              lastModified: Date.now(),
            })

            resolve(compressedFile)
          },
          `image/${outputFormat}`,
          quality,
        )
      } catch (error) {
        reject(new Error(`Error procesando imagen: ${error instanceof Error ? error.message : "Error desconocido"}`))
      }
    }

    img.onerror = () => {
      reject(new Error("Error cargando imagen para comprimir"))
    }

    // Configurar crossOrigin para evitar problemas CORS
    img.crossOrigin = "anonymous"
    img.src = URL.createObjectURL(file)
  })
}
