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

// Función mejorada para detectar tipo de archivo real
export function detectRealFileType(file: File): { type: string; extension: string } {
  console.log(`🔍 [DETECT] Detectando tipo real para archivo:`, {
    name: file.name,
    type: file.type,
    size: file.size,
  })

  // Si el tipo está presente y es válido, usarlo
  if (file.type && file.type.startsWith("image/")) {
    const extension = file.type.split("/")[1] || "jpg"
    console.log(`✅ [DETECT] Tipo válido encontrado: ${file.type} -> .${extension}`)
    return { type: file.type, extension }
  }

  // Si el nombre tiene extensión, intentar detectar por extensión
  if (file.name && file.name.includes(".")) {
    const nameExtension = file.name.split(".").pop()?.toLowerCase()
    console.log(`🔍 [DETECT] Extensión del nombre: ${nameExtension}`)

    switch (nameExtension) {
      case "heic":
      case "heif":
        console.log(`📱 [DETECT] Archivo HEIC/HEIF detectado, convirtiendo a JPEG`)
        return { type: "image/jpeg", extension: "jpg" }
      case "jpg":
      case "jpeg":
        return { type: "image/jpeg", extension: "jpg" }
      case "png":
        return { type: "image/png", extension: "png" }
      case "webp":
        return { type: "image/webp", extension: "webp" }
      case "gif":
        return { type: "image/gif", extension: "gif" }
      default:
        console.log(`⚠️ [DETECT] Extensión desconocida: ${nameExtension}, usando JPEG por defecto`)
        return { type: "image/jpeg", extension: "jpg" }
    }
  }

  // Fallback para archivos sin nombre o tipo
  console.log(`🔧 [DETECT] Sin tipo ni extensión válida, usando JPEG por defecto`)
  return { type: "image/jpeg", extension: "jpg" }
}

// Función para validar archivos de imagen con mejor soporte HEIC
export function validateImageFile(
  file: File,
  maxSizePerPhoto = 10,
  acceptedFormats: string[] = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic", "image/heif"],
): ValidationResult {
  console.log(`🔍 [VALIDATE] Validando archivo:`, {
    name: file.name,
    type: file.type,
    size: file.size,
    acceptedFormats,
  })

  // Verificar que es un archivo
  if (!file) {
    return { isValid: false, error: "No se proporcionó archivo" }
  }

  // Detectar tipo real del archivo
  const { type: realType } = detectRealFileType(file)

  // Verificar que es una imagen (por tipo detectado o tipo original)
  const isImage =
    file.type.startsWith("image/") ||
    realType.startsWith("image/") ||
    file.name?.toLowerCase().match(/\.(jpg|jpeg|png|webp|heic|heif|gif)$/i)

  if (!isImage) {
    console.log(`❌ [VALIDATE] No es una imagen:`, { fileType: file.type, realType, fileName: file.name })
    return { isValid: false, error: "El archivo no es una imagen" }
  }

  // Verificar tamaño (convertir MB a bytes)
  const maxSize = maxSizePerPhoto * 1024 * 1024
  if (file.size > maxSize) {
    console.log(`❌ [VALIDATE] Archivo muy grande:`, {
      fileSize: file.size,
      maxSize,
      fileSizeMB: (file.size / 1024 / 1024).toFixed(2),
      maxSizeMB: maxSizePerPhoto,
    })
    return { isValid: false, error: `El archivo es muy grande (máximo ${maxSizePerPhoto}MB)` }
  }

  // Para archivos HEIC/HEIF, son válidos aunque no estén en acceptedFormats
  if (
    realType === "image/jpeg" &&
    (file.name?.toLowerCase().includes("heic") || file.name?.toLowerCase().includes("heif"))
  ) {
    console.log(`✅ [VALIDATE] Archivo HEIC/HEIF válido, será convertido a JPEG`)
    return { isValid: true }
  }

  // Verificar tipos permitidos (usar tipo real)
  const isAcceptedType = acceptedFormats.includes(realType) || acceptedFormats.includes(file.type)
  if (!isAcceptedType) {
    console.log(`❌ [VALIDATE] Tipo no permitido:`, {
      fileType: file.type,
      realType,
      acceptedFormats,
    })
    return { isValid: false, error: "Tipo de archivo no permitido. Use JPG, PNG, WebP o HEIC" }
  }

  console.log(`✅ [VALIDATE] Archivo válido:`, { realType, size: file.size })
  return { isValid: true }
}

