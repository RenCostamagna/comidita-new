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
