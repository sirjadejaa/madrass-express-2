"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useKioskStore } from "@/lib/store/kiosk-store";
import { UtensilsCrossed, ChevronRight } from "lucide-react";

export default function KioskWelcomeScreen() {
  const router = useRouter();
  const resetKiosk = useKioskStore((state) => state.resetKiosk);
  const [isNavigating, setIsNavigating] = useState(false);

  // Always reset the kiosk state when arriving at the welcome screen
  useEffect(() => {
    resetKiosk();
  }, [resetKiosk]);

  const handleStart = () => {
    setIsNavigating(true);
    // Short timeout to allow button animation before navigating
    setTimeout(() => {
      router.push("/kiosk/menu");
    }, 150);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden bg-white dark:bg-zinc-950">
      
      {/* Premium ambient background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-orange-100/50 dark:bg-orange-950/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-rose-100/50 dark:bg-rose-950/20 blur-[120px]" />
        {/* Subtle grid pattern for texture */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-5 dark:opacity-[0.02]"></div>
      </div>

      <div className="flex flex-col items-center text-center w-full max-w-4xl space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
        
        {/* Logo Mark */}
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse duration-3000"></div>
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center text-primary-foreground shadow-2xl relative border-4 border-white dark:border-zinc-900">
            <UtensilsCrossed className="w-16 h-16 md:w-20 md:h-20" strokeWidth={1.5} />
          </div>
        </div>

        {/* Typography */}
        <div className="space-y-6">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-zinc-900 dark:text-zinc-50 drop-shadow-sm leading-tight">
            Madrass Express
          </h1>
          <p className="text-2xl md:text-3xl font-medium text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Authentic South Indian Cuisine. <br className="hidden sm:block"/> Freshly prepared for you.
          </p>
        </div>

        {/* Primary CTA */}
        <div className="pt-8 w-full max-w-md">
          <Button 
            size="lg" 
            className={`group relative w-full overflow-hidden text-2xl md:text-3xl h-20 md:h-24 rounded-full shadow-[0_8px_30px_rgb(234,88,12,0.3)] transition-all duration-300 ease-out active:scale-[0.98] ${isNavigating ? 'scale-[0.98] opacity-90' : 'hover:scale-[1.02] hover:shadow-[0_20px_40px_rgb(234,88,12,0.4)]'}`}
            onClick={handleStart}
            disabled={isNavigating}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-primary transition-all duration-500 group-hover:scale-105"></div>
            <span className="relative z-10 flex items-center justify-center gap-3 font-bold text-white">
              Touch to Start Order
              <ChevronRight className="w-8 h-8 md:w-10 md:h-10 transition-transform duration-300 group-hover:translate-x-2" strokeWidth={2.5} />
            </span>
          </Button>
        </div>

      </div>
    </div>
  );
}
