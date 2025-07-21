import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { createClient } from "@/lib/supabase/server"
import { compressImage } from "@/lib/image-compression"

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
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó archivo" }, { status: 400 })
    }

    // Validar tipo de archivo
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "El archivo debe ser una imagen" }, { status: 400 })
    }

    // Validar tamaño (máximo 10MB antes de compresión)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "La imagen es demasiado grande (máximo 10MB)" }, { status: 400 })
    }

    console.log(`📸 Procesando imagen: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`)

    // Comprimir imagen
    const compressedFile = await compressImage(file)
    console.log(
      `🗜️ Imagen comprimida: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB (${((1 - compressedFile.size / file.size) * 100).toFixed(1)}% reducción)`,
    )

    // Generar nombre único
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const extension = file.name.split(".").pop() || "jpg"
    const fileName = `review-photos/${user.id}/${timestamp}-${randomString}.${extension}`

    // Subir a Vercel Blob
    const blob = await put(fileName, compressedFile, {
      access: "public",
      contentType: compressedFile.type,
    })

    console.log(`✅ Imagen subida exitosamente: ${blob.url}`)

    return NextResponse.json({
      success: true,
      url: blob.url,
      originalSize: file.size,
      compressedSize: compressedFile.size,
      compressionRatio: ((1 - compressedFile.size / file.size) * 100).toFixed(1),
    })
  } catch (error) {
    console.error("❌ Error subiendo imagen:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
