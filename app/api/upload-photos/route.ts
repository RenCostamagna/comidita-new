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

    // Generar timestamp base una sola vez para evitar conflictos
    const baseTimestamp = Date.now()

    // Procesar cada archivo SECUENCIALMENTE para evitar conflictos de nombres
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      console.log(`Procesando archivo ${i + 1}/${files.length}:`, {
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

        // Limpiar nombre de archivo para móviles - remover caracteres especiales
        let cleanFileName = file.name || `image_${i + 1}`
        cleanFileName = cleanFileName
          .replace(/[^a-zA-Z0-9.-]/g, "_") // Reemplazar caracteres especiales con _
          .replace(/_{2,}/g, "_") // Reemplazar múltiples _ con uno solo
          .toLowerCase()

        // Generar nombre único con índice para evitar duplicados
        const uniqueTimestamp = baseTimestamp + i // Incrementar timestamp por índice
        const randomSuffix = Math.random().toString(36).substring(2, 8)
        const fileExtension = cleanFileName.split(".").pop()?.toLowerCase() || "jpg"

        // Asegurar que la extensión sea válida
        const validExtensions = ["jpg", "jpeg", "png", "webp"]
        const finalExtension = validExtensions.includes(fileExtension) ? fileExtension : "jpg"

        // Incluir índice en el nombre para garantizar unicidad
        const fileName = `review-photos/${user.id}_${reviewId}_${uniqueTimestamp}_${i}_${randomSuffix}.${finalExtension}`

        console.log(`Subiendo archivo ${i + 1} como: ${fileName}`)

        // Convertir archivo a ArrayBuffer para mejor compatibilidad móvil
        const arrayBuffer = await file.arrayBuffer()
        const uint8Array = new Uint8Array(arrayBuffer)

        // Subir a Vercel Blob usando ArrayBuffer
        const blob = await put(fileName, uint8Array, {
          access: "public",
          addRandomSuffix: false, // No usar suffix automático ya que generamos nuestro propio nombre único
          contentType: file.type || `image/${finalExtension}`,
        })

        uploadedUrls.push(blob.url)
        console.log(`✅ Archivo ${i + 1} subido exitosamente: ${blob.url}`)

        // Pequeña pausa entre uploads para evitar problemas de concurrencia en móviles
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
