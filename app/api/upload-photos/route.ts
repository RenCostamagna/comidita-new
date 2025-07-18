import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { createClient } from "@/lib/supabase/server"
import { compressImageAdvanced, validateImageFile } from "@/lib/image-compression"

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Verificar que tenemos el token de Blob
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("BLOB_READ_WRITE_TOKEN no está configurado")
      return NextResponse.json({ error: "Configuración de almacenamiento no disponible" }, { status: 500 })
    }

    const formData = await request.formData()
    const files = formData.getAll("photos") as File[]
    const reviewId = formData.get("reviewId") as string

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No se encontraron archivos" }, { status: 400 })
    }

    if (!reviewId) {
      return NextResponse.json({ error: "ID de reseña requerido" }, { status: 400 })
    }

    console.log(`Procesando ${files.length} fotos para usuario ${user.id}, reseña ${reviewId}`)

    const uploadedUrls: string[] = []
    const errors: string[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      try {
        console.log(`Procesando foto ${i + 1}: ${file.name}, tamaño: ${file.size} bytes`)

        // Validar archivo
        const validation = validateImageFile(file)
        if (!validation.isValid) {
          errors.push(`Foto ${i + 1}: ${validation.error}`)
          continue
        }

        // Comprimir imagen
        const compressedFile = await compressImageAdvanced(file, {
          maxWidth: 800,
          maxHeight: 600,
          quality: 0.85,
          maxSizeKB: 400,
          outputFormat: "jpeg",
        })

        console.log(`Foto ${i + 1} comprimida: ${file.size} -> ${compressedFile.size} bytes`)

        // Generar nombre único
        const timestamp = Date.now()
        const fileName = `review-photos/${user.id}_${reviewId}_${i + 1}_${timestamp}.jpg`

        // Subir a Vercel Blob
        const blob = await put(fileName, compressedFile, {
          access: "public",
          addRandomSuffix: false,
        })

        uploadedUrls.push(blob.url)
        console.log(`Foto ${i + 1} subida exitosamente: ${blob.url}`)
      } catch (error) {
        console.error(`Error procesando foto ${i + 1}:`, error)
        errors.push(`Foto ${i + 1}: Error al procesar`)
      }
    }

    return NextResponse.json({
      success: true,
      uploadedUrls,
      errors: errors.length > 0 ? errors : undefined,
      message: `${uploadedUrls.length} de ${files.length} fotos subidas exitosamente`,
    })
  } catch (error) {
    console.error("Error en upload de fotos:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
