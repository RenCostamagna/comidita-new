interface LayoutBaseProps {
  children: React.ReactNode
  maxWidth?: string // Ej: "max-w-2xl", "max-w-4xl"
  className?: string
}

export function LayoutBase({ children, maxWidth = "max-w-2xl", className = "" }: LayoutBaseProps) {
  return (
    <main className={`pt-20 px-4 container mx-auto pb-24 ${maxWidth} ${className}`}>
      {children}
    </main>
  )
}
