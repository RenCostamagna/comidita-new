"use client"

import { lazy, Suspense, useEffect, useRef, useState } from "react"
import { AchievementsSkeleton } from "./achievements-skeleton"

// Lazy load the AchievementsProgress component
const AchievementsProgress = lazy(() =>
  import("./achievements-progress").then((module) => ({
    default: module.AchievementsProgress,
  })),
)

interface LazyAchievementsProgressProps {
  userId?: string
  onViewAllAchievements?: () => void
  onAchievementSelect?: (achievement: any) => void
}

export function LazyAchievementsProgress({
  userId,
  onViewAllAchievements,
  onAchievementSelect,
}: LazyAchievementsProgressProps) {
  const [shouldLoad, setShouldLoad] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && !shouldLoad) {
          setShouldLoad(true)
          observer.disconnect() // Stop observing once we've triggered the load
        }
      },
      {
        // Trigger when the element is 200px away from entering the viewport
        rootMargin: "200px 0px",
        threshold: 0,
      },
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [shouldLoad])

  return (
    <div ref={containerRef}>
      {shouldLoad ? (
        <Suspense fallback={<AchievementsSkeleton />}>
          <AchievementsProgress
            userId={userId}
            onViewAllAchievements={onViewAllAchievements}
            onAchievementSelect={onAchievementSelect}
          />
        </Suspense>
      ) : (
        <AchievementsSkeleton />
      )}
    </div>
  )
}
