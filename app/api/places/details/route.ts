import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const placeId = searchParams.get("place_id")

    if (!placeId) {
      return NextResponse.json({ error: "Place ID parameter is required" }, { status: 400 })
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      console.error("Google Maps API key not found")
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    const url = new URL("https://maps.googleapis.com/maps/api/place/details/json")
    url.searchParams.append("place_id", placeId)
    url.searchParams.append(
      "fields",
      "place_id,name,formatted_address,geometry,formatted_phone_number,website,opening_hours,rating,user_ratings_total,photos,types,price_level",
    )
    url.searchParams.append("language", "es")
    url.searchParams.append("key", apiKey)

    console.log("Fetching place details with URL:", url.toString())

    const response = await fetch(url.toString())

    if (!response.ok) {
      console.error("Google Maps API error:", response.status, response.statusText)
      return NextResponse.json({ error: "Failed to fetch place details" }, { status: response.status })
    }

    const data = await response.json()

    if (data.status !== "OK") {
      console.error("Google Maps API returned error:", data.status, data.error_message)
      return NextResponse.json({ error: data.error_message || "API request failed" }, { status: 500 })
    }

    console.log("Successfully fetched place details for:", data.result?.name)

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in place details API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
