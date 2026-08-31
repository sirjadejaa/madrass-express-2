import { Loader2 } from "lucide-react";

export default function KitchenLoading() {
  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-stone-900">
      <div className="flex-none p-4 bg-slate-900 border-b border-slate-800 shadow-md flex items-center justify-between">
        <h1 className="text-2xl font-black tracking-tight text-white opacity-50">KITCHEN DISPLAY SYSTEM</h1>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-full bg-amber-500/50 animate-pulse"></div>
          <span className="text-sm font-bold text-amber-500/50 uppercase tracking-wider">Connecting</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden p-4">
        <div className="h-full w-full flex flex-col items-center justify-center text-stone-500 space-y-6">
          <Loader2 className="w-16 h-16 animate-spin text-stone-700" />
          <h2 className="text-xl font-bold tracking-widest uppercase animate-pulse">Initializing Kitchen System...</h2>
        </div>
      </div>
    </div>
  );
}
