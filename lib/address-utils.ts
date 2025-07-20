/**
 * Utility functions for cleaning and formatting addresses
 */

/**
 * Cleans an address by removing postal codes and fixing spacing issues
 * @param address - The raw address string to clean
 * @returns The cleaned address string
 */
export function cleanAddress(address: string): string {
  if (!address || typeof address !== "string") {
    return ""
  }

  return (
    address
      // Remove postal codes with proper spacing handling
      .replace(/,?\s*[A-Z]?\d{4}\s*/g, ", ") // Replace postal codes with comma and space
      .replace(/(\d+)([A-Za-z])/g, "$1 $2") // Add space between numbers and letters (like "15Rosario" -> "15 Rosario")
      .replace(/,\s*,/g, ",") // Remove double commas
      .replace(/,\s*$/, "") // Remove trailing comma
      .replace(/^\s*,\s*/, "") // Remove leading comma
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .trim()
  )
}

/**
 * Formats a place object with cleaned address
 * @param place - The place object to format
 * @returns The place object with cleaned address
 */
export function formatPlaceForStorage(place: any) {
  const cleanedAddress = cleanAddress(place.formatted_address || place.address || "")

  return {
    ...place,
    address: cleanedAddress,
    formatted_address: cleanedAddress,
  }
}
