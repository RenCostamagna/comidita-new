import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { createClient } from "@/lib/supabase/server"

// Helper to log messages on the server
function logOnServer(level: "info" | "error", message: string, data?: any) {
  const timestamp = new Date().toISOString()
  const logMessage = `[API:upload-photos] ${timestamp} - ${message}`
  if (level === "error") {
    console.error(logMessage, data ? JSON.stringify(data, null, 2) : "")
  } else {
    console.log(logMessage, data ? JSON.stringify(data, null, 2) : "")
  }
}

export async function POST(request: NextRequest) {
  try {
    logOnServer("info", "POST request received.", {
      headers: {
        "content-type": request.headers.get("content-type"),
        "content-length": request.headers.get("content-length"),
        "user-agent": request.headers.get("user-agent"),
      },
    })

    // Verificar que tenemos el token de Blob
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      logOnServer("error", "BLOB_READ_WRITE_TOKEN is not configured.")
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
      logOnServer("error", "Authentication failed.", { authError })
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    logOnServer("info", "User authenticated.", { userId: user.id })

    // Obtener datos del formulario
    const formData = await request.formData()

    // Debug: mostrar todas las claves del FormData
    const formDataKeys = Array.from(formData.keys())
    logOnServer("info", "FormData keys received.", { keys: formDataKeys })

    const reviewId = formData.get("reviewId") as string
    logOnServer("info", "Review ID received.", { reviewId })

    if (!reviewId) {
      logOnServer("error", "Review ID is required but was not found.")
      return NextResponse.json({ error: "ID de reseña requerido" }, { status: 400 })
    }

    // Obtener archivos - probar diferentes nombres de campo
    let files = formData.getAll("photos") as File[]
    if (files.length === 0) {
      files = formData.getAll("files") as File[]
    }

    logOnServer("info", `Found ${files.length} files in FormData.`)

    if (files.length === 0) {
      logOnServer("error", "No files found in FormData with keys 'photos' or 'files'.")
      return NextResponse.json({ error: "No se encontraron archivos" }, { status: 400 })
    }

    const uploadedUrls: string[] = []
    const errors: string[] = []

    // Procesar cada archivo
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      logOnServer("info", `Processing file ${i + 1}/${files.length}`, {
        name: file.name,
        size: file.size,
        type: file.type,
      })

      try {
        // Validar archivo
        if (!file.type.startsWith("image/")) {
          logOnServer("error", `File ${file.name} is not an image.`, { type: file.type })
          errors.push(`Archivo ${file.name}: No es una imagen`)
          continue
        }

        if (file.size > 10 * 1024 * 1024) {
          logOnServer("error", `File ${file.name} is too large.`, { size: file.size })
          errors.push(`Archivo ${file.name}: Muy grande (máximo 10MB)`)
          continue
        }

        // Generar nombre único
        const timestamp = Date.now()
        const randomSuffix = Math.random().toString(36).substring(2, 8)
        const fileExtension = file.name.split(".").pop()?.toLowerCase() || "jpg"
        const fileName = `review-photos/${user.id}_${reviewId}_${timestamp}_${randomSuffix}.${fileExtension}`

        logOnServer("info", `Uploading file to Vercel Blob as: ${fileName}`)

        // Subir a Vercel Blob
        const blob = await put(fileName, file, {
          access: "public",
          addRandomSuffix: false,
        })

        uploadedUrls.push(blob.url)
        logOnServer("info", `File uploaded successfully.`, { url: blob.url })
      } catch (uploadError) {
        logOnServer("error", `Error uploading file ${file.name}`, { uploadError })
        errors.push(
          `Error subiendo ${file.name}: ${uploadError instanceof Error ? uploadError.message : "Error desconocido"}`,
        )
      }
    }

    logOnServer("info", "Finished processing all files.", {
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
    logOnServer("error", "A general error occurred in the API route.", { error })
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
