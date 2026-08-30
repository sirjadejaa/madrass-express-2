import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UtensilsCrossed } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-[100dvh] bg-stone-50 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none opacity-20">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-amber-500 blur-[120px]"></div>
        <div className="absolute top-[60%] -right-[10%] w-[60%] h-[60%] rounded-full bg-orange-600 blur-[150px]"></div>
      </div>

      <div className="z-10 flex flex-col items-center max-w-4xl px-4 sm:px-6 text-center w-full">
        <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-white shadow-2xl rounded-full border-4 border-amber-500 flex items-center justify-center w-32 h-32 sm:w-40 sm:h-40">
          <UtensilsCrossed className="w-16 h-16 sm:w-20 sm:h-20 text-amber-600" />
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-stone-900 tracking-tight mb-4">
          MADRASS <span className="text-amber-600">EXPRESS</span>
        </h1>
        
        <p className="text-lg sm:text-xl md:text-3xl text-stone-600 mb-8 sm:mb-12 font-medium">
          Authentic South Indian Taste
        </p>

        <Link href="/kiosk">
          <Button size="lg" className="h-16 px-8 text-lg sm:h-20 sm:px-12 sm:text-2xl font-bold rounded-full bg-amber-600 hover:bg-amber-700 text-white shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 w-full sm:w-auto">
            START YOUR ORDER
          </Button>
        </Link>
      </div>

      {/* Development Navigation Test Links */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-6 text-sm font-medium text-stone-400 z-10 opacity-60 hover:opacity-100 transition-opacity">
        <Link href="/kiosk" className="hover:text-stone-900 transition-colors">Kiosk</Link>
        <Link href="/kitchen" className="hover:text-stone-900 transition-colors">Kitchen</Link>
        <Link href="/display" className="hover:text-stone-900 transition-colors">Display</Link>
        <Link href="/admin" className="hover:text-stone-900 transition-colors">Admin</Link>
        <Link href="/login" className="hover:text-stone-900 transition-colors">Login</Link>
      </div>
    </div>
  );
}
