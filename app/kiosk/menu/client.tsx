"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useKioskStore } from "@/lib/store/kiosk-store";
import { KioskCategory, CategorySidebar } from "../components/category-sidebar";
import { KioskProduct } from "./types";
import { OrderFlowModal } from "../components/order-flow-modal";
import { ProductGrid } from "../components/product-grid";
import { ProductDetailModal } from "../components/product-detail-modal";
import { CartSidebar } from "../components/cart-sidebar";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface KioskClientProps {
  categories: KioskCategory[];
  products: KioskProduct[];
  tables: { id: string, number: string }[];
  restaurantName: string;
  taxPercent: number;
}

export function KioskClient({ categories, products, tables, restaurantName, taxPercent }: KioskClientProps) {
  const router = useRouter();
  const resetKiosk = useKioskStore(state => state.resetKiosk);
  const setTaxPercent = useKioskStore(state => state.setTaxPercent);
  
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<KioskProduct | null>(null);

  useEffect(() => {
    setTaxPercent(taxPercent);
  }, [taxPercent, setTaxPercent]);

  // Inactivity timeout
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      // Reset to welcome screen after 2 minutes of inactivity
      timeoutId = setTimeout(() => {
        resetKiosk();
        router.push("/kiosk");
      }, 2 * 60 * 1000); 
    };

    // Events that reset the timer
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(e => document.addEventListener(e, resetTimer));
    
    resetTimer(); // init

    return () => {
      clearTimeout(timeoutId);
      events.forEach(e => document.removeEventListener(e, resetTimer));
    };
  }, [resetKiosk, router]);

  return (
    <div className="flex h-full w-full overflow-hidden bg-muted/20 relative">
      <OrderFlowModal tables={tables} />
      
      {/* Back Button */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute top-4 left-4 z-50 rounded-full bg-background shadow-sm w-12 h-12"
        onClick={() => {
          resetKiosk();
          router.push("/kiosk");
        }}
      >
        <ArrowLeft className="w-6 h-6" />
      </Button>

      <div className="pt-20 lg:pt-4 flex-1 flex h-full">
        <CategorySidebar 
          categories={categories}
          activeCategoryId={activeCategoryId}
          onSelectCategory={setActiveCategoryId}
        />
        
        <div className="flex-1 flex flex-col relative">
          <div className="absolute top-0 left-0 w-full p-6 pb-2 z-10 bg-gradient-to-b from-muted/50 to-transparent pointer-events-none hidden lg:block">
            <h1 className="text-3xl font-black text-foreground drop-shadow-sm">{restaurantName}</h1>
          </div>
          <ProductGrid 
            products={products}
            activeCategoryId={activeCategoryId}
            onProductClick={setSelectedProduct}
          />
        </div>
      </div>

      <CartSidebar />

      <ProductDetailModal 
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
}
