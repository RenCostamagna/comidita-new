"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "@/lib/utils"

interface RatingSliderProps {
  value: number[]
  onValueChange: (value: number[]) => void
  min?: number
  max?: number
  step?: number
  className?: string
}

const RatingSlider = React.forwardRef<React.ElementRef<typeof SliderPrimitive.Root>, RatingSliderProps>(
  ({ className, value, onValueChange, min = 1, max = 10, step = 1, ...props }, ref) => (
    <div className="space-y-1">
      <SliderPrimitive.Root
        ref={ref}
        className={cn("relative flex w-full touch-none select-none items-center group", className)}
        value={value}
        onValueChange={onValueChange}
        min={min}
        max={max}
        step={step}
        {...props}
      >
        <SliderPrimitive.Track className="relative h-3 w-full grow overflow-hidden rounded-full bg-secondary border border-border group-hover:bg-secondary/80 transition-colors duration-150">
          <SliderPrimitive.Range className="absolute h-full bg-primary transition-all duration-300 ease-out" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className="relative block h-8 w-8 rounded-full border-2 border-primary bg-background shadow-md ring-offset-background transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:scale-110 hover:shadow-lg cursor-grab active:cursor-grabbing active:scale-105 active:shadow-xl">
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-primary transition-all duration-200">
            {value[0]}
          </span>
        </SliderPrimitive.Thumb>
      </SliderPrimitive.Root>
    </div>
  ),
)
RatingSlider.displayName = "RatingSlider"

export { RatingSlider }
