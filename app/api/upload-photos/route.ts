import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    console.log("=== INICIO UPLOAD PHOTOS API ===")

    // Verificar que tenemos el token de Blob
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("BLOB_READ_WRITE_TOKEN no está configurado")
      return NextResponse.json({ error: "Token de Vercel Blob no configurado" }, { status: 500 })
    }

    // Crear cliente de Supabase
    const supabase = await createClient()

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("Error de autenticación:", authError)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    console.log("Usuario autenticado:", user.id)

    // Obtener datos del formulario
    const formData = await request.formData()

    // Debug: mostrar todas las claves del FormData
    console.log("Claves en FormData:", Array.from(formData.keys()))

    const reviewId = formData.get("reviewId") as string
    console.log("Review ID recibido:", reviewId)

    if (!reviewId) {
      return NextResponse.json({ error: "ID de reseña requerido" }, { status: 400 })
    }

    console.log("=== HEADERS RECIBIDOS ===")
    console.log("Content-Type:", request.headers.get("content-type"))
    console.log("Content-Length:", request.headers.get("content-length"))

    // Obtener archivos - probar diferentes nombres de campo
    let files = formData.getAll("photos") as File[]
    if (files.length === 0) {
      files = formData.getAll("files") as File[]
    }

    console.log("Número de archivos encontrados:", files.length)

    if (files.length === 0) {
      console.log("No se encontraron archivos en FormData")
      return NextResponse.json({ error: "No se encontraron archivos" }, { status: 400 })
    }

    const uploadedUrls: string[] = []
    const errors: string[] = []

    // Log detallado de cada archivo recibido
    files.forEach((file, i) => {
      console.log(`📁 [API] Archivo recibido ${i + 1}/${files.length}:`, {
        name: file.name,
        size: file.size,
        type: file.type,
        instanceof: file instanceof File,
        isBlob: file instanceof Blob,
        lastModified: file.lastModified ? new Date(file.lastModified).toISOString() : "N/A",
      })
    })

    // Validación defensiva en el backend
    files.forEach((file, i) => {
      if (!(file instanceof Blob) || typeof file.arrayBuffer !== "function" || file.size === 0) {
        console.warn(`⚠️ [API] Archivo inválido recibido en posición ${i}:`, {
          name: file.name,
          size: file.size,
          type: file.type,
          instanceof: file instanceof File,
          isBlob: file instanceof Blob,
        })
        errors.push(`Archivo ${i + 1} inválido`)
      }
    })

    // Procesar cada archivo
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      console.log(`🔄 [API] Procesando archivo ${i + 1}/${files.length}:`, {
        name: file.name,
        size: file.size,
        type: file.type,
      })

      try {
        // Validar archivo
        if (!file.type.startsWith("image/")) {
          console.warn(`⚠️ [API] Archivo no es imagen:`, {
            name: file.name,
            type: file.type,
            detectedFromName: file.name?.toLowerCase().match(/\.(jpg|jpeg|png|webp|heic|heif|gif)$/i) ? "Sí" : "No",
          })

          // Si el nombre sugiere que es imagen pero el tipo no, intentar procesarlo
          const isImageByName = file.name?.toLowerCase().match(/\.(jpg|jpeg|png|webp|heic|heif|gif)$/i)
          if (!isImageByName) {
            errors.push(`Archivo ${file.name}: No es una imagen`)
            continue
          } else {
            console.log(`🔧 [API] Procesando como imagen basado en extensión del nombre`)
          }
        }

        if (file.size > 10 * 1024 * 1024) {
          console.warn(`⚠️ [API] Archivo muy grande:`, {
            name: file.name,
            size: file.size,
            sizeMB: (file.size / 1024 / 1024).toFixed(2),
          })
          errors.push(`Archivo ${file.name}: Muy grande (máximo 10MB)`)
          continue
        }

        // Generar nombre único con mejor manejo de extensiones
        const timestamp = Date.now()
        const randomSuffix = Math.random().toString(36).substring(2, 8)

        let fileExtension = "jpg" // Default

        // Intentar obtener extensión del tipo MIME
        if (file.type && file.type.includes("/")) {
          const mimeExtension = file.type.split("/").pop()?.toLowerCase()
          if (mimeExtension && ["jpg", "jpeg", "png", "webp", "gif"].includes(mimeExtension)) {
            fileExtension = mimeExtension === "jpeg" ? "jpg" : mimeExtension
          }
        }

        // Si no hay tipo MIME válido, intentar obtener del nombre
        if (file.name && file.name.includes(".")) {
          const nameExtension = file.name.split(".").pop()?.toLowerCase()
          if (nameExtension) {
            switch (nameExtension) {
              case "heic":
              case "heif":
                fileExtension = "jpg" // Convertir HEIC a JPG
                console.log(`📱 [API] Archivo HEIC/HEIF detectado, guardando como JPG`)
                break
              case "jpg":
              case "jpeg":
              case "png":
              case "webp":
              case "gif":
                fileExtension = nameExtension === "jpeg" ? "jpg" : nameExtension
                break
            }
          }
        }

        const fileName = `review-photos/${user.id}_${reviewId}_${timestamp}_${randomSuffix}.${fileExtension}`

        console.log(`📤 [API] Subiendo archivo como: ${fileName}`, {
          originalName: file.name,
          originalType: file.type,
          detectedExtension: fileExtension,
          finalFileName: fileName,
        })

        // Subir a Vercel Blob
        const blob = await put(fileName, file, {
          access: "public",
          addRandomSuffix: false,
        })

        uploadedUrls.push(blob.url)
        console.log(`✅ [API] Archivo subido exitosamente:`, {
          fileName: fileName,
          url: blob.url,
          size: file.size,
        })
      } catch (uploadError) {
        console.error(`💥 [API] Error subiendo archivo ${file.name}:`, {
          error: uploadError,
          errorMessage: uploadError instanceof Error ? uploadError.message : String(uploadError),
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
        })
        errors.push(
          `Error subiendo ${file.name}: ${uploadError instanceof Error ? uploadError.message : "Error desconocido"}`,
        )
      }
    }

    console.log(`🏁 [API] Resultado final:`, {
      totalFiles: files.length,
      successfulUploads: uploadedUrls.length,
      failedUploads: errors.length,
      successRate: `${Math.round((uploadedUrls.length / files.length) * 100)}%`,
      uploadedUrls: uploadedUrls,
      errors: errors,
    })

    return NextResponse.json({
      success: uploadedUrls.length > 0,
      uploadedUrls,
      errors: errors.length > 0 ? errors : undefined,
      message: `${uploadedUrls.length} de ${files.length} fotos subidas correctamente`,
    })
  } catch (error) {
    console.error("💥 [API] Error general en upload-photos:", {
      error: error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
