import { type NextRequest, NextResponse } from "next/server"
import { del } from "@vercel/blob"
import { createClient } from "@/lib/supabase/server"

export async function DELETE(request: NextRequest) {
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

    const { photoUrl } = await request.json()

    if (!photoUrl) {
      return NextResponse.json({ error: "URL de foto requerida" }, { status: 400 })
    }

    // Extraer el pathname de la URL para usar con del()
    const url = new URL(photoUrl)
    const pathname = url.pathname.substring(1) // Remover el '/' inicial

    await del(pathname)
    console.log(`Foto eliminada: ${photoUrl}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error eliminando foto:", error)
    return NextResponse.json({ error: "Error al eliminar foto" }, { status: 500 })
  }
}
