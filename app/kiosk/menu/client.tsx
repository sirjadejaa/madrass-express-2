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
import { ArrowLeft, ShoppingBag, Search } from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);

  useEffect(() => {
    setTaxPercent(taxPercent);
  }, [taxPercent, setTaxPercent]);

  // Inactivity timeout
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        resetKiosk();
        router.replace("/kiosk");
      }, 2 * 60 * 1000); 
    };
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(e => document.addEventListener(e, resetTimer));
    resetTimer(); // init
    return () => {
      clearTimeout(timeoutId);
      events.forEach(e => document.removeEventListener(e, resetTimer));
    };
  }, [resetKiosk, router]);

  const cartItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cart.reduce((acc, item) => {
    const itemBasePrice = Number(item.price);
    const optionsPrice = item.options.reduce((a, b) => a + (Number(b.price) * b.quantity), 0);
    return acc + ((itemBasePrice + optionsPrice) * item.quantity);
  }, 0);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col lg:flex-row h-full w-full bg-zinc-50 dark:bg-zinc-950 relative overflow-hidden">
      <OrderFlowModal tables={tables} />
      
      {/* Mobile Header (Hidden on Desktop) */}
      <div className="lg:hidden flex flex-col bg-white dark:bg-zinc-950 border-b z-30 pt-safe-top">
        <div className="flex items-center justify-between p-4 h-16">
          <Button 
            variant="ghost" 
            size="icon" 
            className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800"
            onClick={() => {
              resetKiosk();
              router.replace("/kiosk");
            }}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <h1 className="text-xl font-bold tracking-tight absolute left-1/2 -translate-x-1/2 truncate max-w-[200px]">
            {restaurantName}
          </h1>

          <Button 
            variant="ghost" 
            size="icon" 
            className="w-10 h-10 rounded-full"
            onClick={() => setIsSearchActive(!isSearchActive)}
          >
            <Search className="w-5 h-5" />
          </Button>
        </div>

        {/* Search Bar (Expandable) */}
        {isSearchActive && (
          <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-200">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                type="text" 
                autoFocus
                placeholder="Search menu..." 
                className="w-full h-12 pl-10 pr-4 rounded-full bg-zinc-100 dark:bg-zinc-900 border-transparent focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden relative">
        
        {/* Desktop Header/Back Button */}
        <Button 
          variant="outline" 
          size="icon" 
          className="hidden lg:flex absolute top-6 left-6 z-50 rounded-full bg-white dark:bg-zinc-950 shadow-md w-12 h-12 border-zinc-200 dark:border-zinc-800 hover:scale-105 transition-transform"
          onClick={() => {
            resetKiosk();
            router.replace("/kiosk");
          }}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        {/* Category Navigation */}
        <div className="z-20 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md lg:bg-transparent lg:backdrop-blur-none shrink-0 lg:pt-24 lg:w-[240px]">
          <CategorySidebar 
            categories={categories}
            activeCategoryId={activeCategoryId}
            onSelectCategory={setActiveCategoryId}
          />
        </div>
        
        {/* Product Grid Area */}
        <div className="flex-1 flex flex-col relative overflow-hidden bg-zinc-50 dark:bg-zinc-950">
          <div className="absolute top-0 left-0 w-full p-8 pb-4 z-10 bg-gradient-to-b from-zinc-50 to-transparent dark:from-zinc-950 pointer-events-none hidden lg:block">
            <h1 className="text-4xl font-black text-zinc-900 dark:text-white drop-shadow-sm ml-[120px] tracking-tight">{restaurantName}</h1>
          </div>
          
          <ProductGrid 
            products={filteredProducts}
            activeCategoryId={activeCategoryId}
            onProductClick={setSelectedProduct}
          />
        </div>
      </div>

      {/* Desktop Persistent Cart Sidebar */}
      <CartSidebarDesktop />

      {/* Mobile Sticky Cart Trigger & Sheet */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-200 dark:border-zinc-800 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] z-40 pb-[env(safe-area-inset-bottom)]">
        <div className="p-4">
          <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
            <SheetTrigger render={
              <Button size="lg" className="w-full h-16 text-lg rounded-full flex justify-between px-6 shadow-xl shadow-primary/25 active:scale-[0.98] transition-all">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <ShoppingBag className="w-6 h-6"/> 
                    {cartItemsCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-white text-primary text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm">
                        {cartItemsCount}
                      </span>
                    )}
                  </div>
                  <span className="font-semibold">{cartItemsCount} {cartItemsCount === 1 ? 'item' : 'items'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-xl">₹{cartTotal.toFixed(2)}</span>
                  <span className="text-sm font-medium opacity-80 uppercase tracking-wider">View Cart</span>
                </div>
              </Button>
            } />
            <SheetContent side="bottom" className="h-[90dvh] p-0 flex flex-col rounded-t-[2.5rem] bg-white dark:bg-zinc-950 shadow-2xl border-t-0 overflow-hidden">
              <SheetTitle className="sr-only">Your Cart</SheetTitle>
              <div className="w-12 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full mx-auto mt-3 mb-1 shrink-0" />
              <CartSidebarContent />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <ProductDetailModal 
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
}
