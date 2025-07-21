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
  isMobile?: boolean
}

// Validación de archivos de imagen
export interface ValidationResult {
  isValid: boolean
  error?: string
}

// Detectar si es dispositivo móvil
export function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false

  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.innerWidth <= 768
  )
}

// Función para validar archivos de imagen
export function validateImageFile(
  file: File,
  maxSizePerPhoto = 10,
  acceptedFormats: string[] = ["image/jpeg", "image/jpg", "image/png", "image/webp"],
): ValidationResult {
  // Verificar que es un archivo
  if (!file) {
    return { isValid: false, error: "No se proporcionó archivo" }
  }

  // Verificar tipo de archivo
  if (!file.type.startsWith("image/")) {
    return { isValid: false, error: "El archivo no es una imagen" }
  }

  // Verificar tamaño (convertir MB a bytes)
  const maxSize = maxSizePerPhoto * 1024 * 1024
  if (file.size > maxSize) {
    return { isValid: false, error: `El archivo es muy grande (máximo ${maxSizePerPhoto}MB)` }
  }

  // Verificar tipos permitidos
  if (!acceptedFormats.includes(file.type)) {
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
  const isMobile = options.isMobile ?? isMobileDevice()

  // Configuración más agresiva para móvil
  const defaultOptions = isMobile
    ? {
        maxWidth: 800,
        maxHeight: 600,
        quality: 0.7,
        outputFormat: "jpeg" as const,
      }
    : {
        maxWidth: 1200,
        maxHeight: 900,
        quality: 0.8,
        outputFormat: "jpeg" as const,
      }

  const {
    maxWidth = defaultOptions.maxWidth,
    maxHeight = defaultOptions.maxHeight,
    quality = defaultOptions.quality,
    outputFormat = defaultOptions.outputFormat,
  } = options

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

      // Mejorar calidad de renderizado
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = "high"

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

          console.log(`📷 Imagen comprimida: ${file.name}`, {
            originalSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
            compressedSize: `${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`,
            reduction: `${(((file.size - compressedFile.size) / file.size) * 100).toFixed(1)}%`,
            dimensions: `${width}x${height}`,
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

// Función para comprimir múltiples imágenes
export async function compressMultipleImages(
  files: File[],
  options: CompressionOptions = {},
  onProgress?: (progress: number, currentFile: string) => void,
): Promise<File[]> {
  const compressedFiles: File[] = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]

    try {
      onProgress?.(((i + 1) / files.length) * 100, file.name)

      // Solo comprimir si el archivo es mayor a 1MB o si estamos en móvil
      const shouldCompress = file.size > 1024 * 1024 || isMobileDevice()

      if (shouldCompress) {
        const compressed = await compressImageAdvanced(file, options)
        compressedFiles.push(compressed)
      } else {
        compressedFiles.push(file)
      }
    } catch (error) {
      console.error(`Error comprimiendo ${file.name}:`, error)
      // Si falla la compresión, usar el archivo original
      compressedFiles.push(file)
    }
  }

  return compressedFiles
}

// Función para calcular el tamaño total de archivos
export function calculateTotalSize(files: File[]): number {
  return files.reduce((total, file) => total + file.size, 0)
}

// Función para verificar si el payload excederá el límite
export function willExceedPayloadLimit(files: File[], limitMB = 4): boolean {
  const totalSize = calculateTotalSize(files)
  const limitBytes = limitMB * 1024 * 1024
  return totalSize > limitBytes
}
