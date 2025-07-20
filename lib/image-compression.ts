interface CompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  maxSizeMB?: number
}

interface ImageInfo {
  width: number
  height: number
  size: number
  type: string
}

interface ValidationResult {
  isValid: boolean
  error?: string
}

export function validateImageFile(
  file: File,
  maxSizeMB = 50,
  acceptedFormats: string[] = ["image/jpeg", "image/jpg", "image/png", "image/webp"],
): ValidationResult {
  // Verificar que sea un File válido
  if (!(file instanceof File)) {
    return {
      isValid: false,
      error: "No es un archivo válido",
    }
  }

  // Verificar tipo de archivo
  if (!acceptedFormats.includes(file.type)) {
    return {
      isValid: false,
      error: `Formato no soportado. Use: ${acceptedFormats.join(", ")}`,
    }
  }

  // Verificar tamaño (convertir MB a bytes)
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  if (file.size > maxSizeBytes) {
    return {
      isValid: false,
      error: `Archivo muy grande. Máximo ${maxSizeMB}MB`,
    }
  }

  // Verificar que el archivo tenga contenido
  if (file.size === 0) {
    return {
      isValid: false,
      error: "El archivo está vacío",
    }
  }

  return { isValid: true }
}

export async function getImageInfo(file: File): Promise<ImageInfo> {
  return new Promise((resolve, reject) => {
    if (!(file instanceof File)) {
      reject(new Error("No es un archivo válido"))
      return
    }

    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
        size: file.size,
        type: file.type,
      })
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("No se pudo cargar la imagen"))
    }

    img.src = url
  })
}

export async function compressImage(file: File, options: CompressionOptions = {}): Promise<File> {
  const { maxWidth = 1920, maxHeight = 1920, quality = 0.8, maxSizeMB = 2 } = options

  // Verificar que sea un File válido
  if (!(file instanceof File)) {
    throw new Error("No es un archivo válido")
  }

  // Si el archivo ya es pequeño, devolverlo sin comprimir
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  if (file.size <= maxSizeBytes) {
    console.log(`Archivo ${file.name} ya es suficientemente pequeño (${file.size} bytes)`)
    return file
  }

  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    const img = new Image()

    if (!ctx) {
      reject(new Error("No se pudo crear el contexto del canvas"))
      return
    }

    img.onload = () => {
      // Calcular nuevas dimensiones manteniendo la proporción
      let { width, height } = img

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width *= ratio
        height *= ratio
      }

      // Configurar canvas
      canvas.width = width
      canvas.height = height

      // Dibujar imagen redimensionada
      ctx.drawImage(img, 0, 0, width, height)

      // Convertir a blob con compresión
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Error al comprimir la imagen"))
            return
          }

          // Crear nuevo archivo con el blob comprimido
          const compressedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now(),
          })

          console.log(`Imagen comprimida: ${file.size} -> ${compressedFile.size} bytes`)
          resolve(compressedFile)
        },
        file.type,
        quality,
      )
    }

    img.onerror = () => {
      reject(new Error("Error al cargar la imagen para comprimir"))
    }

    // Cargar imagen desde el archivo
    const url = URL.createObjectURL(file)
    img.src = url
  })
}

export function createImagePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!(file instanceof File)) {
      reject(new Error("No es un archivo válido"))
      return
    }

    const reader = new FileReader()

    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string)
      } else {
        reject(new Error("Error al crear preview"))
      }
    }

    reader.onerror = () => {
      reject(new Error("Error al leer el archivo"))
    }

    reader.readAsDataURL(file)
  })
}
