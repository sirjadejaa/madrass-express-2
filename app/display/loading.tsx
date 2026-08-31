import { Loader2 } from "lucide-react";

export default function DisplayLoading() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-stone-50 dark:bg-zinc-950">
      <Loader2 className="w-16 h-16 animate-spin text-zinc-300 dark:text-zinc-800" />
      <p className="mt-8 text-2xl text-zinc-400 dark:text-zinc-600 font-black tracking-widest uppercase animate-pulse">Initializing Display...</p>
    </div>
  );
}
