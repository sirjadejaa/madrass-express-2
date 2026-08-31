export default function GlobalLoading() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="h-10 w-10 border-4 border-amber-600/30 border-t-amber-600 rounded-full animate-spin"></div>
      <p className="mt-4 text-zinc-500 font-medium animate-pulse">Loading...</p>
    </div>
  );
}
