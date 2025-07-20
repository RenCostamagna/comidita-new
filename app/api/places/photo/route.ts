import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const photoReference = searchParams.get("photo_reference")
    const maxWidth = searchParams.get("maxwidth") || "400"

    if (!photoReference) {
      return NextResponse.json({ error: "Photo reference is required" }, { status: 400 })
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      console.error("Google Maps API key not found")
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    // Generate the Google Maps photo URL on the server side
    const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${apiKey}`

    // Redirect to the actual photo URL
    return NextResponse.redirect(photoUrl)
  } catch (error) {
    console.error("Error in photo API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
