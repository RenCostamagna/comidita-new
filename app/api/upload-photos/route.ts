import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { createClient } from "@/lib/supabase/server"

// Límites de seguridad
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB por archivo
const MAX_TOTAL_SIZE = 3.5 * 1024 * 1024 // 3.5MB total para evitar el límite de 4.5MB
const MAX_FILES_PER_REQUEST = 1 // Procesar de a una foto para evitar límites

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

    // Verificar límites de seguridad
    if (files.length > MAX_FILES_PER_REQUEST) {
      console.warn(`Demasiados archivos en una request: ${files.length}. Máximo: ${MAX_FILES_PER_REQUEST}`)
      return NextResponse.json(
        {
          error: `Máximo ${MAX_FILES_PER_REQUEST} archivo por request. Use upload secuencial.`,
        },
        { status: 413 },
      )
    }

    // Calcular tamaño total
    const totalSize = files.reduce((sum, file) => sum + file.size, 0)
    console.log(`Tamaño total del payload: ${(totalSize / 1024 / 1024).toFixed(2)}MB`)

    if (totalSize > MAX_TOTAL_SIZE) {
      console.warn(
        `Payload muy grande: ${(totalSize / 1024 / 1024).toFixed(2)}MB. Máximo: ${(MAX_TOTAL_SIZE / 1024 / 1024).toFixed(2)}MB`,
      )
      return NextResponse.json(
        {
          error: `Payload muy grande (${(totalSize / 1024 / 1024).toFixed(2)}MB). Máximo ${(MAX_TOTAL_SIZE / 1024 / 1024).toFixed(2)}MB. Use compresión o upload secuencial.`,
        },
        { status: 413 },
      )
    }

    const uploadedUrls: string[] = []
    const errors: string[] = []

    // Procesar cada archivo
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      console.log(`Procesando archivo ${i + 1}:`, {
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        type: file.type,
      })

      try {
        // Validar archivo individual
        if (!file.type.startsWith("image/")) {
          errors.push(`Archivo ${file.name}: No es una imagen`)
          continue
        }

        if (file.size > MAX_FILE_SIZE) {
          errors.push(`Archivo ${file.name}: Muy grande (máximo ${MAX_FILE_SIZE / 1024 / 1024}MB)`)
          continue
        }

        // Generar nombre único
        const timestamp = Date.now()
        const randomSuffix = Math.random().toString(36).substring(2, 8)
        const fileExtension = file.name.split(".").pop()?.toLowerCase() || "jpg"
        const fileName = `review-photos/${user.id}_${reviewId}_${timestamp}_${randomSuffix}.${fileExtension}`

        console.log(`Subiendo archivo como: ${fileName}`)

        // Subir a Vercel Blob
        const blob = await put(fileName, file, {
          access: "public",
          addRandomSuffix: false,
        })

        uploadedUrls.push(blob.url)
        console.log(`✅ Archivo subido exitosamente: ${blob.url}`)

        // Verificar que la URL es de Vercel Blob
        if (blob.url.includes("blob.vercel-storage.com")) {
          console.log("✅ URL de Vercel Blob confirmada")
        } else {
          console.warn("⚠️ URL no es de Vercel Blob:", blob.url)
        }
      } catch (uploadError) {
        console.error(`❌ Error subiendo archivo ${file.name}:`, uploadError)

        // Manejar específicamente el error 413
        if (uploadError instanceof Error && uploadError.message.includes("413")) {
          errors.push(`${file.name}: Archivo muy grande para subir`)
        } else {
          errors.push(
            `Error subiendo ${file.name}: ${uploadError instanceof Error ? uploadError.message : "Error desconocido"}`,
          )
        }
      }
    }

    console.log(`📊 Resultado final: ${uploadedUrls.length} archivos subidos, ${errors.length} errores`)

    // Si hay errores pero también uploads exitosos, devolver éxito parcial
    if (uploadedUrls.length > 0) {
      return NextResponse.json({
        success: true,
        uploadedUrls,
        errors: errors.length > 0 ? errors : undefined,
        message:
          errors.length > 0
            ? `${uploadedUrls.length} de ${files.length} fotos subidas correctamente. ${errors.length} errores.`
            : `${uploadedUrls.length} fotos subidas correctamente`,
      })
    } else {
      // Si no se subió nada, devolver error
      return NextResponse.json(
        {
          success: false,
          uploadedUrls: [],
          errors,
          message: "No se pudo subir ninguna foto",
        },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error("💥 Error general en upload-photos:", error)

    // Manejar específicamente errores de payload
    if (
      error instanceof Error &&
      (error.message.includes("413") || error.message.includes("Payload") || error.message.includes("too large"))
    ) {
      return NextResponse.json(
        {
          error: "Archivos muy grandes. Intenta con menos fotos o comprime las imágenes.",
          details: "Error 413: Payload demasiado grande",
          suggestion: "Sube las fotos de a una o reduce su tamaño",
        },
        { status: 413 },
      )
    }

    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
