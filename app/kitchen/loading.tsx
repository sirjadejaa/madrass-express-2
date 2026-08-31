export default function KitchenLoading() {
  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-stone-900 text-stone-50">
      <div className="flex-none p-4 bg-slate-900 border-b border-slate-800 shadow-md flex items-center justify-between">
        <div className="h-8 w-64 bg-slate-800 rounded animate-pulse"></div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="h-12 w-12 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-stone-400 font-bold tracking-widest uppercase animate-pulse">Loading Kitchen Display...</p>
      </div>
    </div>
  );
}
