import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q")

  if (!query) {
    return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=-32.9442426,-60.6505388&radius=50000&type=restaurant&key=${process.env.GOOGLE_MAPS_API_KEY}`,
    )

    if (!response.ok) {
      throw new Error("Failed to fetch from Google Places API")
    }

    const data = await response.json()

    // Filtrar solo lugares en Rosario
    const rosarioResults =
      data.results?.filter(
        (place: any) =>
          place.formatted_address?.toLowerCase().includes("rosario") ||
          place.formatted_address?.toLowerCase().includes("santa fe"),
      ) || []

    return NextResponse.json({ results: rosarioResults })
  } catch (error) {
    console.error("Error searching places:", error)
    return NextResponse.json({ error: "Failed to search places" }, { status: 500 })
  }
}
