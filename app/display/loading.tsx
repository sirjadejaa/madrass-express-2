export default function DisplayLoading() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-stone-50 dark:bg-zinc-950">
      <div className="h-16 w-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
      <p className="mt-6 text-xl text-zinc-500 font-bold tracking-widest uppercase animate-pulse">Starting Display...</p>
    </div>
  );
}
