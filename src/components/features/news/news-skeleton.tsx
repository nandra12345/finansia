"use client";

import { Card, CardContent } from "@/components/ui/card";

interface NewsSkeletonProps {
  count?: number;
}

function NewsSingleSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="space-y-4">
          {/* Image skeleton */}
          <div className="h-48 w-full bg-muted animate-pulse" />

          <div className="space-y-3 p-4">
            {/* Title skeleton */}
            <div className="space-y-2">
              <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
              <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
            </div>

            {/* Description skeleton */}
            <div className="space-y-2">
              <div className="h-3 w-full bg-muted animate-pulse rounded" />
              <div className="h-3 w-5/6 bg-muted animate-pulse rounded" />
            </div>

            {/* Footer skeleton */}
            <div className="flex items-center justify-between pt-2">
              <div className="h-5 w-20 bg-muted animate-pulse rounded" />
              <div className="h-5 w-16 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function NewsSkeleton({ count = 6 }: NewsSkeletonProps) {
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <NewsSingleSkeleton key={i} />
      ))}
    </div>
  );
}
