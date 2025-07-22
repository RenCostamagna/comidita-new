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
      .select("user_id, photo_urls")
      .eq("id", reviewId)
      .single()

    if (reviewError || !review) {
      return NextResponse.json({ error: "Reseña no encontrada" }, { status: 404 })
    }

    if (review.user_id !== user.id) {
      return NextResponse.json({ error: "No tienes permisos para eliminar esta reseña" }, { status: 403 })
    }

    // Eliminar las fotos asociadas si existen
    if (review.photo_urls && review.photo_urls.length > 0) {
      try {
        // Extraer los nombres de archivo de las URLs
        const photoNames = review.photo_urls.map((url: string) => {
          const parts = url.split("/")
          return parts[parts.length - 1]
        })

        // Eliminar las fotos del storage
        const { error: storageError } = await supabase.storage.from("review-photos").remove(photoNames)

        if (storageError) {
          console.error("Error eliminando fotos del storage:", storageError)
        }
      } catch (error) {
        console.error("Error procesando eliminación de fotos:", error)
      }
    }

    // Eliminar la reseña
    const { error: deleteError } = await supabase.from("detailed_reviews").delete().eq("id", reviewId)

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
