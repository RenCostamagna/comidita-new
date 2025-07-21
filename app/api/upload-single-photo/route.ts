import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    console.log("=== INICIO UPLOAD SINGLE PHOTO API ===")

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
    const file = formData.get("photo") as File
    const tempReviewId = formData.get("tempReviewId") as string

    if (!file) {
      return NextResponse.json({ error: "No se encontró archivo" }, { status: 400 })
    }

    if (!tempReviewId) {
      return NextResponse.json({ error: "ID temporal requerido" }, { status: 400 })
    }

    console.log("Procesando archivo:", {
      name: file.name,
      size: file.size,
      type: file.type,
    })

    // Validar archivo
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "El archivo no es una imagen" }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Archivo muy grande (máximo 10MB)" }, { status: 400 })
    }

    // Generar nombre único
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 8)
    const fileExtension = file.name.split(".").pop()?.toLowerCase() || "jpg"
    const fileName = `review-photos/${user.id}_${tempReviewId}_${timestamp}_${randomSuffix}.${fileExtension}`

    console.log(`Subiendo archivo como: ${fileName}`)

    // Subir a Vercel Blob
    const blob = await put(fileName, file, {
      access: "public",
      addRandomSuffix: false,
    })

    console.log(`Archivo subido exitosamente: ${blob.url}`)

    return NextResponse.json({
      success: true,
      url: blob.url,
      fileName: fileName,
      originalName: file.name,
      size: file.size,
    })
  } catch (error) {
    console.error("Error en upload-single-photo:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
