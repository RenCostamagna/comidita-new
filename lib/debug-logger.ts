// To enable debug mode, add `?debug=true` to the URL
const IS_DEBUG_MODE =
  process.env.NODE_ENV === "development" ||
  (typeof window !== "undefined" && window.location.search.includes("debug=true"))

function getDeviceInfo() {
  if (typeof window === "undefined") {
    return { environment: "server" }
  }
  return {
    environment: "client",
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    deviceMemory: (navigator as any).deviceMemory || "N/A",
    screen: {
      width: window.screen.width,
      height: window.screen.height,
      availWidth: window.screen.availWidth,
      availHeight: window.screen.availHeight,
      colorDepth: window.screen.colorDepth,
      pixelDepth: window.screen.pixelDepth,
    },
    window: {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
    },
    connection: (navigator as any).connection
      ? {
          downlink: (navigator as any).connection.downlink,
          effectiveType: (navigator as any).connection.effectiveType,
          rtt: (navigator as any).connection.rtt,
          saveData: (navigator as any).connection.saveData,
        }
      : "N/A",
  }
}

// Function to send logs to the server
function sendLogToServer(level: "debug" | "error", module: string, message: string, data?: any) {
  // Only run on the client
  if (typeof window === "undefined" || !IS_DEBUG_MODE) return

  // Self-debug: Confirm this function is being called
  console.log(`[Logger] Attempting to send log to server: ${message}`)

  const payload = {
    level,
    module,
    message,
    data: data || null,
    deviceInfo: getDeviceInfo(),
  }

  // Use sendBeacon if available for reliability, otherwise fallback to fetch
  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], { type: "application/json" })
      navigator.sendBeacon("/api/log", blob)
    } else {
      fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      })
    }
  } catch (e) {
    // Fallback to console if sending fails
    console.error("Failed to send log to server:", e)
  }
}

export function logDebug(module: string, message: string, data?: any) {
  if (!IS_DEBUG_MODE) return

  const timestamp = new Date().toISOString()
  // Log to browser console for immediate feedback during development
  console.log(`[DEBUG] ${timestamp} [${module}] - ${message}`, data !== undefined ? data : "")

  // Send log to server to appear in Vercel logs
  sendLogToServer("debug", module, message, data)
}

export function logError(module: string, message: string, error: any) {
  // Always log errors in development, but only in debug mode in production
  if (process.env.NODE_ENV === "production" && !IS_DEBUG_MODE) return

  const timestamp = new Date().toISOString()
  // Log to browser console
  console.error(`[ERROR] ${timestamp} [${module}] - ${message}`, error)

  // Send log to server
  sendLogToServer("error", module, message, error)
}

export function logDeviceInfo(module: string) {
  if (!IS_DEBUG_MODE) return
  const deviceInfo = getDeviceInfo()
  logDebug(module, "Device Information", deviceInfo)
}
