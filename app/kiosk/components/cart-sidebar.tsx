"use client";

import { useKioskStore } from "@/lib/store/kiosk-store";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";

export function CartSidebarContent() {
  const router = useRouter();
  const { cart, orderType, tableName, updateQuantity, removeFromCart, clearCart, taxPercent } = useKioskStore();

  const subtotal = cart.reduce((sum, item) => {
    const itemBasePrice = Number(item.price);
    const optionsPrice = item.options.reduce((a, b) => a + (Number(b.price) * b.quantity), 0);
    return sum + ((itemBasePrice + optionsPrice) * item.quantity);
  }, 0);

  const tax = subtotal * (taxPercent / 100);
  const total = subtotal + tax;

  const handleCheckout = () => {
    router.push('/kiosk/checkout');
  };

  if (cart.length === 0) {
    return (
      <div className="w-full h-full bg-zinc-50 dark:bg-zinc-950 flex flex-col">
        <div className="p-6 bg-white dark:bg-zinc-950 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
          <h2 className="text-2xl font-bold flex items-center gap-3 text-zinc-900 dark:text-white">
            <ShoppingBag className="w-6 h-6 text-primary" /> Your Order
          </h2>
          {orderType && (
            <p className="text-sm font-semibold text-zinc-500 mt-2">
              {orderType === "DINE_IN" ? `Dine In • Table ${tableName}` : "Takeaway"}
            </p>
          )}
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-5">
          <div className="w-24 h-24 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-2 shadow-inner">
            <ShoppingBag className="w-10 h-10 text-zinc-300 dark:text-zinc-700" />
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Your cart is empty</p>
          <p className="text-zinc-500 max-w-[200px]">Add some delicious items from the menu to get started!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-zinc-50 dark:bg-zinc-950 flex flex-col z-20 shrink-0">
      <div className="p-5 sm:p-6 bg-white dark:bg-zinc-950 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-start shrink-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-3 text-zinc-900 dark:text-white tracking-tight">
            <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-primary" /> Your Order
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1.5 font-semibold">
            {orderType === "DINE_IN" ? `Dine In • Table ${tableName}` : "Takeaway"}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={clearCart} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-full px-4 font-bold">
          Clear
        </Button>
      </div>

      <ScrollArea className="flex-1 px-4 sm:px-5 py-4">
        <div className="space-y-4 pr-3">
          {cart.map((item) => {
            const itemPrice = Number(item.price);
            const optionsPrice = item.options.reduce((sum, a) => sum + (Number(a.price) * a.quantity), 0);
            const itemTotal = (itemPrice + optionsPrice) * item.quantity;

            return (
              <div key={item.id} className={`p-4 sm:p-5 border border-zinc-200 dark:border-zinc-800 rounded-3xl bg-white dark:bg-zinc-900 shadow-sm space-y-4 relative ${item.isAvailable === false ? 'opacity-60 grayscale' : ''}`}>
                <div className="flex justify-between items-start gap-3">
                  <h4 className="font-bold text-lg leading-tight text-zinc-900 dark:text-zinc-50">{item.name}</h4>
                  <span className="font-black text-lg">₹{itemTotal.toFixed(2)}</span>
                </div>
                
                {item.options.length > 0 && (
                  <div className="text-sm text-zinc-500 dark:text-zinc-400 flex flex-col gap-1.5">
                    {item.options.map(o => (
                      <span key={o.optionId} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                        {o.quantity > 1 ? `${o.quantity}x ` : ''}{o.name}
                      </span>
                    ))}
                  </div>
                )}
                
                {item.notes && (
                  <div className="text-sm italic text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/50 p-3 rounded-xl border border-orange-100 dark:border-orange-900/50">
                    "{item.notes}"
                  </div>
                )}

                {item.isAvailable === false && (
                  <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm px-3 py-2 rounded-xl font-bold flex items-center justify-center border border-red-200 dark:border-red-900/30 uppercase tracking-wider">
                    Sold Out
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-full p-1 border border-zinc-200 dark:border-zinc-700">
                    <button
                      className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-white dark:hover:bg-zinc-700 hover:shadow-sm transition-all text-zinc-600 dark:text-zinc-300"
                      onClick={() => item.quantity > 1 ? updateQuantity(item.id, item.quantity - 1) : removeFromCart(item.id)}
                    >
                      {item.quantity === 1 ? <Trash2 className="w-4 h-4 text-red-500" /> : <Minus className="w-4 h-4" />}
                    </button>
                    <span className="w-10 text-center font-bold text-lg select-none">{item.quantity}</span>
                    <button
                      className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-white dark:hover:bg-zinc-700 hover:shadow-sm transition-all text-zinc-600 dark:text-zinc-300"
                      disabled={item.isAvailable === false}
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <div className="p-5 sm:p-6 bg-white dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-800 shrink-0">
        <div className="space-y-3 mb-6 text-sm sm:text-base font-medium">
          <div className="flex justify-between text-zinc-500">
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-zinc-500">
            <span>Taxes ({taxPercent}%)</span>
            <span>₹{tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xl sm:text-2xl font-black pt-4 border-t border-zinc-100 dark:border-zinc-800 text-zinc-900 dark:text-white">
            <span>Total</span>
            <span className="text-primary">₹{total.toFixed(2)}</span>
          </div>
        </div>
        <Button 
          size="lg" 
          className="w-full h-16 text-xl sm:text-2xl font-bold rounded-full shadow-[0_8px_30px_rgb(234,88,12,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all" 
          onClick={handleCheckout} 
          disabled={cart.some(item => item.isAvailable === false) || cart.length === 0}
        >
          Checkout
        </Button>
      </div>
    </div>
  );
}

export function CartSidebarDesktop() {
  return (
    <div className="hidden lg:flex w-[380px] border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex-col h-full shadow-2xl shrink-0 z-30 relative">
      <CartSidebarContent />
    </div>
  );
}
