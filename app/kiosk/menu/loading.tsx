export default function MenuLoading() {
  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-zinc-50 dark:bg-zinc-950 flex-col lg:flex-row">
      
      {/* Mobile Top Header (Skeleton) */}
      <div className="lg:hidden p-4 bg-white dark:bg-zinc-950 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center z-10 shrink-0">
        <div className="h-6 w-32 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
        <div className="h-10 w-10 bg-zinc-200 dark:bg-zinc-800 rounded-full animate-pulse" />
      </div>

      {/* Category Sidebar Skeleton */}
      <div className="hidden lg:flex w-72 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 flex-col h-full shrink-0 z-20">
        <div className="p-8">
          <div className="h-8 w-40 bg-zinc-200 dark:bg-zinc-800 rounded mb-8 animate-pulse" />
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-14 w-full bg-zinc-200 dark:bg-zinc-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
      
      {/* Mobile Category Sidebar (Horizontal) Skeleton */}
      <div className="lg:hidden bg-white dark:bg-zinc-950 border-b border-zinc-100 dark:border-zinc-800 p-4 flex gap-3 overflow-x-hidden">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-12 w-28 bg-zinc-200 dark:bg-zinc-800 rounded-full shrink-0 animate-pulse" />
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-zinc-50 dark:bg-zinc-950/50">
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 pt-2 lg:pt-16 max-w-[1920px] mx-auto">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col">
                <div className="aspect-[4/3] w-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                <div className="p-4 sm:p-5 flex flex-col gap-3">
                  <div className="h-5 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                  <div className="h-3 w-full bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                  <div className="h-3 w-5/6 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                  <div className="mt-4 flex justify-between items-center">
                    <div className="h-6 w-16 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                    <div className="h-10 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-full animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop Cart Sidebar Skeleton */}
      <div className="hidden lg:flex w-[380px] border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex-col h-full shrink-0 z-30">
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800">
          <div className="h-8 w-40 bg-zinc-200 dark:bg-zinc-800 rounded mb-2 animate-pulse" />
          <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
        </div>
        <div className="flex-1 p-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 w-full bg-zinc-200 dark:bg-zinc-800 rounded-3xl animate-pulse" />
          ))}
        </div>
        <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
          <div className="h-4 w-full bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
          <div className="h-4 w-full bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
          <div className="h-6 w-full bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
          <div className="h-16 w-full bg-zinc-300 dark:bg-zinc-700 rounded-full animate-pulse mt-4" />
        </div>
      </div>

      {/* Mobile Sticky Cart Skeleton */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 z-40 pb-[env(safe-area-inset-bottom)]">
        <div className="p-4">
          <div className="h-16 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full animate-pulse" />
        </div>
      </div>

    </div>
  );
}
