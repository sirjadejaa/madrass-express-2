export default function LoginLoading() {
  return (
    <div className="flex h-screen w-full bg-white dark:bg-zinc-950">
      <div className="hidden lg:flex w-1/2 bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex-col justify-between p-12">
        <div className="h-12 w-12 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse"></div>
        <div className="space-y-4">
          <div className="h-10 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div>
          <div className="h-6 w-1/2 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div>
        </div>
      </div>
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-sm space-y-8 flex flex-col items-center">
          <div className="h-10 w-10 border-4 border-amber-600/30 border-t-amber-600 rounded-full animate-spin mb-4"></div>
          <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div>
          <div className="space-y-6 w-full">
            <div className="space-y-2">
              <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div>
              <div className="h-12 w-full bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div>
              <div className="h-12 w-full bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div>
            </div>
            <div className="h-12 w-full bg-amber-600/30 rounded animate-pulse mt-4"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
