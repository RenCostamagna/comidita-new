"use client"

import { useState, useEffect, useRef } from "react"
import { Search, MapPin, Star } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { searchPlaces, type Place } from "@/lib/google-maps"
import { useDebounce } from "@/hooks/use-debounce"
import { createClient } from "@/lib/supabase/client"
import { cleanAddress } from "@/lib/address-utils"

interface PlaceSearchProps {
  onPlaceSelect: (place: Place) => void
  searchMode?: "api" | "local" | "header"
  placeholder?: string
}

interface LocalPlaceData {
  id: number
  name: string
  address: string
  rating: number
  total_reviews: number
  google_place_id: string
}

export function PlaceSearch({
  onPlaceSelect,
  searchMode = "api",
  placeholder = "Buscar lugares...",
}: PlaceSearchProps) {
  const [query, setQuery] = useState("")
  const [places, setPlaces] = useState<Place[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localPlaces, setLocalPlaces] = useState<LocalPlaceData[]>([])
  const debouncedQuery = useDebounce(query, 300)
  const searchRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      handleSearch(debouncedQuery)
    } else {
      setPlaces([])
      setLocalPlaces([])
      setIsOpen(false)
    }
  }, [debouncedQuery, searchMode])

  const searchLocalPlaces = async (searchQuery: string) => {
    try {
      const { data, error } = await supabase
        .from("places")
        .select("id, name, address, rating, total_reviews, google_place_id")
        .or(`name.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%`)
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

  const fetchLocalRatingsForGooglePlaces = async (googlePlaces: Place[]) => {
    try {
      const placeIds = googlePlaces.map((place) => place.place_id).filter(Boolean)

      if (placeIds.length === 0) return googlePlaces

      const { data, error } = await supabase
        .from("places")
        .select("google_place_id, rating, total_reviews, address")
        .in("google_place_id", placeIds)

      if (error) {
        console.error("Error fetching local ratings:", error)
        return googlePlaces
      }

      const localDataMap: Record<string, { rating: number; total_reviews: number; address: string }> = {}
      data?.forEach((place) => {
        if (place.google_place_id) {
          localDataMap[place.google_place_id] = {
            rating: place.rating || 0,
            total_reviews: place.total_reviews || 0,
            address: place.address || "",
          }
        }
      })

      return googlePlaces.map((place) => ({
        ...place,
        localRating: localDataMap[place.place_id]?.rating || 0,
        localTotalReviews: localDataMap[place.place_id]?.total_reviews || 0,
        localAddress: localDataMap[place.place_id]?.address || place.formatted_address,
      }))
    } catch (error) {
      console.error("Error fetching local ratings:", error)
      return googlePlaces
    }
  }

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      if (searchMode === "header") {
        // For header search, prioritize local places
        const localResults = await searchLocalPlaces(searchQuery)
        setLocalPlaces(localResults)

        // If no local results, search Google Maps
        if (localResults.length === 0) {
          const googleResults = await searchPlaces(searchQuery)
          const resultsWithLocalData = await fetchLocalRatingsForGooglePlaces(googleResults)
          setPlaces(resultsWithLocalData)
        } else {
          setPlaces([])
        }
      } else if (searchMode === "api") {
        const results = await searchPlaces(searchQuery)
        const resultsWithLocalData = await fetchLocalRatingsForGooglePlaces(results)
        setPlaces(resultsWithLocalData)
        setLocalPlaces([])
      } else {
        // Local database search
        const localResults = await searchLocalPlaces(searchQuery)
        setLocalPlaces(localResults)
        setPlaces([])
      }
      setIsOpen(true)
    } catch (error) {
      console.error("Search error:", error)
      setError("Error al buscar lugares")
      setPlaces([])
      setLocalPlaces([])
    } finally {
      setIsLoading(false)
    }
  }

  const handlePlaceSelect = (place: Place | LocalPlaceData) => {
    if ("google_place_id" in place && place.google_place_id) {
      // Local place data - usar el ID interno directamente
      const normalizedPlace = {
        place_id: place.id.toString(), // Usar el ID interno como string
        name: place.name,
        formatted_address: place.address,
        geometry: {
          location: { lat: 0, lng: 0 },
        },
        types: [],
        localRating: place.rating,
        localTotalReviews: place.total_reviews,
        google_place_id: place.google_place_id, // Mantener referencia al google_place_id
      }
      onPlaceSelect(normalizedPlace)
    } else {
      // Google place data
      onPlaceSelect(place as Place)
    }
    setQuery("")
    setIsOpen(false)
    setPlaces([])
    setLocalPlaces([])
  }

  const renderLocalPlaceRating = (place: LocalPlaceData) => {
    if (place.total_reviews > 0) {
      return (
        <div className="flex items-center gap-1 mt-1">
          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          <span className="text-xs text-muted-foreground">
            {place.rating.toFixed(1)} ({place.total_reviews} reseñas)
          </span>
        </div>
      )
    }

    return (
      <div className="flex items-center gap-1 mt-1">
        <Star className="h-3 w-3 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Sin reseñas</span>
      </div>
    )
  }

  const renderGooglePlaceRating = (place: any) => {
    // Si es modo header y no tiene reseñas locales, mostrar mensaje especial
    if (searchMode === "header" && place.localTotalReviews === 0) {
      return (
        <div className="flex items-center gap-1 mt-1">
          <Star className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-blue-600 font-medium">¡Sé el primero en reseñarlo!</span>
        </div>
      )
    }

    if (place.localTotalReviews > 0) {
      return (
        <div className="flex items-center gap-1 mt-1">
          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          <span className="text-xs text-muted-foreground">
            {place.localRating.toFixed(1)} ({place.localTotalReviews} reseñas)
          </span>
        </div>
      )
    }

    return (
      <div className="flex items-center gap-1 mt-1">
        <Star className="h-3 w-3 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Sin reseñas</span>
      </div>
    )
  }

  return (
    <div ref={searchRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (places.length > 0 || localPlaces.length > 0) setIsOpen(true)
          }}
          className="pl-10 pr-4"
        />
      </div>

      {isOpen && (
        <Card className="absolute top-full left-0 right-0 mt-1 max-h-96 overflow-y-auto z-50 shadow-lg rounded-[var(--radius-dropdown)]">
          {isLoading && <div className="p-4 text-center text-muted-foreground">Buscando lugares...</div>}

          {error && <div className="p-4 text-center text-red-500">{error}</div>}

          {!isLoading && !error && places.length === 0 && localPlaces.length === 0 && query.length >= 2 && (
            <div className="p-4 text-center text-muted-foreground">No se encontraron lugares</div>
          )}

          {/* Render local places first */}
          {localPlaces.map((place) => (
            <Button
              key={`local-${place.id}`}
              variant="ghost"
              className="w-full justify-start p-4 h-auto text-left hover:bg-muted/50"
              onClick={() => handlePlaceSelect(place)}
            >
              <div className="flex items-start gap-3 w-full">
                <MapPin className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{place.name}</div>
                  <div className="text-sm text-muted-foreground truncate">{cleanAddress(place.address)}</div>
                  {renderLocalPlaceRating(place)}
                </div>
              </div>
            </Button>
          ))}

          {/* Separator when we have both local and Google results */}
          {localPlaces.length > 0 && places.length > 0 && searchMode === "header" && (
            <div className="px-4 py-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 border-t"></div>
                <span className="text-xs text-muted-foreground">Otros lugares</span>
                <div className="flex-1 border-t"></div>
              </div>
            </div>
          )}

          {/* Render Google places */}
          {places.map((place) => (
            <Button
              key={place.place_id}
              variant="ghost"
              className="w-full justify-start p-4 h-auto text-left hover:bg-muted/50"
              onClick={() => handlePlaceSelect(place)}
            >
              <div className="flex items-start gap-3 w-full">
                <MapPin className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{place.name}</div>
                  <div className="text-sm text-muted-foreground truncate">
                    {cleanAddress((place as any).localAddress || place.formatted_address)}
                  </div>
                  {renderGooglePlaceRating(place)}
                </div>
              </div>
            </Button>
          ))}
        </Card>
      )}
    </div>
  )
}
