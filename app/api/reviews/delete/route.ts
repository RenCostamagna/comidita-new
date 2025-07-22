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

    // Obtener ID de la reseña
    const url = new URL(request.url)
    const reviewId = url.searchParams.get("id")

    if (!reviewId) {
      return NextResponse.json({ error: "ID de reseña requerido" }, { status: 400 })
    }

    // Verificar que la reseña pertenece al usuario
    const { data: review, error: reviewError } = await supabase
      .from("detailed_reviews")
      .select("user_id, photo_1_url, photo_2_url, photo_3_url, photo_4_url, photo_5_url")
      .eq("id", reviewId)
      .single()

    if (reviewError || !review) {
      return NextResponse.json({ error: "Reseña no encontrada" }, { status: 404 })
    }

    if (review.user_id !== user.id) {
      return NextResponse.json({ error: "No tienes permisos para eliminar esta reseña" }, { status: 403 })
    }

    // Eliminar fotos asociadas del storage
    const photoUrls = [
      review.photo_1_url,
      review.photo_2_url,
      review.photo_3_url,
      review.photo_4_url,
      review.photo_5_url,
    ].filter(Boolean)

    for (const photoUrl of photoUrls) {
      if (photoUrl && photoUrl.includes("blob.vercel-storage.com")) {
        try {
          const fileName = photoUrl.split("/").pop()
          if (fileName) {
            await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/delete-photo`, {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ fileName }),
            })
          }
        } catch (error) {
          console.error("Error eliminando foto:", error)
        }
      }
    }

    // Eliminar la reseña
    const { error: deleteError } = await supabase.from("detailed_reviews").delete().eq("id", reviewId)

    if (deleteError) {
      return NextResponse.json({ error: "Error eliminando reseña" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error en DELETE /api/reviews/delete:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
