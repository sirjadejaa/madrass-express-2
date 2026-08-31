"use client";

import { UtensilsCrossed } from "lucide-react";

export default function KioskLoadingScreen() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden bg-white dark:bg-zinc-950 h-[100dvh] w-full">
      {/* Premium ambient background (same as welcome screen to avoid flash) */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-orange-100/50 dark:bg-orange-950/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-rose-100/50 dark:bg-rose-950/20 blur-[120px]" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-5 dark:opacity-[0.02]"></div>
      </div>

      <div className="flex flex-col items-center text-center space-y-8">
        
        {/* Animated Logo Mark */}
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse duration-1000"></div>
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center text-primary-foreground shadow-2xl relative border-4 border-white dark:border-zinc-900 animate-bounce">
            <UtensilsCrossed className="w-12 h-12 md:w-16 md:h-16" strokeWidth={1.5} />
          </div>
        </div>

        {/* Loading Typography */}
        <div className="space-y-3 animate-pulse">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Preparing your menu...
          </h2>
          <p className="text-muted-foreground font-medium">
            Just a moment
          </p>
        </div>

      </div>
    </div>
  );
}
