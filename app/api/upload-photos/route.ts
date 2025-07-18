import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const formData = await request.formData()
    const files = formData.getAll("files") as File[]
    const userId = formData.get("userId") as string
    const reviewId = formData.get("reviewId") as string

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No se encontraron archivos" }, { status: 400 })
    }

    const uploadedUrls: string[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      // Validar archivo
      if (!file.type.startsWith("image/")) {
        continue
      }

      // Generar nombre único
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(2, 15)
      const fileExtension = file.name.split(".").pop() || "jpg"
      const fileName = `reviews/${userId}/${reviewId}/${timestamp}_${randomString}.${fileExtension}`

      try {
        // Subir a Vercel Blob
        const blob = await put(fileName, file, {
          access: "public",
          handleUploadUrl: "/api/upload-photos",
        })

        uploadedUrls.push(blob.url)
        console.log(`Foto subida: ${blob.url}`)
      } catch (uploadError) {
        console.error(`Error subiendo archivo ${file.name}:`, uploadError)
        // Continuar con los otros archivos
      }
    }

    return NextResponse.json({
      success: true,
      urls: uploadedUrls,
      message: `${uploadedUrls.length} fotos subidas correctamente`,
    })
  } catch (error) {
    console.error("Error en upload-photos:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
