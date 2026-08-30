"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useKioskStore } from "@/lib/store/kiosk-store";
import { KioskCategory, CategorySidebar } from "../components/category-sidebar";
import { KioskProduct } from "./types";
import { OrderFlowModal } from "../components/order-flow-modal";
import { ProductGrid } from "../components/product-grid";
import { ProductDetailModal } from "../components/product-detail-modal";
import { CartSidebarDesktop, CartSidebarContent } from "../components/cart-sidebar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";

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
  const cart = useKioskStore(state => state.cart);
  
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<KioskProduct | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

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

  const cartItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="flex flex-col lg:flex-row h-full w-full bg-muted/20 relative">
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

      {/* Main Content Area */}
      <div className="pt-20 lg:pt-4 flex-1 flex flex-col lg:flex-row h-full overflow-hidden pb-24 lg:pb-0">
        <CategorySidebar 
          categories={categories}
          activeCategoryId={activeCategoryId}
          onSelectCategory={setActiveCategoryId}
        />
        
        <div className="flex-1 flex flex-col relative overflow-hidden">
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

      {/* Desktop Persistent Cart Sidebar */}
      <CartSidebarDesktop />

      {/* Mobile Sticky Cart Trigger & Sheet */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t shadow-[0_-10px_30px_rgba(0,0,0,0.1)] z-40">
        <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
          <SheetTrigger 
            render={
              <Button size="lg" className="w-full h-14 text-lg rounded-2xl flex justify-between px-6 shadow-lg">
                <span className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5"/> 
                  {cartItemsCount} {cartItemsCount === 1 ? 'item' : 'items'}
                </span>
                <span className="font-bold">View Cart</span>
              </Button>
            }
          />
          <SheetContent side="bottom" className="h-[85vh] p-0 flex flex-col rounded-t-[2rem]">
            <SheetTitle className="sr-only">Your Cart</SheetTitle>
            <CartSidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      <ProductDetailModal 
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
}
