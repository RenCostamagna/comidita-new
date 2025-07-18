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
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener URL de la foto desde query params
    const { searchParams } = new URL(request.url)
    const photoUrl = searchParams.get("url")

    if (!photoUrl) {
      return NextResponse.json({ error: "URL de foto requerida" }, { status: 400 })
    }

    console.log("Eliminando foto:", photoUrl)

    try {
      // Eliminar de Vercel Blob
      await del(photoUrl)
      console.log("Foto eliminada de Blob exitosamente")

      // También eliminar de la base de datos si existe
      const { error: dbError } = await supabase
        .from("review_photos")
        .delete()
        .eq("photo_url", photoUrl)
        .eq("uploaded_by", user.id)

      if (dbError) {
        console.warn("Error eliminando de BD (no crítico):", dbError)
      }

      return NextResponse.json({
        success: true,
        message: "Foto eliminada exitosamente",
      })
    } catch (deleteError) {
      console.error("Error eliminando foto:", deleteError)
      return NextResponse.json(
        {
          error: "Error eliminando foto",
          details: deleteError instanceof Error ? deleteError.message : "Error desconocido",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error general en delete-photo:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
