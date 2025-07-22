import { type NextRequest, NextResponse } from "next/server"
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
    const reviewId = searchParams.get("id")

    if (!reviewId) {
      return NextResponse.json({ error: "ID de reseña requerido" }, { status: 400 })
    }

    // Verificar que la reseña pertenece al usuario
    const { data: review, error: fetchError } = await supabase
      .from("detailed_reviews")
      .select("id, user_id, photo_urls, photo_1_url, photo_2_url, photo_3_url, photo_4_url, photo_5_url, photo_6_url")
      .eq("id", reviewId)
      .single()

    if (fetchError || !review) {
      return NextResponse.json({ error: "Reseña no encontrada" }, { status: 404 })
    }

    if (review.user_id !== user.id) {
      return NextResponse.json({ error: "No tienes permisos para eliminar esta reseña" }, { status: 403 })
    }

    // Recopilar todas las URLs de fotos para eliminar
    const photoUrls = []
    if (review.photo_urls && Array.isArray(review.photo_urls)) {
      photoUrls.push(...review.photo_urls)
    }

    // También verificar campos individuales de fotos
    for (let i = 1; i <= 6; i++) {
      const photoUrl = review[`photo_${i}_url` as keyof typeof review]
      if (photoUrl && typeof photoUrl === "string") {
        photoUrls.push(photoUrl)
      }
    }

    // Eliminar fotos del storage si existen
    if (photoUrls.length > 0) {
      const { del } = await import("@vercel/blob")

      for (const url of photoUrls) {
        try {
          await del(url)
        } catch (error) {
          console.error("Error eliminando foto:", error)
          // Continuar aunque falle la eliminación de una foto
        }
      }
    }

    // Eliminar la reseña de la base de datos
    const { error: deleteError } = await supabase.from("detailed_reviews").delete().eq("id", reviewId)

    if (deleteError) {
      throw deleteError
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error eliminando reseña:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
