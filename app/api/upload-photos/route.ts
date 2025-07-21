import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { createClient } from "@/lib/supabase/server"
import { logDebug, logError } from "@/lib/debug-logger"

export async function POST(request: NextRequest) {
  try {
    logDebug("API:upload-photos", "POST request received", { headers: request.headers })

    // Verificar que tenemos el token de Blob
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      logError("API:upload-photos", "BLOB_READ_WRITE_TOKEN is not configured", null)
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
      logError("API:upload-photos", "Authentication failed", authError)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    logDebug("API:upload-photos", "User authenticated", { userId: user.id })

    // Obtener datos del formulario
    const formData = await request.formData()

    // Debug: mostrar todas las claves del FormData
    const formDataKeys = Array.from(formData.keys())
    logDebug("API:upload-photos", "FormData keys received", { keys: formDataKeys })

    const reviewId = formData.get("reviewId") as string
    logDebug("API:upload-photos", "Review ID received", { reviewId })

    if (!reviewId) {
      return NextResponse.json({ error: "ID de reseña requerido" }, { status: 400 })
    }

    // Obtener archivos - probar diferentes nombres de campo
    let files = formData.getAll("photos") as File[]
    if (files.length === 0) {
      files = formData.getAll("files") as File[]
    }

    logDebug("API:upload-photos", `Found ${files.length} files in FormData`)

    if (files.length === 0) {
      logError("API:upload-photos", "No files found in FormData", null)
      return NextResponse.json({ error: "No se encontraron archivos" }, { status: 400 })
    }

    const uploadedUrls: string[] = []
    const errors: string[] = []

    // Procesar cada archivo
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      logDebug("API:upload-photos", `Processing file ${i + 1}/${files.length}`, {
        name: file.name,
        size: file.size,
        type: file.type,
      })

      try {
        // Validar archivo
        if (!file.type.startsWith("image/")) {
          logError("API:upload-photos", `File ${file.name} is not an image`, { type: file.type })
          errors.push(`Archivo ${file.name}: No es una imagen`)
          continue
        }

        if (file.size > 10 * 1024 * 1024) {
          logError("API:upload-photos", `File ${file.name} is too large`, { size: file.size })
          errors.push(`Archivo ${file.name}: Muy grande (máximo 10MB)`)
          continue
        }

        // Generar nombre único
        const timestamp = Date.now()
        const randomSuffix = Math.random().toString(36).substring(2, 8)
        const fileExtension = file.name.split(".").pop()?.toLowerCase() || "jpg"
        const fileName = `review-photos/${user.id}_${reviewId}_${timestamp}_${randomSuffix}.${fileExtension}`

        logDebug("API:upload-photos", `Uploading file to Vercel Blob as: ${fileName}`)

        // Subir a Vercel Blob
        const blob = await put(fileName, file, {
          access: "public",
          addRandomSuffix: false,
        })

        uploadedUrls.push(blob.url)
        logDebug("API:upload-photos", `File uploaded successfully`, { url: blob.url })
      } catch (uploadError) {
        logError("API:upload-photos", `Error uploading file ${file.name}`, uploadError)
        errors.push(
          `Error subiendo ${file.name}: ${uploadError instanceof Error ? uploadError.message : "Error desconocido"}`,
        )
      }
    }

    logDebug("API:upload-photos", "Finished processing all files", {
      uploadedCount: uploadedUrls.length,
      errorCount: errors.length,
    })

    return NextResponse.json({
      success: uploadedUrls.length > 0,
      uploadedUrls,
      errors: errors.length > 0 ? errors : undefined,
      message: `${uploadedUrls.length} de ${files.length} fotos subidas correctamente`,
    })
  } catch (error) {
    logError("API:upload-photos", "A general error occurred in the API route", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
