import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { comment, dishName, placeName, category } = await request.json()

    if (!comment || comment.trim().length === 0) {
      return NextResponse.json({ error: "El comentario no puede estar vacío" }, { status: 400 })
    }

    // Crear el prompt para mejorar la reseña
    const prompt = `Eres un experto en reseñas gastronómicas. Tu tarea es mejorar y embellecer la siguiente reseña de restaurante, manteniendo la esencia y opinión original del usuario, pero haciéndola más descriptiva, atractiva y útil para otros comensales.

Información del contexto:
- Restaurante: ${placeName || "No especificado"}
- Categoría: ${category || "No especificada"}
- Plato mencionado: ${dishName || "No especificado"}

Reseña original:
"${comment.trim()}"

Instrucciones:
1. Mantén la opinión y sentimiento original del usuario
2. Hazla más descriptiva y atractiva
3. Usa un lenguaje natural y cercano, típico de Argentina
4. Mantén un tono auténtico, no exagerado
5. Si es muy corta, expándela con detalles relevantes
6. Si es muy larga, mantenla pero mejora la estructura
7. Máximo 300 palabras
8. No inventes información que no esté implícita en el comentario original

Responde SOLO con la reseña mejorada, sin comillas ni explicaciones adicionales.`

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt,
      maxTokens: 400,
      temperature: 0.7,
    })

    return NextResponse.json({
      enhancedComment: text.trim(),
      success: true,
    })
  } catch (error) {
    console.error("Error enhancing review:", error)
    return NextResponse.json({ error: "Error al mejorar la reseña" }, { status: 500 })
  }
}
