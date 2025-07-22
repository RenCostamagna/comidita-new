import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

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

    // Obtener el ID de la reseña desde los parámetros de la URL
    const { searchParams } = new URL(request.url)
    const reviewId = searchParams.get("id")

    if (!reviewId) {
      return NextResponse.json({ error: "ID de reseña requerido" }, { status: 400 })
    }

    // Verificar que la reseña pertenece al usuario
    const { data: review, error: reviewError } = await supabase
      .from("detailed_reviews")
      .select("id, user_id, photo_urls")
      .eq("id", reviewId)
      .eq("user_id", user.id)
      .single()

    if (reviewError || !review) {
      return NextResponse.json({ error: "Reseña no encontrada" }, { status: 404 })
    }

    // Eliminar fotos asociadas si existen
    if (review.photo_urls && review.photo_urls.length > 0) {
      try {
        // Aquí podrías eliminar las fotos del storage si es necesario
        // Por ahora solo eliminamos la referencia en la base de datos
        console.log("Fotos a eliminar:", review.photo_urls)
      } catch (photoError) {
        console.error("Error eliminando fotos:", photoError)
        // Continuar con la eliminación de la reseña aunque falle la eliminación de fotos
      }
    }

    // Eliminar la reseña
    const { error: deleteError } = await supabase
      .from("detailed_reviews")
      .delete()
      .eq("id", reviewId)
      .eq("user_id", user.id)

    if (deleteError) {
      console.error("Error eliminando reseña:", deleteError)
      return NextResponse.json({ error: "Error eliminando reseña" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error en DELETE /api/reviews/delete:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
