export async function searchPlaces(query: string): Promise<any[]> {
  if (!query.trim()) return []

  try {
    const response = await fetch(`/api/places/search?q=${encodeURIComponent(query)}`)
    if (!response.ok) throw new Error("Error al buscar lugares")

    const data = await response.json()
    return data.results || []
  } catch (error) {
    console.error("Error searching places:", error)
    return []
  }
}

export async function getPlaceDetails(placeId: string): Promise<any | null> {
  try {
    const response = await fetch(`/api/places/details?place_id=${placeId}`)
    if (!response.ok) throw new Error("Error al obtener detalles del lugar")

    const data = await response.json()
    return data.result || null
  } catch (error) {
    console.error("Error getting place details:", error)
    return null
  }
}
