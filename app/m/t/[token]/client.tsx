"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMobileCartStore } from "@/lib/store/mobile-cart-store";
import { Button } from "@/components/ui/button";
import { 
  UtensilsCrossed, 
  MapPin, 
  Sparkles, 
  ArrowRight, 
  Clock, 
  ShieldCheck, 
  Users 
} from "lucide-react";

interface WelcomeClientProps {
  table: {
    id: string;
    number: string;
    capacity: number | null;
    description: string | null;
    restaurantId: string;
  };
  restaurant: {
    id: string;
    name: string;
    currency: string;
    taxPercent: number;
    brandLogoUrl: string | null;
  };
  token: string;
}

export function WelcomeClient({ table, restaurant }: WelcomeClientProps) {
  const router = useRouter();
  const setTableContext = useMobileCartStore((state) => state.setTableContext);
  const setTaxPercent = useMobileCartStore((state) => state.setTaxPercent);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    // Sync store with validated table and restaurant context
    setTableContext({
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      tableId: table.id,
      tableName: table.number,
    });
    setTaxPercent(restaurant.taxPercent);
  }, [table, restaurant, setTableContext, setTaxPercent]);

  const handleStart = () => {
    setIsNavigating(true);
    router.push("/kiosk/menu");
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-6 relative overflow-hidden bg-gradient-to-b from-amber-500/10 via-white to-white min-h-[90vh]">
      {/* Decorative background glow */}
      <div className="absolute top-[-80px] right-[-80px] w-64 h-64 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-[-80px] w-64 h-64 bg-orange-400/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar with Table Badge */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-600/20">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <span className="font-black text-lg tracking-tight text-zinc-950 uppercase">
            {restaurant.name}
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-zinc-950 text-white font-extrabold text-xs px-3 py-1.5 rounded-full shadow-sm">
          <MapPin className="w-3.5 h-3.5 text-amber-400" />
          Table {table.number}
        </div>
      </div>

      {/* Main Hero Card */}
      <div className="my-auto py-8 text-center space-y-6">
        {/* Large Table Indicator */}
        <div className="relative inline-block mx-auto">
          <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 flex flex-col items-center justify-center text-white shadow-2xl shadow-amber-600/30 border-4 border-white">
            <span className="text-[11px] font-bold tracking-widest uppercase opacity-90">
              Seated At
            </span>
            <span className="text-3xl font-black tracking-tight mt-0.5">
              {table.number}
            </span>
          </div>
          {table.capacity && (
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-zinc-900 text-zinc-100 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm whitespace-nowrap">
              <Users className="w-3 h-3 text-amber-400" /> {table.capacity} Seats
            </span>
          )}
        </div>

        {/* Welcome Text */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-800 text-xs font-bold px-3 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            Authentic South Indian Cuisine
          </div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-950 leading-tight">
            Order from Your Table
          </h1>
          <p className="text-sm text-zinc-600 font-medium max-w-xs mx-auto leading-relaxed">
            Browse our crispy dosas, fluffy idlis, and freshly brewed filter coffee. Customized and served straight to Table {table.number}.
          </p>
        </div>

        {/* Feature Badges */}
        <div className="grid grid-cols-2 gap-2.5 pt-2 max-w-xs mx-auto text-left">
          <div className="p-3 bg-zinc-50 border border-zinc-100 rounded-2xl flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-zinc-900">Direct to Kitchen</p>
              <p className="text-[11px] text-zinc-500 font-medium">No waiter delays</p>
            </div>
          </div>
          <div className="p-3 bg-zinc-50 border border-zinc-100 rounded-2xl flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-zinc-900">Live Status</p>
              <p className="text-[11px] text-zinc-500 font-medium">Track your order</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA Button */}
      <div className="space-y-2 pt-4">
        <Button
          onClick={handleStart}
          disabled={isNavigating}
          size="lg"
          className="w-full h-14 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-base rounded-2xl shadow-lg shadow-amber-600/25 transition-all flex items-center justify-center gap-2 group"
        >
          <span>{isNavigating ? "Loading Menu..." : "Explore Menu & Order"}</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Button>
        <p className="text-[11px] text-center font-medium text-zinc-400">
          Table locked to {table.number} • No app download required
        </p>
      </div>
    </div>
  );
}
