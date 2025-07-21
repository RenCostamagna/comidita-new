// Función para obtener el color según la puntuación (mantener solo los colores)
export const getRatingColor = (rating: number): string => {
  if (rating <= 3) return "text-red-500"
  if (rating <= 5) return "text-orange-500"
  if (rating <= 7) return "text-yellow-500"
  if (rating <= 8) return "text-blue-500"
  return "text-green-500"
}

// Función para obtener el color de fondo según la puntuación
export const getRatingBgColor = (rating: number): string => {
  if (rating <= 3) return "bg-red-100 dark:bg-red-900/20"
  if (rating <= 5) return "bg-orange-100 dark:bg-orange-900/20"
  if (rating <= 7) return "bg-yellow-100 dark:bg-yellow-900/20"
  if (rating <= 8) return "bg-blue-100 dark:bg-blue-900/20"
  return "bg-green-100 dark:bg-green-900/20"
}

// Función para obtener el color del slider según la puntuación
export const getRatingSliderColor = (rating: number): string => {
  if (rating <= 3) return "bg-red-500"
  if (rating <= 5) return "bg-orange-500"
  if (rating <= 7) return "bg-yellow-500"
  if (rating <= 8) return "bg-blue-500"
  return "bg-green-500"
}

// Función para obtener etiquetas de rating (RESTAURADA)
export const getRatingLabel = (rating: number): string => {
  if (rating <= 2) return "Muy malo"
  if (rating <= 4) return "Malo"
  if (rating <= 6) return "Regular"
  if (rating <= 8) return "Bueno"
  if (rating <= 9) return "Muy bueno"
  return "Excelente"
}

// Array de todas las clases de colores para asegurar que Tailwind las incluya
export const ALL_RATING_COLORS = [
  // Text colors
  "text-red-500",
  "text-orange-500",
  "text-yellow-500",
  "text-blue-500",
  "text-green-500",
  // Background colors
  "bg-red-100",
  "bg-orange-100",
  "bg-yellow-100",
  "bg-blue-100",
  "bg-green-100",
  // Dark background colors
  "dark:bg-red-900/20",
  "dark:bg-orange-900/20",
  "dark:bg-yellow-900/20",
  "dark:bg-blue-900/20",
  "dark:bg-green-900/20",
  // Slider colors
  "bg-red-500",
  "bg-orange-500",
  "bg-yellow-500",
  "bg-blue-500",
  "bg-green-500",
] as const
