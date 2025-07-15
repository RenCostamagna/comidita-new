export interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  points?: number
  created_at: string
  updated_at: string
}

export interface Place {
  id: string
  google_place_id: string
  name: string
  address: string
  latitude: number
  longitude: number
  phone?: string
  website?: string
  rating: number
  total_reviews: number
  category?: string
  average_price_range?: string
  created_at: string
  updated_at: string
}

export interface Review {
  id: string
  user_id: string
  place_id: string
  rating: number
  comment?: string
  created_at: string
  updated_at: string
  user?: User
  place?: Place
}

export interface DetailedReview {
  id: string
  user_id: string
  place_id: string
  dish_name?: string

  // Puntuaciones del 1 al 5
  food_taste: number
  presentation: number
  portion_size: number
  drinks_variety: number
  veggie_options: number
  gluten_free_options: number
  vegan_options: number
  music_acoustics: number
  ambiance: number
  furniture_comfort: number
  cleanliness: number
  service: number

  price_range: string
  restaurant_category: string
  comment?: string

  // URLs de fotos
  photo_1_url?: string
  photo_2_url?: string

  created_at: string
  updated_at: string
  user?: User
  place?: Place
}

export interface GooglePlace {
  place_id: string
  name: string
  formatted_address: string
  geometry: {
    location: {
      lat: number
      lng: number
    }
  }
  formatted_phone_number?: string
  website?: string
  rating?: number
  user_ratings_total?: number
}

export interface UserLevel {
  level_name: string
  level_color: string
  level_icon: string
  min_points: number
  max_points: number | null
  progress_percentage: number
}

export const PRICE_RANGES = {
  under_10000: "Menos de 10.000",
  "10000_15000": "10.000 - 15.000",
  "15000_20000": "15.000 - 20.000",
  "20000_30000": "20.000 - 30.000",
  "30000_50000": "30.000 - 50.000",
  "50000_80000": "50.000 - 80.000",
  over_80000: "Más de 80.000",
}

export const RESTAURANT_CATEGORIES = {
  PARRILLAS: "Parrillas",
  CAFE_Y_DELI: "Café y Deli",
  BODEGONES: "Bodegones",
  RESTAURANTES: "Restaurantes",
  HAMBURGUESERIAS: "Hamburgueserías",
  PIZZERIAS: "Pizzerías",
  PASTAS: "Pastas",
  CARRITOS: "Carritos",
  BARES: "Bares",
}
