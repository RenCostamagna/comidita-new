import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    console.log("=== INICIO UPLOAD PHOTOS API ===")

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("BLOB_READ_WRITE_TOKEN no está configurado")
      return NextResponse.json({ error: "Token de Vercel Blob no configurado" }, { status: 500 })
    }

    const supabase = await createClient()

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
    console.log("Claves en FormData:", Array.from(formData.keys()))

    const reviewId = formData.get("reviewId") as string
    console.log("Review ID recibido:", reviewId)

    if (!reviewId) {
      return NextResponse.json({ error: "ID de reseña requerido" }, { status: 400 })
    }

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

    const baseTimestamp = Date.now()

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      console.log(`Procesando archivo ${i + 1}/${files.length}:`, {
        name: file.name,
        size: file.size,
        type: file.type,
      })

      try {
        if (!file.type.startsWith("image/")) {
          errors.push(`Archivo ${file.name}: No es una imagen`)
          continue
        }

        const fileExtension = file.type.split("/")[1] || "jpg"
        const validExtensions = ["jpg", "jpeg", "png", "webp"]
        const finalExtension = validExtensions.includes(fileExtension) ? fileExtension : "jpg"

        const uniqueTimestamp = baseTimestamp + i
        const fileName = `review-photos/${user.id}/${reviewId}/${uniqueTimestamp}_${i}.${finalExtension}`

        console.log(`Subiendo archivo ${i + 1} como: ${fileName}`)

        const arrayBuffer = await file.arrayBuffer()
        const uint8Array = new Uint8Array(arrayBuffer)

        const blob = await put(fileName, uint8Array, {
          access: "public",
          addRandomSuffix: false,
          contentType: file.type || `image/${finalExtension}`,
        })

        uploadedUrls.push(blob.url)
        console.log(`✅ Archivo ${i + 1} subido exitosamente: ${blob.url}`)

        if (i < files.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 100))
        }
      } catch (uploadError) {
        console.error(`❌ Error subiendo archivo ${i + 1} (${file.name}):`, uploadError)
        const errorMessage = uploadError instanceof Error ? uploadError.message : "Error desconocido"
        errors.push(`Error subiendo ${file.name}: ${errorMessage}`)
      }
    }

    console.log(`🏁 Resultado final: ${uploadedUrls.length} archivos subidos, ${errors.length} errores`)

    return NextResponse.json({
      success: uploadedUrls.length > 0,
      uploadedUrls,
      errors: errors.length > 0 ? errors : undefined,
      message: `${uploadedUrls.length} de ${files.length} fotos subidas correctamente`,
    })
  } catch (error) {
    console.error("💥 Error general en upload-photos:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
