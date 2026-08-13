import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      {/* Page header skeleton */}
      <div className="space-y-1">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>

      {/* KPI grid skeleton */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-4 rounded" />
            </div>
            <Skeleton className="h-7 w-12" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>

      {/* Recent orders skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-28" />
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="border-b bg-muted/30 px-4 py-2.5">
            <Skeleton className="h-3 w-full max-w-lg" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 border-b last:border-0 px-4 py-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-16 ml-auto" />
              <Skeleton className="h-5 w-20" />
            </div>
          ))}
        </div>
      </div>

      {/* Outstanding skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-36" />
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="border-b bg-muted/30 px-4 py-2.5">
            <Skeleton className="h-3 w-full max-w-lg" />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 border-b last:border-0 px-4 py-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-16 ml-auto" />
              <Skeleton className="h-5 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
