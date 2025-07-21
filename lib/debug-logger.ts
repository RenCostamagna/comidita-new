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

export function logDebug(module: string, message: string, data?: any) {
  if (!IS_DEBUG_MODE) return

  const timestamp = new Date().toISOString()
  console.log(`[DEBUG] ${timestamp} [${module}] - ${message}`, data !== undefined ? data : "")
}

export function logError(module: string, message: string, error: any) {
  // Always log errors in development, but only in debug mode in production
  if (process.env.NODE_ENV === "production" && !IS_DEBUG_MODE) return

  const timestamp = new Date().toISOString()
  console.error(`[ERROR] ${timestamp} [${module}] - ${message}`, error)
}

export function logDeviceInfo(module: string) {
  if (!IS_DEBUG_MODE) return
  logDebug(module, "Device Information", getDeviceInfo())
}
