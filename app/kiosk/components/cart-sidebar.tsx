"use client";

import { useKioskStore } from "@/lib/store/kiosk-store";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";

export function CartSidebar() {
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
      <div className="w-80 lg:w-96 border-l bg-card flex flex-col h-full">
        <div className="p-6 bg-muted/50 border-b">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingBag className="w-6 h-6" /> Your Order
          </h2>
          {orderType && (
            <p className="text-sm text-muted-foreground mt-1">
              {orderType === "DINE_IN" ? `Dine In • Table ${tableName}` : "Takeaway"}
            </p>
          )}
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground space-y-4">
          <ShoppingBag className="w-16 h-16 opacity-20" />
          <p className="text-xl font-medium">Your cart is empty</p>
          <p className="text-sm">Add some delicious items from the menu!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 lg:w-96 border-l bg-card flex flex-col h-full shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.1)] z-20">
      <div className="p-6 bg-muted/50 border-b flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingBag className="w-6 h-6" /> Your Order
          </h2>
          <p className="text-sm text-muted-foreground mt-1 font-medium">
            {orderType === "DINE_IN" ? `Dine In • Table ${tableName}` : "Takeaway"}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={clearCart} className="text-destructive hover:text-destructive hover:bg-destructive/10">
          Clear
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 pr-3">
          {cart.map((item) => {
            const itemPrice = Number(item.price);
            const optionsPrice = item.options.reduce((sum, a) => sum + (Number(a.price) * a.quantity), 0);
            const itemTotal = (itemPrice + optionsPrice) * item.quantity;

            return (
              <div key={item.id} className={`p-4 border rounded-2xl bg-background shadow-sm space-y-3 relative ${item.isAvailable === false ? 'opacity-60 grayscale' : ''}`}>
                <div className="flex justify-between items-start gap-2">
                  <h4 className="font-bold text-lg leading-tight">{item.name}</h4>
                  <span className="font-bold">₹{itemTotal.toFixed(2)}</span>
                </div>
                
                {item.options.length > 0 && (
                  <div className="text-sm text-muted-foreground flex flex-col gap-1">
                    {item.options.map(o => (
                      <span key={o.optionId}>
                        + {o.quantity > 1 ? `${o.quantity}x ` : ''}{o.name}
                      </span>
                    ))}
                  </div>
                )}
                
                {item.notes && (
                  <div className="text-sm italic text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 p-2 rounded-md">
                    Note: {item.notes}
                  </div>
                )}

                {item.isAvailable === false && (
                  <div className="bg-destructive/10 text-destructive text-sm px-3 py-1.5 rounded-lg font-bold flex items-center justify-center border border-destructive/20 uppercase tracking-wider">
                    Sold Out
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center bg-muted rounded-xl">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10"
                      onClick={() => item.quantity > 1 ? updateQuantity(item.id, item.quantity - 1) : removeFromCart(item.id)}
                    >
                      {item.quantity === 1 ? <Trash2 className="w-4 h-4 text-destructive" /> : <Minus className="w-4 h-4" />}
                    </Button>
                    <span className="w-10 text-center font-bold text-lg">{item.quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10"
                      disabled={item.isAvailable === false}
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <div className="p-6 bg-background border-t shadow-[0_-10px_20px_-15px_rgba(0,0,0,0.1)]">
        <div className="space-y-2 mb-6">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Taxes ({taxPercent}%)</span>
            <span>₹{tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-2xl font-black pt-2 border-t">
            <span>Total</span>
            <span className="text-primary">₹{total.toFixed(2)}</span>
          </div>
        </div>
        <Button size="lg" className="w-full h-16 text-2xl rounded-2xl shadow-lg hover:scale-[1.02] transition-transform" onClick={handleCheckout} disabled={cart.some(item => item.isAvailable === false)}>
          Checkout
        </Button>
      </div>
    </div>
  );
}
