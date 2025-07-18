export interface Place {
  place_id: string
  name: string
  formatted_address: string
  geometry: {
    location: {
      lat: number
      lng: number
    }
  }
  rating?: number
  user_ratings_total?: number
  price_level?: number
  photos?: Array<{
    photo_reference: string
    height: number
    width: number
  }>
  types: string[]
}

export interface PlaceDetails extends Place {
  formatted_phone_number?: string
  website?: string
  opening_hours?: {
    open_now: boolean
    weekday_text: string[]
  }
}

export async function searchPlaces(query: string): Promise<Place[]> {
  try {
    console.log("Searching for places:", query)

    const response = await fetch(`/api/places/search?query=${encodeURIComponent(query)}`)

    if (!response.ok) {
      const errorData = await response.json()
      console.error("API error:", errorData)
      throw new Error(errorData.error || "Error al buscar lugares")
    }

    const data = await response.json()
    console.log("Search results:", data.results?.length || 0, "places found")

    return data.results || []
  } catch (error) {
    console.error("Error searching places:", error)
    throw new Error("Error al buscar lugares")
  }
}

export async function getPlaceDetails(placeId: string): Promise<PlaceDetails> {
  try {
    console.log("Fetching place details for:", placeId)

    const response = await fetch(`/api/places/details?place_id=${encodeURIComponent(placeId)}`)

    if (!response.ok) {
      const errorData = await response.json()
      console.error("API error:", errorData)
      throw new Error(errorData.error || "Error al obtener detalles del lugar")
    }

    const data = await response.json()
    console.log("Place details fetched for:", data.result?.name)

    return data.result
  } catch (error) {
    console.error("Error fetching place details:", error)
    throw new Error("Error al obtener detalles del lugar")
  }
}

export function getPhotoUrl(photoReference: string, maxWidth = 400): string {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!apiKey || !photoReference) {
    return "/placeholder.svg?height=200&width=300"
  }

  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${apiKey}`
}
