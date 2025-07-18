import { type NextRequest, NextResponse } from "next/server"
import { del } from "@vercel/blob"
import { createClient } from "@/lib/supabase/server"

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const photoUrl = searchParams.get("url")

    if (!photoUrl) {
      return NextResponse.json({ error: "URL de foto requerida" }, { status: 400 })
    }

    try {
      // Extraer el pathname de la URL para usar con del()
      const url = new URL(photoUrl)
      const pathname = url.pathname.substring(1) // Remover el '/' inicial

      await del(pathname)
      console.log(`Foto eliminada: ${photoUrl}`)

      return NextResponse.json({ success: true, message: "Foto eliminada correctamente" })
    } catch (deleteError) {
      console.error("Error eliminando foto:", deleteError)
      return NextResponse.json({ error: "Error eliminando la foto" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error general en delete-photo:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
