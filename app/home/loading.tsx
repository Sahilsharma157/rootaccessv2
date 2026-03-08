export default function HomeLoading() {
  return (
    <div className="flex h-dvh bg-background">
      {/* Sidebar skeleton - hidden on mobile */}
      <div className="hidden md:flex w-40 border-r border-border bg-card flex-col h-full shrink-0">
        <div className="h-12 border-b border-border flex items-center px-3 gap-2">
          <div className="w-4 h-4 rounded bg-muted animate-pulse" />
          <div className="w-20 h-4 rounded bg-muted animate-pulse" />
        </div>
        <div className="p-2 space-y-1">
          <div className="h-8 rounded-md bg-muted animate-pulse" />
          <div className="h-8 rounded-md bg-muted/60 animate-pulse" />
          <div className="h-8 rounded-md bg-muted/40 animate-pulse" />
        </div>
        <div className="flex-1" />
        <div className="border-t border-border p-2">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-muted animate-pulse" />
            <div className="flex-1 space-y-1">
              <div className="h-3 w-16 rounded bg-muted animate-pulse" />
              <div className="h-2.5 w-12 rounded bg-muted/60 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header skeleton */}
        <div className="flex md:hidden items-center h-12 px-3 border-b border-border bg-card">
          <div className="w-5 h-5 rounded bg-muted animate-pulse" />
          <div className="ml-2 w-4 h-4 rounded bg-muted animate-pulse" />
          <div className="ml-1.5 w-20 h-4 rounded bg-muted animate-pulse" />
        </div>
        <div className="flex-1 p-4 md:p-6">
          <div className="h-8 w-48 rounded bg-muted animate-pulse mb-2" />
          <div className="h-4 w-64 rounded bg-muted/60 animate-pulse mb-6" />
          <div className="h-10 w-full max-w-md rounded-md bg-muted animate-pulse mb-6" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 rounded-lg bg-muted/50 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
