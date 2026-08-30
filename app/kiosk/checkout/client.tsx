"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useKioskStore } from "@/lib/store/kiosk-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, CheckCircle2, AlertCircle, Tag, X } from "lucide-react";
import { processCheckoutAction } from "./actions";
import { useToast } from "@/components/ui/use-toast";
import { OrderType } from "@prisma/client";

interface CheckoutClientProps {
  tables: { id: string, number: string }[];
  restaurantId: string;
  taxPercent: number;
}

export function CheckoutClient({ tables, restaurantId, taxPercent }: CheckoutClientProps) {
  const router = useRouter();
  const { cart, orderType, tableId, tableName, setOrderType, setTable, setTaxPercent, appliedCouponCode, discountAmount, applyCoupon, removeCoupon } = useKioskStore();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  useEffect(() => {
    // Generate unique key on mount for idempotency
    setIdempotencyKey(crypto.randomUUID());
  }, []);

  useEffect(() => {
    setTaxPercent(taxPercent);
    if (cart.length === 0) {
      router.push("/kiosk/menu");
    }
  }, [cart, router, taxPercent, setTaxPercent]);

  if (cart.length === 0) return null;

  const subtotal = cart.reduce((sum, item) => {
    const itemBasePrice = Number(item.price);
    const optionsPrice = item.options.reduce((a, b) => a + (Number(b.price) * b.quantity), 0);
    return sum + ((itemBasePrice + optionsPrice) * item.quantity);
  }, 0);

  // Calculate tax on the discounted subtotal
  const taxableSubtotal = Math.max(0, subtotal - discountAmount);
  const tax = taxableSubtotal * (taxPercent / 100);
  const total = taxableSubtotal + tax;

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setIsApplyingCoupon(true);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponInput.trim(), cartTotal: subtotal })
      });
      const data = await res.json();
      if (data.success) {
        applyCoupon(data.code, data.discountAmount);
        setCouponInput("");
        toast({ title: "Coupon Applied", description: `You saved ₹${data.discountAmount}` });
      } else {
        toast({ title: "Invalid Coupon", description: data.error, variant: "destructive" });
        removeCoupon();
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to apply coupon", variant: "destructive" });
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleCheckout = async () => {
    setErrors([]);
    const newErrors = [];
    
    if (!name.trim()) newErrors.push("Name is required.");
    if (!phone.trim() || phone.trim().length < 10) newErrors.push("Valid mobile number is required.");
    if (orderType === OrderType.DINE_IN && !tableId) newErrors.push("Table number is required for Dine-In.");
    if (!orderType) newErrors.push("Order type is required.");

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await processCheckoutAction({
        idempotencyKey,
        restaurantId,
        customerName: name,
        customerPhone: phone,
        orderType: orderType!,
        tableId: tableId || undefined,
        cart,
        subtotal,
        tax,
        total,
        couponCode: appliedCouponCode || undefined,
        discountAmount,
      });

      if (result.error) {
        toast({ title: "Checkout Failed", description: result.error, variant: "destructive" });
        if (result.unavailableProductIds) {
          useKioskStore.getState().markItemsUnavailable(result.unavailableProductIds);
        }
        setIsSubmitting(false);
      } else {
        toast({ title: "Order processing..." });
        // Route to payment screen, do NOT clear cart yet (clearing happens on success)
        router.push(`/kiosk/payment/${result.orderId}`); 
      }
    } catch (e) {
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-full flex-col lg:flex-row p-6 gap-8 max-w-7xl mx-auto">
      
      {/* Left Column: Form */}
      <div className="flex-1 flex flex-col bg-background rounded-3xl p-8 shadow-sm overflow-y-auto">
        <Button variant="ghost" className="self-start mb-6 text-muted-foreground" onClick={() => router.push("/kiosk/menu")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Menu
        </Button>
        
        <h2 className="text-3xl font-bold mb-8">Customer Details</h2>

        {errors.length > 0 && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-xl mb-6">
            <div className="flex items-center gap-2 font-bold mb-2">
              <AlertCircle className="h-5 w-5" /> Please fix the following:
            </div>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              {errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        )}

        <div className="space-y-8 flex-1">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-lg">Full Name <span className="text-destructive">*</span></Label>
              <Input 
                className="h-14 text-lg rounded-xl" 
                placeholder="e.g. John Doe"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-lg">Mobile Number <span className="text-destructive">*</span></Label>
              <Input 
                className="h-14 text-lg rounded-xl" 
                placeholder="e.g. 9876543210"
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/[^0-9+]/g, ''))}
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-lg">Order Type</Label>
            <div className="grid grid-cols-2 gap-4">
              <div 
                className={`border-2 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors ${orderType === OrderType.DINE_IN ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:bg-muted/50'}`}
                onClick={() => setOrderType(OrderType.DINE_IN)}
              >
                <span className="text-xl font-bold">Dine In</span>
              </div>
              <div 
                className={`border-2 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors ${orderType === OrderType.TAKEAWAY ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:bg-muted/50'}`}
                onClick={() => setOrderType(OrderType.TAKEAWAY)}
              >
                <span className="text-xl font-bold">Takeaway</span>
              </div>
            </div>
          </div>

          {orderType === OrderType.DINE_IN && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
              <Label className="text-lg">Table Number <span className="text-destructive">*</span></Label>
              <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                {tables.map(t => (
                  <div
                    key={t.id}
                    className={`h-14 flex items-center justify-center rounded-xl cursor-pointer text-lg font-bold transition-all ${tableId === t.id ? 'bg-primary text-primary-foreground shadow-md scale-105' : 'bg-muted hover:bg-muted/80 text-foreground'}`}
                    onClick={() => setTable(t.id, t.number)}
                  >
                    {t.number}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Summary */}
      <div className="w-full lg:w-[450px] flex flex-col bg-card rounded-3xl overflow-hidden shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.1)]">
        <div className="p-6 bg-muted/30 border-b">
          <h3 className="text-2xl font-bold">Order Summary</h3>
        </div>
        
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            {cart.map(item => {
              const itemPrice = Number(item.price);
              const optionsPrice = item.options.reduce((sum, a) => sum + (Number(a.price) * a.quantity), 0);
              const itemTotal = (itemPrice + optionsPrice) * item.quantity;

              return (
                <div key={item.id} className={`space-y-1 relative ${item.isAvailable === false ? 'opacity-60 grayscale' : ''}`}>
                  <div className="flex justify-between font-bold text-lg">
                    <span className="flex gap-2">
                      <span className="text-muted-foreground">{item.quantity}x</span> {item.name}
                    </span>
                    <span>₹{itemTotal.toFixed(2)}</span>
                  </div>
                  {item.options.length > 0 && (
                    <div className="pl-6 text-sm text-muted-foreground">
                      {item.options.map(o => (
                        <div key={o.optionId}>+ {o.quantity > 1 ? `${o.quantity}x ` : ''}{o.name}</div>
                      ))}
                    </div>
                  )}
                  {item.isAvailable === false && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded-md font-bold uppercase">Sold Out</span>
                      <Button variant="outline" size="sm" className="h-6 text-xs text-destructive hover:bg-destructive/10" onClick={() => useKioskStore.getState().removeFromCart(item.id)}>
                        Remove
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <div className="p-6 bg-background border-t space-y-4">
          {!appliedCouponCode ? (
            <div className="flex gap-2">
              <Input 
                placeholder="Got a coupon code?" 
                value={couponInput}
                onChange={e => setCouponInput(e.target.value.toUpperCase())}
                className="uppercase"
              />
              <Button variant="outline" onClick={handleApplyCoupon} disabled={isApplyingCoupon || !couponInput.trim()}>
                Apply
              </Button>
            </div>
          ) : (
            <div className="flex justify-between items-center bg-emerald-50 text-emerald-700 p-3 rounded-lg border border-emerald-200">
              <div className="flex items-center gap-2 font-bold">
                <Tag className="w-4 h-4" />
                {appliedCouponCode} APPLIED
              </div>
              <Button variant="ghost" size="sm" onClick={removeCoupon} className="h-8 w-8 p-0 hover:bg-emerald-100">
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          <div className="space-y-2 pt-4">
            <div className="flex justify-between text-muted-foreground text-lg">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            {appliedCouponCode && (
              <div className="flex justify-between text-emerald-600 font-bold text-lg">
                <span>Discount ({appliedCouponCode})</span>
                <span>-₹{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-muted-foreground text-lg">
              <span>Taxes ({taxPercent}%)</span>
              <span>₹{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-3xl font-black pt-4 border-t">
              <span>Total</span>
              <span className="text-primary">₹{total.toFixed(2)}</span>
            </div>
          </div>
          <Button 
            size="lg" 
            className="w-full h-20 text-2xl rounded-2xl shadow-lg mt-4 flex items-center gap-2"
            onClick={handleCheckout}
            disabled={isSubmitting || cart.some(item => item.isAvailable === false)}
          >
            {isSubmitting ? "Processing..." : "Proceed to Payment"} <CheckCircle2 className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}
