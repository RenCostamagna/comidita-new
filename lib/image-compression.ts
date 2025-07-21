export async function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    const img = new Image()

    img.onload = () => {
      try {
        // Determinar configuración de compresión basada en el tamaño del archivo
        let maxWidth = 1920
        let maxHeight = 1080
        let quality = 0.8

        const fileSizeMB = file.size / (1024 * 1024)

        if (fileSizeMB > 5) {
          // Archivos muy grandes: compresión agresiva
          maxWidth = 1280
          maxHeight = 720
          quality = 0.6
        } else if (fileSizeMB > 2) {
          // Archivos medianos: compresión moderada
          maxWidth = 1600
          maxHeight = 900
          quality = 0.7
        } else if (fileSizeMB > 1) {
          // Archivos pequeños: compresión ligera
          quality = 0.8
        } else {
          // Archivos muy pequeños: mínima compresión
          quality = 0.9
        }

        // Calcular nuevas dimensiones manteniendo aspect ratio
        let { width, height } = img

        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height

          if (width > height) {
            width = maxWidth
            height = width / aspectRatio
          } else {
            height = maxHeight
            width = height * aspectRatio
          }
        }

        // Configurar canvas
        canvas.width = width
        canvas.height = height

        if (!ctx) {
          throw new Error("No se pudo obtener el contexto del canvas")
        }

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
              type: "image/jpeg",
              lastModified: Date.now(),
            })

            console.log(`🗜️ Compresión completada:`)
            console.log(`   Original: ${(file.size / 1024 / 1024).toFixed(2)}MB`)
            console.log(`   Comprimido: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`)
            console.log(`   Reducción: ${((1 - compressedFile.size / file.size) * 100).toFixed(1)}%`)
            console.log(`   Dimensiones: ${width}x${height}`)
            console.log(`   Calidad: ${(quality * 100).toFixed(0)}%`)

            resolve(compressedFile)
          },
          "image/jpeg",
          quality,
        )
      } catch (error) {
        reject(error)
      }
    }

    img.onerror = () => {
      reject(new Error("Error al cargar la imagen"))
    }

    // Cargar imagen
    img.src = URL.createObjectURL(file)
  })
}

export async function autoCompressImage(file: File): Promise<File> {
  // Si el archivo es menor a 500KB, no comprimir
  if (file.size < 500 * 1024) {
    console.log(`📸 Archivo pequeño (${(file.size / 1024).toFixed(0)}KB), no se comprime`)
    return file
  }

  // Comprimir archivos más grandes
  return compressImage(file)
}
