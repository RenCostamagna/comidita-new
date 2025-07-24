"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PhotoModalProps {
  photos: Array<{
    photo_url: string
    is_primary?: boolean
    photo_order?: number
  }>
  isOpen: boolean
  initialIndex: number
  onClose: () => void
}

export function PhotoModal({ photos, isOpen, initialIndex, onClose }: PhotoModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  // Mínima distancia de deslizamiento para considerar un swipe
  const minSwipeDistance = 50

  useEffect(() => {
    setCurrentIndex(initialIndex)
  }, [initialIndex, isOpen])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }

    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  // Manejar navegación con teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case "Escape":
          onClose()
          break
        case "ArrowLeft":
          navigateImage("prev")
          break
        case "ArrowRight":
          navigateImage("next")
          break
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen])

  const navigateImage = (direction: "prev" | "next") => {
    if (direction === "prev") {
      setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1))
    } else {
      setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0))
    }
  }

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe && photos.length > 1) {
      navigateImage("next")
    }
    if (isRightSwipe && photos.length > 1) {
      navigateImage("prev")
    }
  }

  if (!isOpen || photos.length === 0) return null

  const currentPhoto = photos[currentIndex]

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center" onClick={onClose}>
      {/* Header con botón de cerrar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center p-4 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center gap-2 text-white text-sm">
          <span>
            {currentIndex + 1} / {photos.length}
          </span>
        </div>
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-12 w-12" onClick={onClose}>
          <X className="h-6 w-6" />
        </Button>
      </div>

      {/* Controles de navegación - solo si hay más de una foto */}
      {photos.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 h-12 w-12"
            onClick={(e) => {
              e.stopPropagation()
              navigateImage("prev")
            }}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 h-12 w-12"
            onClick={(e) => {
              e.stopPropagation()
              navigateImage("next")
            }}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </>
      )}

      {/* Imagen principal */}
      <div
        className="relative max-w-full max-h-full p-4 flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <img
          ref={imageRef}
          src={currentPhoto?.photo_url || "/placeholder.svg"}
          alt={`Foto ${currentIndex + 1} de ${photos.length}`}
          className="max-w-full max-h-full object-contain rounded-lg select-none"
          crossOrigin="anonymous"
          onError={(e) => {
            console.error("Error cargando imagen en modal:", currentPhoto?.photo_url)
            const target = e.target as HTMLImageElement
            target.src = "/placeholder.svg?height=600&width=600&text=Error+cargando+imagen"
          }}
          onLoad={() => {
            console.log("✅ Imagen cargada en modal:", currentPhoto?.photo_url)
          }}
        />
      </div>

      {/* Indicadores de fotos (dots) - solo en móvil y si hay más de una foto */}
      {photos.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2 md:hidden">
          {photos.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-all ${index === currentIndex ? "bg-white" : "bg-white/50"}`}
              onClick={(e) => {
                e.stopPropagation()
                setCurrentIndex(index)
              }}
            />
          ))}
        </div>
      )}

      {/* Instrucciones de swipe en móvil */}
      {photos.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 text-white/70 text-xs text-center md:hidden">
          Desliza para navegar
        </div>
      )}
    </div>
  )
}
