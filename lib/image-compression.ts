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

// Función para validar archivos de imagen
export function validateImageFile(file: File): ValidationResult {
  // Verificar que es un archivo
  if (!file) {
    return { isValid: false, error: "No se proporcionó archivo" }
  }

  // Verificar tipo de archivo
  if (!file.type.startsWith("image/")) {
    return { isValid: false, error: "El archivo no es una imagen" }
  }

  // Verificar tamaño (máximo 10MB)
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    return { isValid: false, error: "El archivo es muy grande (máximo 10MB)" }
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
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
        size: file.size,
        type: file.type,
        name: file.name,
      })
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Error cargando la imagen"))
    }

    img.src = url
  })
}

// Función para comprimir imagen usando Canvas (solo cliente)
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

      // Dibujar imagen redimensionada
      ctx.drawImage(img, 0, 0, width, height)

      // Convertir a blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Error comprimiendo imagen"))
            return
          }

          // Crear nuevo archivo
          const compressedFile = new File([blob], file.name, {
            type: `image/${outputFormat}`,
            lastModified: Date.now(),
          })

          resolve(compressedFile)
        },
        `image/${outputFormat}`,
        quality,
      )
    }

    img.onerror = () => {
      reject(new Error("Error cargando imagen para comprimir"))
    }

    img.src = URL.createObjectURL(file)
  })
}
