import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    console.log("=== INICIO UPLOAD PHOTOS API ===")

    // Verificar autenticación
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("Error de autenticación:", authError)
      return NextResponse.json({ error: "No autorizado", details: "Usuario no autenticado" }, { status: 401 })
    }

    console.log("Usuario autenticado:", user.id)

    // Obtener datos del formulario
    const formData = await request.formData()
    const reviewId = formData.get("reviewId") as string

    if (!reviewId) {
      return NextResponse.json(
        { error: "ID de reseña requerido", details: "reviewId no proporcionado" },
        { status: 400 },
      )
    }

    console.log("Review ID:", reviewId)

    // Obtener archivos
    const files = formData.getAll("photos") as File[]
    console.log("Número de archivos recibidos:", files.length)

    if (files.length === 0) {
      return NextResponse.json(
        { error: "No se encontraron archivos", details: "No hay fotos para subir" },
        { status: 400 },
      )
    }

    const uploadedPhotos = []
    const errors = []

    // Subir cada archivo
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
          // 10MB
          errors.push(`Archivo ${file.name}: Muy grande (máximo 10MB)`)
          continue
        }

        // Generar nombre único
        const timestamp = Date.now()
        const randomSuffix = Math.random().toString(36).substring(2, 8)
        const fileExtension = file.name.split(".").pop() || "jpg"
        const fileName = `review-${reviewId}-${timestamp}-${randomSuffix}.${fileExtension}`

        console.log(`Subiendo a Blob: ${fileName}`)

        // Subir a Vercel Blob
        const blob = await put(fileName, file, {
          access: "public",
          addRandomSuffix: false,
        })

        console.log("Blob subido exitosamente:", blob.url)

        // Guardar en base de datos
        const { data: photoData, error: dbError } = await supabase
          .from("review_photos")
          .insert({
            review_id: reviewId,
            photo_url: blob.url,
            file_name: fileName,
            file_size: file.size,
            uploaded_by: user.id,
          })
          .select()
          .single()

        if (dbError) {
          console.error("Error guardando en BD:", dbError)
          errors.push(`Error guardando ${file.name} en base de datos`)
          continue
        }

        console.log("Foto guardada en BD:", photoData)
        uploadedPhotos.push({
          id: photoData.id,
          url: blob.url,
          fileName: fileName,
        })
      } catch (fileError) {
        console.error(`Error procesando archivo ${file.name}:`, fileError)
        errors.push(
          `Error subiendo ${file.name}: ${fileError instanceof Error ? fileError.message : "Error desconocido"}`,
        )
      }
    }

    console.log("=== RESULTADO FINAL ===")
    console.log("Fotos subidas:", uploadedPhotos.length)
    console.log("Errores:", errors.length)

    // Respuesta
    if (uploadedPhotos.length === 0) {
      return NextResponse.json(
        {
          error: "No se pudieron subir las fotos",
          details: errors.join(", "),
          uploadedPhotos: [],
          errors,
        },
        { status: 400 },
      )
    }

    return NextResponse.json({
      success: true,
      uploadedPhotos,
      errors: errors.length > 0 ? errors : undefined,
      message: `${uploadedPhotos.length} foto(s) subida(s) exitosamente${errors.length > 0 ? ` (${errors.length} errores)` : ""}`,
    })
  } catch (error) {
    console.error("=== ERROR GENERAL EN UPLOAD PHOTOS ===", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
