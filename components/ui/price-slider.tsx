"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "@/lib/utils"
import { PRICE_RANGES } from "@/lib/types"

interface PriceSliderProps {
  value: string
  onValueChange: (value: string) => void
  className?: string
}

// Mapeo de índices a keys de PRICE_RANGES
const PRICE_OPTIONS = [
  "under_10000",
  "10000_15000",
  "15000_20000",
  "20000_30000",
  "30000_50000",
  "50000_80000",
  "over_80000",
]

const PriceSlider = React.forwardRef<React.ElementRef<typeof SliderPrimitive.Root>, PriceSliderProps>(
  ({ className, value, onValueChange, ...props }, ref) => {
    // Convertir el valor string a índice numérico
    const currentIndex = PRICE_OPTIONS.indexOf(value) + 1 || 1

    // Manejar cambio de valor
    const handleValueChange = (newValue: number[]) => {
      const selectedKey = PRICE_OPTIONS[newValue[0] - 1]
      onValueChange(selectedKey)
    }

    // Obtener el texto a mostrar
    const currentPriceText =
      PRICE_RANGES[value as keyof typeof PRICE_RANGES] || PRICE_RANGES[PRICE_OPTIONS[0] as keyof typeof PRICE_RANGES]

    return (
      <div className="space-y-3">
        <SliderPrimitive.Root
          ref={ref}
          className={cn("relative flex w-full touch-none select-none items-center group", className)}
          value={[currentIndex]}
          onValueChange={handleValueChange}
          min={1}
          max={7}
          step={1}
          {...props}
        >
          <SliderPrimitive.Track className="relative h-3 w-full grow overflow-hidden rounded-full bg-secondary border border-border group-hover:bg-secondary/80 transition-colors duration-150">
            <SliderPrimitive.Range className="absolute h-full bg-primary transition-all duration-300 ease-out" />
          </SliderPrimitive.Track>
          <SliderPrimitive.Thumb className="relative block h-8 w-8 rounded-full border-2 border-primary bg-background shadow-md ring-offset-background transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:scale-110 hover:shadow-lg cursor-grab active:cursor-grabbing active:scale-105 active:shadow-xl">
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-primary transition-all duration-200">
              $
            </span>
          </SliderPrimitive.Thumb>
        </SliderPrimitive.Root>

        {/* Mostrar el rango de precio seleccionado */}
        <div className="text-center">
          <div className="text-sm font-semibold text-primary bg-primary/10 rounded-lg px-4 py-2 inline-block">
            {currentPriceText}
          </div>
        </div>
      </div>
    )
  },
)
PriceSlider.displayName = "PriceSlider"

export { PriceSlider }