// Función para obtener información de la imagen
export async function getImageInfo(file: File): Promise<ImageInfo> {
  console.log(`📊 [INFO] Obteniendo información de imagen para:`, file.name)

  return new Promise((resolve, reject) => {
    const img = new Image()

    // Detectar tipo real para el procesamiento
    const { type: realType } = detectRealFileType(file)

    // Para archivos HEIC, intentar crear URL directamente
    // El navegador moderno debería manejar la conversión automáticamente
    const url = URL.createObjectURL(file)

    console.log(`🖼️ [INFO] Creando imagen con URL:`, {
      fileName: file.name,
      realType,
      originalType: file.type,
      urlCreated: true,
    })

    img.onload = () => {
      URL.revokeObjectURL(url)
      console.log(`✅ [INFO] Imagen cargada exitosamente:`, {
        fileName: file.name,
        dimensions: `${img.naturalWidth}x${img.naturalHeight}`,
        fileSize: file.size,
        realType,
      })
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
        size: file.size,
        type: realType, // Usar tipo real detectado
        name: file.name,
      })
    }

    img.onerror = (error) => {
      URL.revokeObjectURL(url)
      console.error(`❌ [INFO] Error cargando imagen:`, {
        fileName: file.name,
        error,
        fileType: file.type,
        realType,
      })
      reject(new Error(`Error cargando la imagen ${file.name}. Puede ser un formato no soportado.`))
    }

    // Configurar crossOrigin para evitar problemas CORS
    img.crossOrigin = "anonymous"
    img.src = url
  })
}

// Función para comprimir imagen usando Canvas (solo cliente) con soporte HEIC
export async function compressImageAdvanced(file: File, options: CompressionOptions = {}): Promise<File> {
  const { maxWidth = 800, maxHeight = 600, quality = 0.8, outputFormat = "jpeg" } = options

  console.log(`🗜️ [COMPRESS] Iniciando compresión:`, {
    fileName: file.name,
    originalSize: file.size,
    options,
  })

  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")

    if (!ctx) {
      reject(new Error("No se pudo crear contexto de canvas"))
      return
    }

    // Detectar tipo real
    const { type: realType, extension } = detectRealFileType(file)

    img.onload = () => {
      console.log(`🖼️ [COMPRESS] Imagen cargada para compresión:`, {
        originalDimensions: `${img.width}x${img.height}`,
        targetDimensions: `${maxWidth}x${maxHeight}`,
      })

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

      console.log(`📐 [COMPRESS] Nuevas dimensiones calculadas: ${width}x${height}`)

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

          // Crear nombre apropiado
          const originalName = file.name || `compressed_image_${Date.now()}`
          const baseName = originalName.replace(/\.[^/.]+$/, "") // Remover extensión
          const newName = `${baseName}.${outputFormat === "jpeg" ? "jpg" : outputFormat}`

          // Crear nuevo archivo
          const compressedFile = new File([blob], newName, {
            type: `image/${outputFormat}`,
            lastModified: Date.now(),
          })

          console.log(`✅ [COMPRESS] Compresión completada:`, {
            originalSize: file.size,
            compressedSize: compressedFile.size,
            reduction: `${Math.round((1 - compressedFile.size / file.size) * 100)}%`,
            newName: compressedFile.name,
          })

          resolve(compressedFile)
        },
        `image/${outputFormat}`,
        quality,
      )
    }

    img.onerror = (error) => {
      console.error(`❌ [COMPRESS] Error cargando imagen para comprimir:`, {
        fileName: file.name,
        error,
        realType,
      })
      reject(new Error(`Error cargando imagen para comprimir: ${file.name}`))
    }

    // Configurar crossOrigin
    img.crossOrigin = "anonymous"
    img.src = URL.createObjectURL(file)
  })
}

// Función específica para manejar archivos HEIC
export async function handleHEICFile(file: File): Promise<File> {
  console.log(`📱 [HEIC] Procesando archivo HEIC:`, file.name)

  // Si el navegador soporta HEIC nativamente, intentar convertir a JPEG
  try {
    const compressedFile = await compressImageAdvanced(file, {
      maxWidth: 1920,
      maxHeight: 1920,
      quality: 0.85,
      outputFormat: "jpeg",
    })

    console.log(`✅ [HEIC] Archivo HEIC convertido exitosamente a JPEG`)
    return compressedFile
  } catch (error) {
    console.error(`❌ [HEIC] Error convirtiendo HEIC:`, error)

    // Si falla la conversión, crear un archivo JPEG con el contenido original
    // El servidor debería poder manejar la conversión
    const { extension } = detectRealFileType(file)
    const newName = file.name ? file.name.replace(/\.(heic|heif)$/i, ".jpg") : `heic_photo_${Date.now()}.jpg`

    const convertedFile = new File([file], newName, {
      type: "image/jpeg",
      lastModified: file.lastModified || Date.now(),
    })

    console.log(`🔧 [HEIC] Archivo HEIC renombrado para procesamiento en servidor:`, newName)
    return convertedFile
  }
}
