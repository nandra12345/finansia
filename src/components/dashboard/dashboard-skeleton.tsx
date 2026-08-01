"use client";

export function DashboardSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="rounded-3xl border border-border bg-card p-6">
          <div className="h-4 w-24 rounded-full bg-muted animate-pulse" />
          <div className="mt-6 space-y-3">
            <div className="h-10 w-3/4 rounded bg-muted animate-pulse" />
            <div className="h-6 w-1/2 rounded bg-muted animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
