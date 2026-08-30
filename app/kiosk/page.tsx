"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useKioskStore } from "@/lib/store/kiosk-store";

export default function KioskWelcomeScreen() {
  const router = useRouter();
  const resetKiosk = useKioskStore((state) => state.resetKiosk);

  // Always reset the kiosk state when arriving at the welcome screen
  useEffect(() => {
    resetKiosk();
  }, [resetKiosk]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden bg-orange-50/30 dark:bg-zinc-950">
      
      {/* Premium background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[100px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-orange-500/10 blur-[100px]" />
      </div>

      <div className="flex flex-col items-center text-center max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* Placeholder for Logo */}
        <div className="w-40 h-40 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-5xl shadow-2xl mb-4">
          🌶️
        </div>

        <div className="space-y-4">
          <h1 className="text-6xl md:text-8xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 drop-shadow-sm">
            Madrass Express
          </h1>
          <p className="text-3xl md:text-4xl font-medium text-muted-foreground mt-4">
            Authentic South Indian Cuisine
          </p>
        </div>

        <div className="pt-12">
          <Button 
            size="lg" 
            className="text-3xl px-16 py-12 rounded-full shadow-[0_10px_40px_-10px_rgba(234,88,12,0.5)] hover:scale-105 hover:shadow-[0_10px_50px_-5px_rgba(234,88,12,0.6)] transition-all duration-300"
            onClick={() => router.push("/kiosk/menu")}
          >
            Touch to Start Order
          </Button>
        </div>
      </div>
    </div>
  );
}
