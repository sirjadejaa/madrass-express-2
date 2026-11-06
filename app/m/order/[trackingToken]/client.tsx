"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getOrderTrackingStatus } from "./actions";
import { OrderStatus, PaymentStatus, OrderType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  UtensilsCrossed,
  MapPin,
  CheckCircle2,
  Banknote,
  Receipt,
  RefreshCw,
  ShoppingBag,
  ChefHat,
  BellRing,
} from "lucide-react";

interface OrderTrackingClientProps {
  initialOrder: any;
  trackingToken: string;
}

export function OrderTrackingClient({
  initialOrder,
  trackingToken,
}: OrderTrackingClientProps) {
  const router = useRouter();
  const [order, setOrder] = useState(initialOrder);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Polling for live status updates every 4 seconds
  useEffect(() => {
    // If order is completed or cancelled, stop polling
    if (order.status === OrderStatus.COMPLETED || order.status === OrderStatus.CANCELLED) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await getOrderTrackingStatus(trackingToken);
        if (res.success && res.order) {
          setOrder(res.order);
        }
      } catch {
        // Silent catch for background poll
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [trackingToken, order.status]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await getOrderTrackingStatus(trackingToken);
      if (res.success && res.order) {
        setOrder(res.order);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // Status mapping
  const getStatusStep = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.NEW:
        return 1;
      case OrderStatus.ACCEPTED:
      case OrderStatus.PREPARING:
        return 2;
      case OrderStatus.READY:
        return 3;
      case OrderStatus.COMPLETED:
        return 4;
      default:
        return 1;
    }
  };

  const currentStep = getStatusStep(order.status);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-stone-50 pb-20">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-zinc-100 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-sm">
            <UtensilsCrossed className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-black text-sm tracking-tight text-zinc-950 uppercase leading-none">
              {order.restaurantName}
            </h1>
            <p className="text-[10px] font-semibold text-zinc-400 mt-0.5">
              Live Order Tracker
            </p>
          </div>
        </div>

        <button
          onClick={handleManualRefresh}
          className="text-xs font-bold text-zinc-600 hover:text-zinc-900 bg-zinc-100 px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition-colors"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-amber-600" : ""}`}
          />
          <span>Refresh</span>
        </button>
      </header>

      {/* Main Order Card */}
      <main className="p-4 space-y-4">
        {/* Token Banner Card */}
        <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-md text-center space-y-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600" />

          {/* Token Number */}
          <div className="space-y-1">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-400">
              Your Daily Token
            </span>
            <div className="text-5xl font-black tracking-tight text-zinc-950 drop-shadow-sm">
              #{order.tokenNumber || "—"}
            </div>
          </div>

          {/* Table / Type Badge */}
          <div className="flex items-center justify-center gap-2">
            {order.orderType === OrderType.DINE_IN && order.tableNumber ? (
              <span className="inline-flex items-center gap-1.5 bg-zinc-950 text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-sm">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                Table {order.tableNumber}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-zinc-950 text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-sm">
                <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                Takeaway Order
              </span>
            )}

            {/* Payment Badge */}
            {order.paymentStatus === PaymentStatus.PAID ? (
              <Badge
                variant="outline"
                className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold px-2.5 py-1 text-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Paid
              </Badge>
            ) : order.paymentStatus === PaymentStatus.PAY_AT_COUNTER ? (
              <Badge
                variant="outline"
                className="bg-amber-50 text-amber-800 border-amber-300 font-bold px-2.5 py-1 text-xs"
              >
                <Banknote className="w-3.5 h-3.5 mr-1" /> Pay at Counter
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="bg-zinc-100 text-zinc-700 font-bold px-2.5 py-1 text-xs"
              >
                Payment Pending
              </Badge>
            )}
          </div>

          {/* Live Progress Stepper */}
          <div className="pt-4 border-t border-zinc-100">
            <div className="grid grid-cols-4 gap-2 text-center">
              {/* Step 1: Received */}
              <div className="space-y-1.5">
                <div
                  className={`w-9 h-9 rounded-2xl mx-auto flex items-center justify-center font-bold text-xs transition-colors ${
                    currentStep >= 1
                      ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
                      : "bg-zinc-100 text-zinc-400"
                  }`}
                >
                  <Receipt className="w-4 h-4" />
                </div>
                <span
                  className={`text-[10px] font-extrabold block ${
                    currentStep >= 1 ? "text-zinc-900" : "text-zinc-400"
                  }`}
                >
                  Received
                </span>
              </div>

              {/* Step 2: Preparing */}
              <div className="space-y-1.5">
                <div
                  className={`w-9 h-9 rounded-2xl mx-auto flex items-center justify-center font-bold text-xs transition-colors ${
                    currentStep >= 2
                      ? "bg-amber-600 text-white shadow-md shadow-amber-600/30 animate-pulse"
                      : "bg-zinc-100 text-zinc-400"
                  }`}
                >
                  <ChefHat className="w-4 h-4" />
                </div>
                <span
                  className={`text-[10px] font-extrabold block ${
                    currentStep >= 2 ? "text-zinc-900" : "text-zinc-400"
                  }`}
                >
                  Cooking
                </span>
              </div>

              {/* Step 3: Ready */}
              <div className="space-y-1.5">
                <div
                  className={`w-9 h-9 rounded-2xl mx-auto flex items-center justify-center font-bold text-xs transition-colors ${
                    currentStep >= 3
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                      : "bg-zinc-100 text-zinc-400"
                  }`}
                >
                  <BellRing className="w-4 h-4" />
                </div>
                <span
                  className={`text-[10px] font-extrabold block ${
                    currentStep >= 3 ? "text-zinc-900" : "text-zinc-400"
                  }`}
                >
                  Ready
                </span>
              </div>

              {/* Step 4: Completed */}
              <div className="space-y-1.5">
                <div
                  className={`w-9 h-9 rounded-2xl mx-auto flex items-center justify-center font-bold text-xs transition-colors ${
                    currentStep >= 4
                      ? "bg-zinc-950 text-white shadow-md"
                      : "bg-zinc-100 text-zinc-400"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span
                  className={`text-[10px] font-extrabold block ${
                    currentStep >= 4 ? "text-zinc-900" : "text-zinc-400"
                  }`}
                >
                  Served
                </span>
              </div>
            </div>

            {/* Current Status Message Callout */}
            <div className="mt-5 p-3 rounded-2xl bg-zinc-50 border border-zinc-100 text-xs font-semibold text-zinc-700">
              {currentStep === 1 && "Your order has been sent to the kitchen display."}
              {currentStep === 2 && "Our chefs are cooking your fresh meal right now."}
              {currentStep === 3 && (order.orderType === OrderType.DINE_IN ? `Your food is ready and being served to Table ${order.tableNumber}!` : "Your takeaway order is ready for pickup at the counter!")}
              {currentStep === 4 && "Order completed. Thank you for dining with Madrass Express!"}
            </div>
          </div>
        </div>

        {/* Pay at Counter Instruction Banner */}
        {order.paymentStatus === PaymentStatus.PAY_AT_COUNTER && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-3xl flex items-start gap-3">
            <Banknote className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <h4 className="font-extrabold text-xs text-amber-950">
                Pay at Cashier Counter
              </h4>
              <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
                Please show your Token <strong>#{order.tokenNumber}</strong> at the billing counter to settle your bill of <strong>₹{order.totalAmount}</strong> (Cash or UPI accepted).
              </p>
            </div>
          </div>
        )}

        {/* Order Details Accordion / List */}
        <div className="bg-white rounded-3xl p-4 border border-zinc-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
            <span className="font-extrabold text-xs text-zinc-900">
              Ordered Dishes ({order.items.reduce((s: number, i: any) => s + i.quantity, 0)})
            </span>
            <span className="text-[11px] font-mono text-zinc-400">
              {order.displayId}
            </span>
          </div>

          <div className="space-y-3 divide-y divide-zinc-100">
            {order.items.map((item: any) => (
              <div key={item.id} className="pt-2.5 first:pt-0 space-y-1">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs bg-zinc-100 text-zinc-800 px-2 py-0.5 rounded-md">
                      {item.quantity}x
                    </span>
                    <span className="font-bold text-xs text-zinc-900">
                      {item.name}
                    </span>
                  </div>
                  <span className="font-black text-xs text-zinc-950">
                    ₹{item.price * item.quantity}
                  </span>
                </div>

                {item.options && item.options.length > 0 && (
                  <p className="text-[10px] text-zinc-500 pl-8">
                    {item.options
                      .map((o: any) => `${o.name}${o.quantity > 1 ? ` x${o.quantity}` : ""}`)
                      .join(", ")}
                  </p>
                )}

                {item.notes && (
                  <p className="text-[10px] text-amber-700 italic pl-8">
                    Note: "{item.notes}"
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Bill summary breakdown */}
          <div className="pt-3 border-t border-zinc-100 space-y-1.5 text-xs text-zinc-600 font-medium">
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>Discount ({order.couponCode})</span>
                <span>-₹{order.discountAmount}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-sm font-black text-zinc-950 pt-1">
              <span>Total Bill</span>
              <span className="text-base text-amber-700">₹{order.totalAmount}</span>
            </div>
          </div>
        </div>

        {/* Back to Menu or Order More Button */}
        <div className="pt-2">
          <Button
            variant="outline"
            onClick={() => router.push("/kiosk/menu")}
            className="w-full h-12 rounded-2xl border-zinc-200 text-zinc-800 font-extrabold text-xs hover:bg-zinc-100"
          >
            Order Additional Dishes
          </Button>
        </div>
      </main>
    </div>
  );
}
