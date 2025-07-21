import { type NextRequest, NextResponse } from "next/server"

// This route is for receiving client-side logs and printing them to the server console,
// so they appear in the Vercel logs.
export async function POST(request: NextRequest) {
  try {
    const { level, module, message, data } = await request.json()
    const timestamp = new Date().toISOString()

    const logMessage = `[CLIENT-LOG] [${level.toUpperCase()}] ${timestamp} [${module}] - ${message}`

    if (level === "error") {
      console.error(logMessage, data ? JSON.stringify(data, null, 2) : "")
    } else {
      console.log(logMessage, data ? JSON.stringify(data, null, 2) : "")
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("[API:LOG] Error processing log request:", error)
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 })
  }
}
