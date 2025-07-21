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

    // Procesar cada archivo
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      console.log(`Procesando archivo ${i + 1}:`, {
        name: file.name,
        size: file.size,
        type: file.type,
      })

      try {
        // Validar archivo
        if (!file.type.startsWith("image/")) {
          errors.push(`Archivo ${file.name}: No es una imagen`)
          continue
        }

        if (file.size > 10 * 1024 * 1024) {
          errors.push(`Archivo ${file.name}: Muy grande (máximo 10MB)`)
          continue
        }

        // --- INICIO DEBUGGING ---
        console.log(`[DEBUG] Original file name: "${file.name}"`)
        console.log(`[DEBUG] File type: "${file.type}"`)
        // --- FIN DEBUGGING ---

        // Generar nombre único
        const timestamp = Date.now()
        const randomSuffix = Math.random().toString(36).substring(2, 8)
        const fileExtension = file.name.split(".").pop()?.toLowerCase() || "jpg"
        const fileName = `review-photos/${user.id}_${reviewId}_${timestamp}_${randomSuffix}.${fileExtension}`

        // --- INICIO DEBUGGING ---
        console.log(`[DEBUG] Final pathname for Blob: "${fileName}"`)
        // --- FIN DEBUGGING ---

        console.log(`Subiendo archivo como: ${fileName}`)

        // Subir a Vercel Blob
        const blob = await put(fileName, file, {
          access: "public",
          addRandomSuffix: false,
        })

        uploadedUrls.push(blob.url)
        console.log(`Archivo subido exitosamente: ${blob.url}`)
      } catch (uploadError) {
        console.error(`Error subiendo archivo ${file.name}:`, uploadError)
        errors.push(
          `Error subiendo ${file.name}: ${uploadError instanceof Error ? uploadError.message : "Error desconocido"}`,
        )
      }
    }

    console.log(`Resultado final: ${uploadedUrls.length} archivos subidos, ${errors.length} errores`)

    return NextResponse.json({
      success: uploadedUrls.length > 0,
      uploadedUrls,
      errors: errors.length > 0 ? errors : undefined,
      message: `${uploadedUrls.length} de ${files.length} fotos subidas correctamente`,
    })
  } catch (error) {
    console.error("Error general en upload-photos:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
