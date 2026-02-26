export function DocumentCardSkeleton() {
  return (
    <div className="flex items-start gap-4 rounded-sm border border-border/50 bg-card px-4 py-4 sm:px-5">
      {/* Thumbnail skeleton */}
      <div className="hidden shrink-0 sm:block">
        <div className="h-16 w-12 animate-pulse rounded-[2px] bg-accent" />
      </div>

      {/* Icon skeleton (mobile) */}
      <div className="h-10 w-10 shrink-0 animate-pulse rounded-sm bg-accent sm:hidden" />

      {/* Content skeleton */}
      <div className="min-w-0 flex-1 space-y-3">
        {/* Title row */}
        <div className="flex items-center gap-2">
          <div className="h-3.5 w-32 animate-pulse rounded-sm bg-accent" />
          <div className="h-4 w-16 animate-pulse rounded-sm bg-accent" />
        </div>

        {/* Summary lines */}
        <div className="space-y-1.5">
          <div className="h-2.5 w-full animate-pulse rounded-sm bg-accent" />
          <div className="h-2.5 w-4/5 animate-pulse rounded-sm bg-accent" />
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-2">
          <div className="h-2 w-24 animate-pulse rounded-sm bg-accent" />
          <div className="h-2 w-32 animate-pulse rounded-sm bg-accent" />
        </div>
      </div>

      {/* Arrow skeleton */}
      <div className="mt-1 h-3.5 w-3.5 shrink-0 animate-pulse rounded-sm bg-accent" />
    </div>
  );
}

export function DocumentCardSkeletonGroup({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <DocumentCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function DocumentDetailSkeleton() {
  return (
    <div className="document-card paper-texture rounded-sm border border-border/50 bg-card p-5 sm:p-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        {/* Thumbnail skeleton */}
        <div className="hidden shrink-0 sm:block">
          <div className="h-[200px] w-[150px] animate-pulse rounded-[2px] bg-accent" />
        </div>

        {/* Content skeleton */}
        <div className="min-w-0 flex-1 space-y-4">
          {/* Title */}
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 animate-pulse rounded-sm bg-accent" />
            <div className="h-5 w-3/4 animate-pulse rounded-sm bg-accent" />
          </div>

          {/* Category badge */}
          <div className="h-5 w-40 animate-pulse rounded-sm bg-accent" />

          {/* Metadata row */}
          <div className="flex flex-wrap gap-3">
            <div className="h-3.5 w-44 animate-pulse rounded-sm bg-accent" />
            <div className="h-3.5 w-20 animate-pulse rounded-sm bg-accent" />
            <div className="h-5 w-24 animate-pulse rounded-sm bg-accent" />
          </div>

          {/* PDF link */}
          <div className="h-7 w-40 animate-pulse rounded-sm bg-accent" />
        </div>
      </div>

      {/* Separator */}
      <div className="my-6 h-px w-full bg-border/30" />

      {/* Summary skeleton */}
      <div className="space-y-4">
        <div className="h-3 w-16 animate-pulse rounded-sm bg-accent" />
        <div className="space-y-1.5">
          <div className="h-3 w-full animate-pulse rounded-sm bg-accent" />
          <div className="h-3 w-5/6 animate-pulse rounded-sm bg-accent" />
          <div className="h-3 w-3/4 animate-pulse rounded-sm bg-accent" />
        </div>

        {/* Context box */}
        <div className="h-28 w-full animate-pulse rounded-sm bg-amber/5 border border-amber/10" />

        {/* Tags */}
        <div className="flex gap-2">
          <div className="h-5 w-16 animate-pulse rounded-sm bg-accent" />
          <div className="h-5 w-20 animate-pulse rounded-sm bg-accent" />
          <div className="h-5 w-14 animate-pulse rounded-sm bg-accent" />
        </div>
      </div>
    </div>
  );
}
