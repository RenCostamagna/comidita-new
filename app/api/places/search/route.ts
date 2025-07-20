import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("query")

    if (!query) {
      return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      console.error("Google Maps API key not found")
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    // Rosario, Santa Fe coordinates
    const rosarioLat = -32.9442426
    const rosarioLng = -60.6505388
    const radius = 25000 // 25km radius around Rosario

    const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json")
    url.searchParams.append("query", query)
    url.searchParams.append("location", `${rosarioLat},${rosarioLng}`)
    url.searchParams.append("radius", radius.toString())
    url.searchParams.append("region", "ar")
    url.searchParams.append("language", "es")
    url.searchParams.append("type", "establishment")
    url.searchParams.append("key", apiKey)

    console.log("Searching places with URL:", url.toString())

    const response = await fetch(url.toString())

    if (!response.ok) {
      console.error("Google Maps API error:", response.status, response.statusText)
      return NextResponse.json({ error: "Failed to fetch places" }, { status: response.status })
    }

    const data = await response.json()

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error("Google Maps API returned error:", data.status, data.error_message)
      return NextResponse.json({ error: data.error_message || "API request failed" }, { status: 500 })
    }

    const tiposComida = ["restaurant", "food", "meal_takeaway", "bakery", "cafe", "bar"]
    const soloLugaresParaComer = data.results.filter((lugar) =>
      lugar.types.some((tipo: string) => tiposComida.includes(tipo)),
    )

    // Filter results to ensure they are in Rosario/Santa Fe area
    const filteredResults = (soloLugaresParaComer || []).filter((place: any) => {
      const address = place.formatted_address?.toLowerCase() || ""
      return (
        address.includes("rosario") ||
        address.includes("santa fe") ||
        address.includes("sf") ||
        /\b20\d{2}\b/.test(address) // Rosario postal codes (2000-2099)
      )
    })

    console.log(
      `Found ${data.results?.length || 0} total results, ${soloLugaresParaComer?.length || 0} food places, ${filteredResults.length} in Rosario area`,
    )

    return NextResponse.json({
      results: filteredResults,
      status: data.status,
    })
  } catch (error) {
    console.error("Error in places search API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
