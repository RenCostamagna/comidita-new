import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    console.log("Iniciando upload de fotos...")

    // Verificar que tenemos el token de Blob
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("BLOB_READ_WRITE_TOKEN no está configurado")
      return NextResponse.json({ error: "Token de Vercel Blob no configurado" }, { status: 500 })
    }

    const supabase = createClient()

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

    const formData = await request.formData()
    const files = formData.getAll("files") as File[]
    const userId = formData.get("userId") as string
    const reviewId = formData.get("reviewId") as string

    console.log("Datos recibidos:", { filesCount: files.length, userId, reviewId })

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No se encontraron archivos" }, { status: 400 })
    }

    if (!reviewId) {
      return NextResponse.json({ error: "ID de reseña requerido" }, { status: 400 })
    }

    const uploadedUrls: string[] = []
    const errors: string[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      console.log(`Procesando archivo ${i + 1}:`, { name: file.name, size: file.size, type: file.type })

      try {
        // Validar archivo
        if (!file.type.startsWith("image/")) {
          errors.push(`Archivo ${file.name} no es una imagen`)
          continue
        }

        // Verificar tamaño (máximo 10MB)
        if (file.size > 10 * 1024 * 1024) {
          errors.push(`Archivo ${file.name} es muy grande (máximo 10MB)`)
          continue
        }

        // Generar nombre único
        const timestamp = Date.now()
        const randomString = Math.random().toString(36).substring(2, 15)
        const fileExtension = file.name.split(".").pop()?.toLowerCase() || "jpg"
        const fileName = `review-photos/${user.id}_${reviewId}_${i + 1}_${timestamp}_${randomString}.${fileExtension}`

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

    console.log(`Resultado: ${uploadedUrls.length} archivos subidos, ${errors.length} errores`)

    return NextResponse.json({
      success: uploadedUrls.length > 0,
      urls: uploadedUrls,
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
