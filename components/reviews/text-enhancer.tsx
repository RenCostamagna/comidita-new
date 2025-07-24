"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sparkles, Loader2, RotateCcw } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'

interface TextEnhancerProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  className?: string
  context: {
    placeName?: string
    dishName?: string
    ratings?: Record<string, number>
    priceRange?: string
    category?: string
    dietaryOptions?: {
      celiac_friendly?: boolean
      vegetarian_friendly?: boolean
    }
  }
}

export function TextEnhancer({
  value,
  onChange,
  placeholder = "Cuéntanos más detalles...",
  rows = 4,
  className = "",
  context
}: TextEnhancerProps) {
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [originalText, setOriginalText] = useState("")
  const [hasEnhanced, setHasEnhanced] = useState(false)

  const handleEnhance = async () => {
    if (!value.trim() && !context.placeName) {
      return
    }

    setIsEnhancing(true)
    setOriginalText(value) // Guardar el texto original

    try {
      const response = await fetch('/api/enhance-review-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalText: value,
          placeName: context.placeName,
          dishName: context.dishName,
          ratings: context.ratings,
          priceRange: context.priceRange,
          category: context.category,
          dietaryOptions: context.dietaryOptions,
        }),
      })

      const data = await response.json()

      if (data.success && data.enhancedText) {
        onChange(data.enhancedText)
        setHasEnhanced(true)
      } else {
        console.error('Error enhancing text:', data.error)
      }
    } catch (error) {
      console.error('Error calling enhance API:', error)
    } finally {
      setIsEnhancing(false)
    }
  }

  const handleRevert = () => {
    onChange(originalText)
    setHasEnhanced(false)
  }

  const canEnhance = (value.trim().length > 0) || context.placeName

  return (
    <div className="space-y-2">
      <div className="relative">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={`${className} pr-12`}
        />
        
        {/* Botón de embellecedor inline */}
        <div className="absolute top-2 right-2 flex gap-1">
          {hasEnhanced && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRevert}
              disabled={isEnhancing}
              className="h-8 w-8 p-0 hover:bg-orange-100"
              title="Deshacer mejora"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          )}
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleEnhance}
            disabled={isEnhancing || !canEnhance}
            className="h-8 w-8 p-0 hover:bg-blue-100 disabled:opacity-50"
            title="Mejorar texto con IA"
          >
            {isEnhancing ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Sparkles className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>
      
      {/* Indicador de estado */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          {hasEnhanced && (
            <span className="text-blue-600 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Texto mejorado con IA
            </span>
          )}
          {isEnhancing && (
            <span className="text-orange-600 flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Mejorando texto...
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          
            </div>
      </div>
    </div>
  )
}
