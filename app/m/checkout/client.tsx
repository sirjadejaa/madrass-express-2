"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMobileCartStore } from "@/lib/store/mobile-cart-store";
import { submitMobileOrderAction } from "./actions";
import { OrderType, PaymentMethod } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
  ArrowLeft,
  MapPin,
  ShoppingBag,
  CreditCard,
  Banknote,
  CheckCircle2,
  UtensilsCrossed,
  ShieldCheck,
  AlertCircle,
  Loader2,
} from "lucide-react";

export function CheckoutClient() {
  const router = useRouter();
  const { toast } = useToast();

  const cart = useMobileCartStore((state) => state.cart);
  const restaurantId = useMobileCartStore((state) => state.restaurantId);
  const tableId = useMobileCartStore((state) => state.tableId);
  const tableName = useMobileCartStore((state) => state.tableName) || "Table";
  const orderType = useMobileCartStore((state) => state.orderType);
  const setOrderType = useMobileCartStore((state) => state.setOrderType);
  const appliedCouponCode = useMobileCartStore((state) => state.appliedCouponCode);
  const discountAmount = useMobileCartStore((state) => state.discountAmount);
  const taxPercent = useMobileCartStore((state) => state.taxPercent) || 5.0;
  const storeCustomerName = useMobileCartStore((state) => state.customerName);
  const storeCustomerPhone = useMobileCartStore((state) => state.customerPhone);
  const setCustomerInfo = useMobileCartStore((state) => state.setCustomerInfo);
  const clearCart = useMobileCartStore((state) => state.clearCart);
  const idempotencyKey = useMobileCartStore((state) => state.idempotencyKey);
  const regenerateIdempotencyKey = useMobileCartStore((state) => state.regenerateIdempotencyKey);

  // Form states
  const [customerName, setCustomerName] = useState(storeCustomerName || "");
  const [customerPhone, setCustomerPhone] = useState(storeCustomerPhone || "");
  const [payAtCounter, setPayAtCounter] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Totals
  const subtotal = cart.reduce((sum, item) => {
    const optsPrice = item.options.reduce((s, o) => s + o.price * o.quantity, 0);
    return sum + (item.price + optsPrice) * item.quantity;
  }, 0);

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const tax = Number((taxableAmount * (taxPercent / 100)).toFixed(2));
  const finalTotal = Number((taxableAmount + tax).toFixed(2));

  if (cart.length === 0) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center p-8 text-center min-h-[70vh] space-y-4">
        <ShoppingBag className="w-12 h-12 text-zinc-300" />
        <h2 className="text-xl font-bold">Your cart is empty</h2>
        <Button onClick={() => router.push("/m/menu")} className="bg-amber-600 text-white">
          Return to Menu
        </Button>
      </div>
    );
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanName = customerName.trim();
    const cleanPhone = customerPhone.trim();

    if (!cleanName) {
      setErrorMessage("Please enter your name.");
      return;
    }

    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMessage("Please enter a valid 10-digit phone number.");
      return;
    }

    if (orderType === OrderType.DINE_IN && !tableId) {
      setErrorMessage("Table information is missing. Please re-scan your table QR code.");
      return;
    }

    if (!restaurantId) {
      setErrorMessage("Restaurant configuration is missing. Please re-scan your table QR code.");
      return;
    }

    setIsSubmitting(true);
    setCustomerInfo(cleanName, cleanPhone);

    try {
      const formattedCart = cart.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        notes: item.notes,
        options: item.options.map((opt) => ({
          optionId: opt.optionId,
          quantity: opt.quantity,
        })),
      }));

      const result = await submitMobileOrderAction({
        idempotencyKey,
        restaurantId,
        customerName: cleanName,
        customerPhone: cleanPhone,
        orderType,
        tableId: orderType === OrderType.DINE_IN ? tableId : null,
        cart: formattedCart,
        couponCode: appliedCouponCode,
        paymentMethod: payAtCounter ? PaymentMethod.CASH : PaymentMethod.UPI,
        payAtCounter,
      });

      if (result.error) {
        setErrorMessage(result.error);
        setIsSubmitting(false);
        return;
      }

      if (result.success && result.trackingToken) {
        // Clear mobile cart and reset idempotency key for next order
        clearCart();
        regenerateIdempotencyKey();

        toast({
          title: "Order Placed Successfully!",
          description: `Token #${result.tokenNumber} sent to kitchen.`,
        });

        // Navigate to secure tracking page
        router.push(`/m/order/${result.trackingToken}`);
      } else {
        setErrorMessage("Unexpected response from order server. Please check with staff.");
        setIsSubmitting(false);
      }
    } catch (err: any) {
      console.error("Order error:", err);
      setErrorMessage("Network error placing order. Please try again or pay at counter.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-stone-50 pb-28">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-zinc-100 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/m/cart")}
            className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-700 hover:bg-zinc-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-black text-lg text-zinc-950 tracking-tight">
            Checkout
          </h1>
        </div>

        {orderType === OrderType.DINE_IN && (
          <div className="flex items-center gap-1.5 bg-zinc-950 text-white font-extrabold text-xs px-3 py-1.5 rounded-full shadow-sm">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            Table {tableName}
          </div>
        )}
      </header>

      <form onSubmit={handlePlaceOrder} className="p-4 space-y-4">
        {/* Error Notice */}
        {errorMessage && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Order Type Toggle (Dine-In locked or Takeaway) */}
        <div className="bg-white rounded-3xl p-4 border border-zinc-100 shadow-sm space-y-3">
          <span className="font-extrabold text-xs text-zinc-900 block">
            Order Type
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setOrderType(OrderType.DINE_IN)}
              className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-2.5 ${
                orderType === OrderType.DINE_IN
                  ? "bg-amber-50 border-amber-500/50 shadow-sm"
                  : "bg-white border-zinc-200 text-zinc-600"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                  orderType === OrderType.DINE_IN
                    ? "bg-amber-600 text-white"
                    : "bg-zinc-100 text-zinc-500"
                }`}
              >
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="font-black text-xs text-zinc-950">Dine-In</p>
                <p className="text-[10px] text-zinc-500 font-medium truncate">
                  At Table {tableName}
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setOrderType(OrderType.TAKEAWAY)}
              className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-2.5 ${
                orderType === OrderType.TAKEAWAY
                  ? "bg-amber-50 border-amber-500/50 shadow-sm"
                  : "bg-white border-zinc-200 text-zinc-600"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                  orderType === OrderType.TAKEAWAY
                    ? "bg-amber-600 text-white"
                    : "bg-zinc-100 text-zinc-500"
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="font-black text-xs text-zinc-950">Takeaway</p>
                <p className="text-[10px] text-zinc-500 font-medium">
                  Pack to go
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Customer Information */}
        <div className="bg-white rounded-3xl p-4 border border-zinc-100 shadow-sm space-y-3">
          <span className="font-extrabold text-xs text-zinc-900 block">
            Your Details (for Order Updates)
          </span>

          <div className="space-y-1.5">
            <Label htmlFor="cust-name" className="text-xs font-bold text-zinc-700">
              Your Name *
            </Label>
            <Input
              id="cust-name"
              placeholder="e.g., Ananya Sharma"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="text-xs bg-zinc-50 border-zinc-200 rounded-xl h-11"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cust-phone" className="text-xs font-bold text-zinc-700">
              Phone Number *
            </Label>
            <Input
              id="cust-phone"
              type="tel"
              placeholder="10-digit mobile number"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="text-xs bg-zinc-50 border-zinc-200 rounded-xl h-11"
              maxLength={10}
              required
            />
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="bg-white rounded-3xl p-4 border border-zinc-100 shadow-sm space-y-3">
          <span className="font-extrabold text-xs text-zinc-900 block">
            Payment Method
          </span>

          <div className="space-y-2">
            {/* Pay at Counter option */}
            <div
              onClick={() => setPayAtCounter(true)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                payAtCounter
                  ? "bg-amber-50 border-amber-500/50 shadow-sm"
                  : "bg-white border-zinc-200 hover:border-zinc-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    payAtCounter
                      ? "bg-amber-600 text-white"
                      : "bg-zinc-100 text-zinc-600"
                  }`}
                >
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-black text-xs text-zinc-950">
                    Pay at Billing Counter
                  </p>
                  <p className="text-[10px] text-zinc-500 font-medium">
                    Cash or UPI card at the cashier desk
                  </p>
                </div>
              </div>
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  payAtCounter
                    ? "border-amber-600 bg-amber-600 text-white"
                    : "border-zinc-300"
                }`}
              >
                {payAtCounter && <CheckCircle2 className="w-3.5 h-3.5" />}
              </div>
            </div>

            {/* Online UPI option */}
            <div
              onClick={() => setPayAtCounter(false)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                !payAtCounter
                  ? "bg-amber-50 border-amber-500/50 shadow-sm"
                  : "bg-white border-zinc-200 hover:border-zinc-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    !payAtCounter
                      ? "bg-amber-600 text-white"
                      : "bg-zinc-100 text-zinc-600"
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-black text-xs text-zinc-950">
                    Online UPI (GPay / PhonePe / Paytm)
                  </p>
                  <p className="text-[10px] text-zinc-500 font-medium">
                    Instant online payment
                  </p>
                </div>
              </div>
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  !payAtCounter
                    ? "border-amber-600 bg-amber-600 text-white"
                    : "border-zinc-300"
                }`}
              >
                {!payAtCounter && <CheckCircle2 className="w-3.5 h-3.5" />}
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary & Security Note */}
        <div className="bg-white rounded-3xl p-4 border border-zinc-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-600">
            <span>Dishes ({cart.reduce((s, i) => s + i.quantity, 0)})</span>
            <span className="font-bold text-zinc-900">₹{subtotal}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex items-center justify-between text-xs text-emerald-600 font-bold">
              <span>Coupon Discount ({appliedCouponCode})</span>
              <span>-₹{discountAmount}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-xs text-zinc-600">
            <span>Taxes & GST ({taxPercent}%)</span>
            <span className="font-bold text-zinc-900">₹{tax}</span>
          </div>
          <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-sm font-black text-zinc-950">
            <span>Grand Total</span>
            <span className="text-base text-amber-700">₹{finalTotal}</span>
          </div>
        </div>

        <div className="text-[11px] text-zinc-400 text-center font-medium flex items-center justify-center gap-1.5 pt-1">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Orders are sent directly to the kitchen display</span>
        </div>

        {/* Bottom Sticky Submit Button */}
        <div className="fixed bottom-3 left-0 right-0 max-w-md mx-auto px-4 z-40">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-14 bg-amber-600 hover:bg-amber-700 text-white font-black text-base rounded-2xl shadow-xl shadow-amber-600/30 flex items-center justify-center gap-2 active:scale-[0.99] transition-all"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Sending to Kitchen...</span>
              </>
            ) : (
              <span>Place Order • ₹{finalTotal}</span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
