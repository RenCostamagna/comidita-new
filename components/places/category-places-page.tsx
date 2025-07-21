"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Star, SlidersHorizontal, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { PlaceCard } from "@/components/places/place-card"
import { Header } from "@/components/layout/header"
import { LayoutBase } from "@/components/layout/layout-base"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { RESTAURANT_CATEGORIES } from "@/lib/types"
import { RatingSlider } from "@/components/ui/rating-slider"
import { getRatingColor } from "@/lib/rating-labels"
import type { Place } from "@/lib/types"

interface CategoryPlacesPageProps {
  selectedCategory: string
  onBack: () => void
  onPlaceSelect: (place: Place) => void
  onAddReview: (place: Place) => void
  currentUser: any
  onGoHome?: () => void
  onGoReview?: () => void
  onGoProfile?: () => void
  onNotificationClick?: (notification: any) => void // Nueva prop
}

interface Filters {
  category: string
  minRating: number
  maxPrice: string
  sortBy: "rating" | "reviews" | "name"
}

export function CategoryPlacesPage({
  selectedCategory,
  onBack,
  onPlaceSelect,
  onAddReview,
  currentUser,
  onGoHome,
  onGoReview,
  onGoProfile,
  onNotificationClick, // Nueva prop
}: CategoryPlacesPageProps) {
  const [places, setPlaces] = useState<Place[]>([])
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<Filters>({
    category: selectedCategory,
    minRating: 0,
    maxPrice: "over_80000", // Sin límite de precio por defecto
    sortBy: "rating",
  })

  const supabase = createClient()

  useEffect(() => {
    fetchPlaces()
  }, [filters.category])

  useEffect(() => {
    applyFilters()
  }, [places, filters])

  const fetchPlaces = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("places")
        .select("*")
        .eq("category", filters.category)
        .order("rating", { ascending: false })

      if (error) {
        console.error("Error fetching places:", error)
        setPlaces([])
      } else {
        setPlaces(data || [])
      }
    } catch (error) {
      console.error("Error fetching places:", error)
      setPlaces([])
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...places]

    // Filtrar por rating mínimo
    if (filters.minRating > 0) {
      filtered = filtered.filter((place) => place.rating >= filters.minRating)
    }

    // Filtrar por precio máximo (esto requeriría datos de precio en places, por ahora lo omitimos)
    // En una implementación real, necesitarías agregar un campo de rango de precio a la tabla places

    // Ordenar
    switch (filters.sortBy) {
      case "rating":
        filtered.sort((a, b) => b.rating - a.rating)
        break
      case "reviews":
        filtered.sort((a, b) => b.total_reviews - a.total_reviews)
        break
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name))
        break
    }

    setFilteredPlaces(filtered)
  }

  const handleViewReviews = (place: Place) => {
    onPlaceSelect(place)
  }

  const handleAddReviewToPlace = (place: Place) => {
    onAddReview(place)
  }

  const clearFilters = () => {
    setFilters({
      category: selectedCategory,
      minRating: 0,
      maxPrice: "over_80000",
      sortBy: "rating",
    })
  }

  const activeFiltersCount = () => {
    let count = 0
    if (filters.minRating > 0) count++
    if (filters.maxPrice !== "over_80000") count++
    if (filters.sortBy !== "rating") count++
    return count
  }

  const handleMinRatingChange = (value: number[]) => {
    setFilters({ ...filters, minRating: value[0] })
  }

  // Nueva función para manejar selección desde el header
  const handleHeaderPlaceSelect = async (selectedPlace: any) => {
    // Navegar a las reseñas del lugar seleccionado
    if (onGoHome) {
      onGoHome() // Esto debería manejar la navegación en el componente padre
    }
  }

  const minRatingColor = getRatingColor(filters.minRating)

  return (
    <div className="min-h-screen bg-background">
      <Header
        showBackButton={true}
        onBack={onBack}
        user={currentUser}
        onPlaceSelect={handleHeaderPlaceSelect}
        onNotificationClick={onNotificationClick} // Pasar la prop
      />

      <LayoutBase maxWidth="max-w-2xl" className="py-6">
        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5" />
                Filtros
                {activeFiltersCount() > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {activeFiltersCount()}
                  </Badge>
                )}
              </CardTitle>
              <div className="flex gap-2">
                {activeFiltersCount() > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-1" />
                    Limpiar
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)}>
                  {showFilters ? "Ocultar" : "Mostrar"}
                </Button>
              </div>
            </div>
          </CardHeader>

          {showFilters && (
            <CardContent className="space-y-6">
              {/* Cambiar categoría */}
              <div className="space-y-2">
                <Label>Categoría</Label>
                <Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value })}>
                  <SelectTrigger >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-[var(--radius-dropdown)]">
                    {Object.entries(RESTAURANT_CATEGORIES).map(([key, label]) => (
                      <SelectItem key={key} value={key} className="rounded-[var(--radius-dropdown)]">
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Rating mínimo con RatingSlider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Puntuación mínima</Label>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className={`text-sm font-medium ${minRatingColor}`}>
                      {filters.minRating === 0 ? "Sin filtro" : `${filters.minRating}/10`}
                    </span>
                  </div>
                </div>
                <div className="px-2">
                  <RatingSlider
                    value={[filters.minRating]}
                    onValueChange={handleMinRatingChange}
                    min={0}
                    max={10}
                    step={1}
                    className="w-full [&>div]:h-2 [&_[role=slider]]:h-6 [&_[role=slider]_span]:text-xs"
                  />
                </div>
                {filters.minRating === 0 && (
                  <p className="text-xs text-muted-foreground text-center">
                    Desliza para establecer una puntuación mínima
                  </p>
                )}
              </div>

              {/* Ordenar por */}
              <div className="space-y-2">
                <Label>Ordenar por</Label>
                <Select
                  value={filters.sortBy}
                  onValueChange={(value: "rating" | "reviews" | "name") => setFilters({ ...filters, sortBy: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-[var(--radius-dropdown)]">
                    <SelectItem value="rating" className="rounded-[var(--radius-dropdown)]">Mejor puntuación</SelectItem>
                    <SelectItem value="reviews" className="rounded-[var(--radius-dropdown)]">Más reseñas</SelectItem>
                    <SelectItem value="name" className="rounded-[var(--radius-dropdown)]">Nombre A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Lista de lugares */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Cargando lugares...</div>
          </div>
        ) : filteredPlaces.length > 0 ? (
          <div className="space-y-4">
            {filteredPlaces.map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                onViewReviews={handleViewReviews}
                onAddReview={handleAddReviewToPlace}
                showActions={true}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <div className="space-y-2">
                <h3 className="font-medium">No se encontraron lugares</h3>
                <p className="text-sm text-muted-foreground">
                  {places.length === 0
                    ? "Aún no hay lugares registrados en esta categoría."
                    : "Intenta ajustar los filtros para ver más resultados."}
                </p>
                {activeFiltersCount() > 0 && (
                  <Button variant="outline" onClick={clearFilters} className="mt-4 bg-transparent">
                    Limpiar filtros
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </LayoutBase>

      {/* Bottom Navigation */}
      <BottomNavigation
        currentPage="home"
        onGoHome={onGoHome || (() => {})}
        onGoReview={onGoReview || (() => {})}
        onGoProfile={onGoProfile || (() => {})}
      />
    </div>
  )
}
