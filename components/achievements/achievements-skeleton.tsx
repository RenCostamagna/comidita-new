"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function AchievementsSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-16 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-8 w-20" />
      </div>

      {/* Horizontal scrollable cards skeleton */}
      <div className="relative">
        <div className="overflow-x-auto pb-4 scrollbar-hide">
          <div className="flex gap-3 w-max pl-0 pr-16">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card
                key={i}
                className="relative overflow-hidden w-48 h-48 border-0 flex-shrink-0 bg-muted animate-pulse"
              >
                <CardContent className="p-4 h-full flex flex-col justify-between relative">
                  {/* Top row skeleton */}
                  <div className="flex items-start justify-between mb-3">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>

                  {/* Content skeleton */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="mb-4">
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-24" />
                    </div>

                    {/* Progress section skeleton */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                      <Skeleton className="h-2 w-full rounded-full" />
                      <div className="text-center pt-0.5">
                        <Skeleton className="h-3 w-24 mx-auto" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
