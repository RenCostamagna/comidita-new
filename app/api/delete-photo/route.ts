import { type NextRequest, NextResponse } from "next/server"
import { del } from "@vercel/blob"
import { createClient } from "@/lib/supabase/server"

export async function DELETE(request: NextRequest) {
  try {
    console.log("=== INICIO DELETE PHOTO API ===")

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

    // Obtener datos de la solicitud
    const { photoId, photoUrl } = await request.json()

    if (!photoId || !photoUrl) {
      return NextResponse.json(
        { error: "Datos requeridos", details: "photoId y photoUrl son requeridos" },
        { status: 400 },
      )
    }

    console.log("Eliminando foto:", { photoId, photoUrl })

    // Verificar que el usuario puede eliminar esta foto
    const { data: photoData, error: fetchError } = await supabase
      .from("review_photos")
      .select("uploaded_by, file_name")
      .eq("id", photoId)
      .single()

    if (fetchError || !photoData) {
      console.error("Error obteniendo foto:", fetchError)
      return NextResponse.json(
        { error: "Foto no encontrada", details: "No se pudo encontrar la foto" },
        { status: 404 },
      )
    }

    if (photoData.uploaded_by !== user.id) {
      return NextResponse.json({ error: "No autorizado", details: "No puedes eliminar esta foto" }, { status: 403 })
    }

    // Eliminar de Vercel Blob
    try {
      await del(photoUrl)
      console.log("Foto eliminada de Blob:", photoUrl)
    } catch (blobError) {
      console.error("Error eliminando de Blob:", blobError)
      // Continuar aunque falle la eliminación del blob
    }

    // Eliminar de base de datos
    const { error: deleteError } = await supabase.from("review_photos").delete().eq("id", photoId)

    if (deleteError) {
      console.error("Error eliminando de BD:", deleteError)
      return NextResponse.json({ error: "Error eliminando foto", details: deleteError.message }, { status: 500 })
    }

    console.log("Foto eliminada exitosamente")
    return NextResponse.json({ success: true, message: "Foto eliminada exitosamente" })
  } catch (error) {
    console.error("=== ERROR GENERAL EN DELETE PHOTO ===", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
