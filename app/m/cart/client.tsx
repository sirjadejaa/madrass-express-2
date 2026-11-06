"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMobileCartStore } from "@/lib/store/mobile-cart-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import {
  ArrowLeft,
  Plus,
  Minus,
  Trash2,
  Tag,
  ArrowRight,
  ShoppingBag,
  MapPin,
  Check,
  Receipt,
} from "lucide-react";

export function CartClient() {
  const router = useRouter();
  const { toast } = useToast();

  const cart = useMobileCartStore((state) => state.cart);
  const updateQuantity = useMobileCartStore((state) => state.updateQuantity);
  const tableName = useMobileCartStore((state) => state.tableName) || "Table";
  const restaurantId = useMobileCartStore((state) => state.restaurantId);
  const appliedCouponCode = useMobileCartStore((state) => state.appliedCouponCode);
  const discountAmount = useMobileCartStore((state) => state.discountAmount);
  const applyCoupon = useMobileCartStore((state) => state.applyCoupon);
  const removeCoupon = useMobileCartStore((state) => state.removeCoupon);
  const taxPercent = useMobileCartStore((state) => state.taxPercent) || 5.0;

  const [couponInput, setCouponInput] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  // Price calculations
  const subtotal = cart.reduce((sum, item) => {
    const optsPrice = item.options.reduce((s, o) => s + o.price * o.quantity, 0);
    return sum + (item.price + optsPrice) * item.quantity;
  }, 0);

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const tax = Number((taxableAmount * (taxPercent / 100)).toFixed(2));
  const finalTotal = Number((taxableAmount + tax).toFixed(2));

  // Handle coupon validation
  const handleApplyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    setIsValidatingCoupon(true);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          restaurantId,
          orderAmount: subtotal,
        }),
      });

      const data = await res.json();
      if (data.valid) {
        applyCoupon(code, data.discountAmount);
        setCouponInput("");
        toast({
          title: "Coupon Applied!",
          description: `Saved ₹${data.discountAmount} with code ${code}.`,
        });
      } else {
        toast({
          title: "Invalid Coupon",
          description: data.message || "This coupon cannot be applied.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to validate coupon.",
        variant: "destructive",
      });
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    toast({
      title: "Coupon Removed",
      description: "Coupon discount was removed from your cart.",
    });
  };

  if (cart.length === 0) {
    return (
      <div className="flex-1 flex flex-col justify-between p-6 min-h-[85vh]">
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => router.push("/m/menu")}
            className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-700 hover:bg-zinc-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-black text-xl text-zinc-950 tracking-tight">
            Your Cart
          </h1>
        </div>

        <div className="my-auto py-12 text-center space-y-4">
          <div className="w-20 h-20 rounded-3xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <div className="space-y-1.5 max-w-xs mx-auto">
            <h2 className="text-xl font-black text-zinc-900 tracking-tight">
              Your cart is empty
            </h2>
            <p className="text-xs text-zinc-500 font-medium">
              Explore our freshly prepared South Indian specialties and add your favorites.
            </p>
          </div>
        </div>

        <Button
          onClick={() => router.push("/m/menu")}
          size="lg"
          className="w-full h-14 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-base rounded-2xl shadow-lg shadow-amber-600/20"
        >
          Explore Menu
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-stone-50 pb-28">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-zinc-100 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/m/menu")}
            className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-700 hover:bg-zinc-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-black text-lg text-zinc-950 tracking-tight">
              Your Cart
            </h1>
            <p className="text-[10px] font-semibold text-zinc-400">
              {cart.reduce((s, i) => s + i.quantity, 0)} items selected
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-zinc-950 text-white font-extrabold text-xs px-3 py-1.5 rounded-full shadow-sm">
          <MapPin className="w-3.5 h-3.5 text-amber-400" />
          Table {tableName}
        </div>
      </header>

      {/* Cart Content */}
      <main className="p-4 space-y-4">
        {/* Cart Item Cards */}
        <div className="bg-white rounded-3xl p-4 border border-zinc-100 shadow-sm space-y-4 divide-y divide-zinc-100">
          {cart.map((item) => {
            const itemOptionsTotal = item.options.reduce(
              (sum, opt) => sum + opt.price * opt.quantity,
              0
            );
            const lineItemTotal = (item.price + itemOptionsTotal) * item.quantity;

            return (
              <div key={item.id} className="pt-3 first:pt-0 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <div
                        className={`w-3 h-3 border-2 flex items-center justify-center rounded-sm bg-white shrink-0 ${
                          item.isVegetarian ? "border-emerald-600" : "border-red-600"
                        }`}
                      >
                        <div
                          className={`w-1 h-1 rounded-full ${
                            item.isVegetarian ? "bg-emerald-600" : "bg-red-600"
                          }`}
                        />
                      </div>
                      <h4 className="font-extrabold text-sm text-zinc-900 truncate">
                        {item.name}
                      </h4>
                    </div>

                    {/* Options list */}
                    {item.options.length > 0 && (
                      <p className="text-[11px] text-zinc-500 font-medium pl-4">
                        {item.options
                          .map((o) => `${o.name}${o.quantity > 1 ? ` x${o.quantity}` : ""}`)
                          .join(", ")}
                      </p>
                    )}

                    {/* Notes */}
                    {item.notes && (
                      <p className="text-[10px] text-amber-700 italic pl-4 font-medium">
                        "{item.notes}"
                      </p>
                    )}
                  </div>

                  {/* Line Total */}
                  <div className="text-right shrink-0">
                    <span className="font-black text-sm text-zinc-950">
                      ₹{lineItemTotal}
                    </span>
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center justify-between pt-1 pl-4">
                  <span className="text-[11px] text-zinc-400 font-medium">
                    ₹{item.price + itemOptionsTotal} each
                  </span>

                  <div className="flex items-center gap-2 bg-zinc-100 border border-zinc-200/80 rounded-xl px-2 py-0.5">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-zinc-700 hover:bg-white transition-colors"
                    >
                      {item.quantity === 1 ? (
                        <Trash2 className="w-3.5 h-3.5 text-red-600" />
                      ) : (
                        <Minus className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <span className="font-black text-xs min-w-[16px] text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-zinc-700 hover:bg-white transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add more items link */}
        <button
          onClick={() => router.push("/m/menu")}
          className="w-full py-3 text-center text-xs font-bold text-amber-700 bg-amber-500/10 border border-amber-500/20 rounded-2xl hover:bg-amber-500/20 transition-colors flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add More Dishes
        </button>

        {/* Coupon Code Section */}
        <div className="bg-white rounded-3xl p-4 border border-zinc-100 shadow-sm space-y-2.5">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-amber-600" />
            <span className="font-extrabold text-xs text-zinc-900">
              Apply Restaurant Coupon
            </span>
          </div>

          {appliedCouponCode ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <div>
                  <span className="font-black text-xs text-emerald-950 uppercase tracking-wider">
                    {appliedCouponCode}
                  </span>
                  <p className="text-[10px] text-emerald-700 font-semibold">
                    Saved ₹{discountAmount} on this order
                  </p>
                </div>
              </div>
              <button
                onClick={handleRemoveCoupon}
                className="text-xs font-bold text-red-600 hover:text-red-700 p-1"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                placeholder="ENTER COUPON CODE"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                className="text-xs uppercase font-bold tracking-wider bg-zinc-50 border-zinc-200 rounded-xl h-10"
              />
              <Button
                onClick={handleApplyCoupon}
                disabled={isValidatingCoupon || !couponInput.trim()}
                className="h-10 px-4 bg-zinc-900 hover:bg-zinc-800 text-white font-extrabold text-xs rounded-xl"
              >
                {isValidatingCoupon ? "Checking..." : "Apply"}
              </Button>
            </div>
          )}
        </div>

        {/* Bill Breakdown */}
        <div className="bg-white rounded-3xl p-4 border border-zinc-100 shadow-sm space-y-2.5">
          <div className="flex items-center gap-2 pb-1 border-b border-zinc-100">
            <Receipt className="w-4 h-4 text-zinc-500" />
            <span className="font-extrabold text-xs text-zinc-900">
              Bill Summary
            </span>
          </div>

          <div className="space-y-1.5 text-xs text-zinc-600 font-medium">
            <div className="flex justify-between">
              <span>Item Subtotal</span>
              <span className="font-bold text-zinc-900">₹{subtotal}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>Coupon Discount ({appliedCouponCode})</span>
                <span>-₹{discountAmount}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span>Taxes & GST ({taxPercent}%)</span>
              <span className="font-bold text-zinc-900">₹{tax}</span>
            </div>

            <div className="pt-2 border-t border-zinc-100 flex justify-between items-center text-sm font-black text-zinc-950">
              <span>To Pay</span>
              <span className="text-base text-amber-700">₹{finalTotal}</span>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Sticky Checkout CTA */}
      <div className="fixed bottom-3 left-0 right-0 max-w-md mx-auto px-4 z-40">
        <Button
          onClick={() => router.push("/m/checkout")}
          className="w-full h-14 bg-amber-600 hover:bg-amber-700 text-white font-black text-base rounded-2xl shadow-xl shadow-amber-600/30 flex items-center justify-between px-6 active:scale-[0.99] transition-all"
        >
          <span>Proceed to Checkout</span>
          <div className="flex items-center gap-1.5">
            <span>₹{finalTotal}</span>
            <ArrowRight className="w-5 h-5" />
          </div>
        </Button>
      </div>
    </div>
  );
}
