interface CompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  maxSizeKB?: number
  outputFormat?: "jpeg" | "png" | "webp"
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

export function validateImageFile(file: File): ValidationResult {
  // Verificar tipo de archivo
  if (!file.type.startsWith("image/")) {
    return { isValid: false, error: "El archivo debe ser una imagen" }
  }

  // Verificar tamaño máximo (10MB)
  const maxSize = 10 * 1024 * 1024 // 10MB en bytes
  if (file.size > maxSize) {
    return { isValid: false, error: "La imagen debe ser menor a 10MB" }
  }

  // Verificar tipos permitidos
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: "Formato no soportado. Usa JPG, PNG o WebP" }
  }

  return { isValid: true }
}

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

export async function compressImageAdvanced(file: File, options: CompressionOptions = {}): Promise<File> {
  const { maxWidth = 800, maxHeight = 600, quality = 0.85, maxSizeKB = 400, outputFormat = "jpeg" } = options

  // Si estamos en el servidor (Node.js), usar sharp
  if (typeof window === "undefined") {
    return compressImageServer(file, options)
  }

  // Si estamos en el cliente, usar Canvas
  return compressImageClient(file, options)
}

// Función para comprimir en el servidor usando sharp
async function compressImageServer(file: File, options: CompressionOptions): Promise<File> {
  try {
    const sharp = (await import("sharp")).default
    const { maxWidth = 800, maxHeight = 600, quality = 85, outputFormat = "jpeg" } = options

    const buffer = Buffer.from(await file.arrayBuffer())

    let sharpInstance = sharp(buffer).resize(maxWidth, maxHeight, {
      fit: "inside",
      withoutEnlargement: true,
    })

    if (outputFormat === "jpeg") {
      sharpInstance = sharpInstance.jpeg({ quality: Math.round(quality * 100) })
    } else if (outputFormat === "png") {
      sharpInstance = sharpInstance.png({ quality: Math.round(quality * 100) })
    } else if (outputFormat === "webp") {
      sharpInstance = sharpInstance.webp({ quality: Math.round(quality * 100) })
    }

    const compressedBuffer = await sharpInstance.toBuffer()

    return new File([compressedBuffer], file.name, {
      type: `image/${outputFormat}`,
      lastModified: Date.now(),
    })
  } catch (error) {
    console.error("Error comprimiendo imagen en servidor:", error)
    // Fallback: retornar archivo original
    return file
  }
}

// Función para comprimir en el cliente usando Canvas
async function compressImageClient(file: File, options: CompressionOptions): Promise<File> {
  const { maxWidth = 800, maxHeight = 600, quality = 0.85, maxSizeKB = 400, outputFormat = "jpeg" } = options

  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    const img = new Image()

    if (!ctx) {
      reject(new Error("No se pudo crear el contexto del canvas"))
      return
    }

    img.onload = () => {
      // Calcular nuevas dimensiones manteniendo aspect ratio
      let { width, height } = img

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width *= ratio
        height *= ratio
      }

      canvas.width = width
      canvas.height = height

      // Dibujar imagen redimensionada
      ctx.drawImage(img, 0, 0, width, height)

      // Convertir a blob con la calidad especificada
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Error al comprimir la imagen"))
            return
          }

          // Verificar si el tamaño está dentro del límite
          const sizeKB = blob.size / 1024
          console.log(`Imagen comprimida: ${sizeKB.toFixed(1)}KB (límite: ${maxSizeKB}KB)`)

          // Si aún es muy grande, reducir más la calidad
          if (sizeKB > maxSizeKB && quality > 0.3) {
            const newQuality = Math.max(0.3, quality * 0.8)
            console.log(`Imagen muy grande, reduciendo calidad a ${newQuality}`)

            canvas.toBlob(
              (secondBlob) => {
                if (!secondBlob) {
                  reject(new Error("Error en segunda compresión"))
                  return
                }

                const compressedFile = new File([secondBlob], file.name, {
                  type: `image/${outputFormat}`,
                  lastModified: Date.now(),
                })
                resolve(compressedFile)
              },
              `image/${outputFormat}`,
              newQuality,
            )
          } else {
            const compressedFile = new File([blob], file.name, {
              type: `image/${outputFormat}`,
              lastModified: Date.now(),
            })
            resolve(compressedFile)
          }
        },
        `image/${outputFormat}`,
        quality,
      )
    }

    img.onerror = () => reject(new Error("Error al cargar la imagen"))
    img.src = URL.createObjectURL(file)
  })
}
