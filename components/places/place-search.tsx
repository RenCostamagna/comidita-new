"use client"

import { useState, useEffect } from "react"
import { Search, MapPin, Star } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { searchPlaces } from "@/lib/google-maps"
import { useDebounce } from "@/hooks/use-debounce"
import { createClient } from "@/lib/supabase/client"

interface PlaceSearchProps {
  onPlaceSelect: (place: any) => void
  searchMode?: "local" | "api" // Nuevo prop
}

const supabase = createClient()

// Función para buscar en la base de datos local
const searchLocalPlaces = async (query: string) => {
  if (!query.trim()) return []

  try {
    const { data, error } = await supabase
      .from("places")
      .select("*")
      .or(`name.ilike.%${query}%,address.ilike.%${query}%`)
      .order("rating", { ascending: false })
      .limit(10)

    if (error) {
      console.error("Error searching local places:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error searching local places:", error)
    return []
  }
}

// Función para obtener datos locales de un lugar por google_place_id
const getLocalPlaceData = async (googlePlaceId: string) => {
  try {
    const { data, error } = await supabase
      .from("places")
      .select("rating, total_reviews")
      .eq("google_place_id", googlePlaceId)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching local place data:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error fetching local place data:", error)
    return null
  }
}

export function PlaceSearch({ onPlaceSelect, searchMode = "api" }: PlaceSearchProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)

  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    if (debouncedQuery.trim().length > 2) {
      handleSearch(debouncedQuery)
    } else {
      setResults([])
      setShowResults(false)
    }
  }, [debouncedQuery])

  const handleSearch = async (searchQuery: string) => {
    setIsLoading(true)
    try {
      let places
      if (searchMode === "local") {
        places = await searchLocalPlaces(searchQuery)
      } else {
        // Buscar en Google Maps API
        const googlePlaces = await searchPlaces(searchQuery)

        // Para cada lugar de Google, obtener datos locales si existen
        const placesWithLocalData = await Promise.all(
          googlePlaces.map(async (place) => {
            const localData = await getLocalPlaceData(place.place_id)
            return {
              ...place,
              localRating: localData?.rating || 0,
              localTotalReviews: localData?.total_reviews || 0,
              hasLocalReviews: localData && localData.total_reviews > 0,
            }
          }),
        )

        places = placesWithLocalData
      }
      setResults(places)
      setShowResults(true)
    } catch (error) {
      console.error("Error searching places:", error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const handlePlaceSelect = (place: any) => {
    let normalizedPlace

    if (searchMode === "local") {
      // Los datos ya vienen normalizados de la base de datos
      normalizedPlace = place
    } else {
      // Normalizar datos de la API de Google Maps
      normalizedPlace = {
        google_place_id: place.place_id || `temp_${Date.now()}`,
        name: place.name || "Lugar sin nombre",
        address: place.formatted_address || "Dirección no disponible",
        latitude: place.geometry?.location?.lat || -32.9442426,
        longitude: place.geometry?.location?.lng || -60.6505388,
        phone: place.formatted_phone_number || null,
        website: place.website || null,
        rating: place.localRating || 0, // Usar rating local en lugar del de Google
        user_ratings_total: place.localTotalReviews || 0, // Usar total local
      }
    }

    console.log("Lugar seleccionado:", normalizedPlace)

    onPlaceSelect(normalizedPlace)
    setQuery("")
    setResults([])
    setShowResults(false)
  }

  const renderRatingInfo = (place: any) => {
    if (searchMode === "local") {
      // Para búsqueda local, usar los datos directos
      if (place.rating && place.rating > 0) {
        return (
          <div className="flex items-center gap-1 mt-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs text-muted-foreground">
              {place.rating.toFixed(1)} ({place.total_reviews || 0} reseñas)
            </span>
          </div>
        )
      } else {
        return (
          <div className="flex items-center gap-1 mt-1">
            <Star className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Sin reseñas</span>
          </div>
        )
      }
    } else {
      // Para búsqueda en Google Maps API, usar datos locales
      if (place.hasLocalReviews) {
        return (
          <div className="flex items-center gap-1 mt-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs text-muted-foreground">
              {place.localRating.toFixed(1)} ({place.localTotalReviews} reseñas)
            </span>
          </div>
        )
      } else {
        return (
          <div className="flex items-center gap-1 mt-1">
            <Star className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Sin reseñas</span>
          </div>
        )
      }
    }
  }

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="text"
          placeholder="Buscar"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-4 h-10"
        />
      </div>

      {showResults && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-96 overflow-y-auto">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 text-center text-muted-foreground">Buscando lugares...</div>
            ) : results.length > 0 ? (
              <div className="divide-y">
                {results.map((place) => (
                  <Button
                    key={searchMode === "local" ? place.id : place.place_id || `temp_${Math.random()}`}
                    variant="ghost"
                    className="w-full justify-start p-4 h-auto"
                    onClick={() => handlePlaceSelect(place)}
                  >
                    <div className="flex items-start gap-3 text-left">
                      <MapPin className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{place.name || "Lugar sin nombre"}</div>
                        <div className="text-sm text-muted-foreground truncate">
                          {searchMode === "local"
                            ? place.address
                            : place.formatted_address || "Dirección no disponible"}
                        </div>
                        {renderRatingInfo(place)}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground">No se encontraron lugares</div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
