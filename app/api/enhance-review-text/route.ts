import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { 
      originalText, 
      placeName, 
      dishName, 
      ratings, 
      priceRange, 
      category,
      dietaryOptions 
    } = await request.json()

    // Construir contexto de la reseña
    const contextParts = []
    
    if (placeName) {
      contextParts.push(`Lugar: ${placeName}`)
    }
    
    if (dishName) {
      contextParts.push(`Plato recomendado: ${dishName}`)
    }
    
    if (category) {
      const categoryLabels = {
        'PARRILLAS': 'Parrilla',
        'CAFE_Y_DELI': 'Café y Deli',
        'BODEGONES': 'Bodegón',
        'RESTAURANTES': 'Restaurante',
        'HAMBURGUESERIAS': 'Hamburguesería',
        'PIZZERIAS': 'Pizzería',
        'PASTAS': 'Pastas',
        'CARRITOS': 'Carrito',
        'BARES': 'Bar',
        'HELADERIAS': 'Heladería'
      }
      contextParts.push(`Tipo: ${categoryLabels[category as keyof typeof categoryLabels] || category}`)
    }
    
    if (priceRange) {
      const priceLabels = {
        'under_10000': 'Menos de $10.000',
        '10000_15000': '$10.000 - $15.000',
        '15000_20000': '$15.000 - $20.000',
        '20000_30000': '$20.000 - $30.000',
        '30000_50000': '$30.000 - $50.000',
        '50000_80000': '$50.000 - $80.000',
        'over_80000': 'Más de $80.000'
      }
      contextParts.push(`Precio por persona: ${priceLabels[priceRange as keyof typeof priceLabels] || priceRange}`)
    }

    // Agregar información de puntuaciones destacadas
    if (ratings) {
      const ratingLabels = {
        food_taste: 'Sabor',
        presentation: 'Presentación',
        portion_size: 'Porción',
        music_acoustics: 'Música',
        ambiance: 'Ambiente',
        furniture_comfort: 'Comodidad',
        service: 'Servicio'
      }
      
      const highRatings = Object.entries(ratings)
        .filter(([_, value]) => value >= 8)
        .map(([key, value]) => `${ratingLabels[key as keyof typeof ratingLabels]}: ${value}/10`)
      
      if (highRatings.length > 0) {
        contextParts.push(`Puntuaciones altas: ${highRatings.join(', ')}`)
      }
    }

    // Agregar opciones dietéticas
    if (dietaryOptions) {
      const dietaryInfo = []
      if (dietaryOptions.celiac_friendly) dietaryInfo.push('apto celíacos')
      if (dietaryOptions.vegetarian_friendly) dietaryInfo.push('opciones vegetarianas')
      
      if (dietaryInfo.length > 0) {
        contextParts.push(`Opciones especiales: ${dietaryInfo.join(', ')}`)
      }
    }

    const context = contextParts.join(' | ')

    const prompt = `Eres un asistente que ayuda a mejorar reseñas de restaurantes en Argentina. 

CONTEXTO DE LA RESEÑA:
${context}

TEXTO ORIGINAL:
"${originalText}"

INSTRUCCIONES:
- Mejora el texto manteniendo el tono personal y auténtico
- Usa vocabulario argentino natural y coloquial
- Mantén la longitud similar (máximo 50% más largo)
- Incorpora sutilmente el contexto de la reseña si es relevante
- NO inventes información que no esté en el contexto
- Mantén la opinión original del usuario
- Haz que suene más fluido y descriptivo
- Si el texto está vacío, sugiere un comentario basado en el contexto

Responde SOLO con el texto mejorado, sin comillas ni explicaciones adicionales.`

    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt,
      maxTokens: 200,
    })

    return NextResponse.json({ 
      enhancedText: text.trim(),
      success: true 
    })

  } catch (error) {
    console.error('Error enhancing text:', error)
    return NextResponse.json(
      { error: 'Error al mejorar el texto', success: false },
      { status: 500 }
    )
  }
}
