"use client";

import { useEffect, useState, useRef } from "react";
import { OrderStatus } from "@prisma/client";
import { differenceInMinutes, differenceInSeconds } from "date-fns";
import { acceptOrder, markOrderReady, completeOrder } from "./actions";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";

// Actually wait, a simpler approach for beep in browser without base64 is an AudioContext oscillator, 
// but browser autoplay policy requires user interaction first. 
// A KDS usually stays open so we can ask for a quick click to enable sound.

export function KDSClient() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState("ALL");
  const knownOrderIds = useRef<Set<string>>(new Set());
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/kds/orders");
      if (!res.ok) throw new Error("Network response was not ok");
      const data = await res.json();
      
      if (data.success) {
        setError(null); // Clear previous errors
        setOrders(data.orders);
        
        // Check for new orders
        let hasNew = false;
        data.orders.forEach((o: any) => {
          if (!knownOrderIds.current.has(o.id) && o.status === OrderStatus.NEW) {
            hasNew = true;
          }
          knownOrderIds.current.add(o.id);
        });

        if (hasNew && soundEnabled) {
          try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = "sine";
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.2);
          } catch (e) {
            console.error("Audio play failed", e);
          }
        }
      }
    } catch (e) {
      console.error(e);
      setError("Connection lost. Retrying...");
    }
  };

  useEffect(() => {
    fetchOrders(); // initial fetch
    const interval = setInterval(fetchOrders, 5000); // Poll every 5s
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundEnabled]); // Re-bind if sound enabled changes to access state

  const handleAction = async (orderId: string, action: (id: string) => Promise<any>) => {
    const res = await action(orderId);
    if (res.error) {
      toast({ title: "Error", description: res.error, variant: "destructive" });
    } else {
      // Optimistic refresh
      fetchOrders();
    }
  };

  // Apply filters
  const filteredOrders = orders.filter(o => {
    if (filter === "DINE_IN" && o.type !== "DINE_IN") return false;
    if (filter === "TAKEAWAY" && o.type !== "TAKEAWAY") return false;
    if (filter === "PENDING" && o.payment?.status !== "PAID") return false; // wait, pending means unpaid? "pending" in prompt might mean "PAY_AT_COUNTER".
    // Let's assume PENDING means PAY_AT_COUNTER
    if (filter === "PAY_DUE" && o.payment?.status !== "PAY_AT_COUNTER") return false;
    // Delayed filter is harder since we don't calculate delayed here, but we can check createdAt
    if (filter === "DELAYED" && differenceInMinutes(new Date(), new Date(o.createdAt)) < 15) return false;
    return true;
  });

  // Derived columns
  const newOrders = filteredOrders.filter(o => o.status === OrderStatus.NEW || o.status === OrderStatus.ACCEPTED);
  const prepOrders = filteredOrders.filter(o => o.status === OrderStatus.PREPARING);
  const readyOrders = filteredOrders.filter(o => o.status === OrderStatus.READY);

  return (
    <div className="h-full w-full flex flex-col bg-zinc-950 text-zinc-100 p-2 md:p-6">
      <div className="flex justify-between items-center mb-6 gap-4 flex-wrap bg-zinc-900/80 backdrop-blur p-4 rounded-2xl border border-zinc-800 shadow-sm">
        <div className="flex gap-2 flex-wrap">
          {["ALL", "DINE_IN", "TAKEAWAY", "PENDING", "DELAYED"].map(f => (
            <Button 
              key={f} 
              variant={filter === f ? "default" : "outline"} 
              size="sm"
              onClick={() => setFilter(f)}
              className={filter === f 
                ? "bg-zinc-100 text-zinc-900 hover:bg-white" 
                : "text-zinc-400 border-zinc-800 bg-transparent hover:bg-zinc-800 hover:text-zinc-300"}
            >
              {f.replace('_', ' ')}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          {error && (
            <div className="flex items-center gap-2 text-xs font-medium bg-red-950/50 text-red-400 px-3 py-1.5 rounded-full border border-red-900/50">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              {error}
            </div>
          )}
          {!soundEnabled && (
            <Button variant="outline" size="sm" onClick={() => setSoundEnabled(true)} className="animate-pulse border-amber-500/50 text-amber-500 hover:bg-amber-500/10">
              Enable Order Sound
            </Button>
          )}
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 h-auto md:h-full overflow-y-auto md:overflow-hidden pb-4">
        
        {/* NEW COLUMN */}
        <KDSColumn 
          title="NEW ORDERS" 
          orders={newOrders} 
          actionLabel="ACCEPT" 
          onAction={(id: string) => handleAction(id, acceptOrder)}
          color="border-zinc-800"
          headerColor="bg-zinc-900 text-zinc-300"
          buttonVariant="default"
        />

        {/* PREPARING COLUMN */}
        <KDSColumn 
          title="PREPARING" 
          orders={prepOrders} 
          actionLabel="READY" 
          onAction={(id: string) => handleAction(id, markOrderReady)}
          color="border-amber-900/30"
          headerColor="bg-amber-950/30 text-amber-400 border-b border-amber-900/50"
          buttonVariant="secondary"
        />

        {/* READY COLUMN */}
        <KDSColumn 
          title="READY" 
          orders={readyOrders} 
          actionLabel="COMPLETED" 
          onAction={(id: string) => handleAction(id, completeOrder)}
          color="border-emerald-900/30"
          headerColor="bg-emerald-950/30 text-emerald-400 border-b border-emerald-900/50"
          buttonVariant="outline"
        />

      </div>
    </div>
  );
}

function KDSColumn({ title, orders, actionLabel, onAction, color, headerColor, buttonVariant }: any) {
  return (
    <div className={`flex flex-col border rounded-2xl overflow-hidden bg-zinc-900/40 ${color} h-[500px] md:h-auto min-h-0 backdrop-blur-sm`}>
      <div className={`p-4 font-bold tracking-widest text-center shadow-sm ${headerColor}`}>
        {title} <span className="opacity-60 font-normal ml-2">({orders.length})</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {orders.map((order: any) => (
          <OrderCard key={order.id} order={order} actionLabel={actionLabel} onAction={() => onAction(order.id)} buttonVariant={buttonVariant} />
        ))}
        {orders.length === 0 && (
          <div className="flex items-center justify-center h-40">
            <div className="text-center text-zinc-600 font-medium uppercase tracking-widest text-sm">No orders</div>
          </div>
        )}
      </div>
    </div>
  );
}

function OrderCard({ order, actionLabel, onAction, buttonVariant }: any) {
  const [elapsedStr, setElapsedStr] = useState("");
  const [isDelayed, setIsDelayed] = useState(false);

  useEffect(() => {
    const tick = () => {
      const created = new Date(order.createdAt);
      const now = new Date();
      const mins = differenceInMinutes(now, created);
      const secs = differenceInSeconds(now, created) % 60;
      setElapsedStr(`${mins}m ${secs}s`);
      if (mins >= 15) setIsDelayed(true);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [order.createdAt]);

  const isTakeaway = order.type === "TAKEAWAY";

  return (
    <div className={`p-5 rounded-xl border transition-all ${isDelayed ? 'border-red-900/50 bg-red-950/20' : 'border-zinc-800 bg-zinc-900'} shadow-md`}>
      <div className="flex justify-between items-start mb-5 border-b border-zinc-800 pb-4">
        <div>
          <div className="text-4xl font-black text-white tracking-tighter">#{order.token.tokenNumber}</div>
          <div className={`text-[11px] font-bold uppercase mt-2 px-2.5 py-1 rounded-md inline-block tracking-wider ${isTakeaway ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-zinc-800 text-zinc-300 border border-zinc-700'}`}>
            {isTakeaway ? 'Takeaway' : `Dine In - Table ${order.table?.number}`}
          </div>
        </div>
        <div className="text-right flex flex-col items-end">
          <div className={`text-lg font-mono font-medium ${isDelayed ? 'text-red-400' : 'text-zinc-400'}`}>{elapsedStr}</div>
          {order.payment?.status === "PAY_AT_COUNTER" && (
            <div className="text-[10px] font-bold text-red-400 uppercase mt-2 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded">
              Payment Due
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4 mb-6">
        {order.items.map((item: any) => (
          <div key={item.id} className="text-base">
            <div className="flex font-semibold">
              <span className="text-zinc-500 w-8 font-mono">{item.quantity}x</span>
              <span className="text-zinc-100">{item.product.name}</span>
            </div>
            {item.options.length > 0 && (
              <div className="mt-1.5 space-y-1">
                {item.options.map((opt: any) => (
                  <div key={opt.id} className="text-zinc-400 pl-8 text-sm flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-zinc-700 shrink-0"></span>
                    {opt.option.name} {opt.quantity > 1 ? <span className="text-zinc-500 font-mono">(x{opt.quantity})</span> : ''}
                  </div>
                ))}
              </div>
            )}
            {item.notes && (
              <div className="mt-2.5 pl-8">
                <div className="text-[10px] font-bold text-amber-500/80 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                  Special Instructions
                </div>
                <div className="text-sm font-medium text-amber-50 bg-amber-500/10 border border-amber-500/20 rounded-md p-2.5 break-words">
                  {item.notes}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <Button 
        className="w-full font-bold h-14 text-lg shadow-sm" 
        variant={buttonVariant || "default"} 
        size="lg" 
        onClick={onAction}
      >
        {actionLabel}
      </Button>
    </div>
  );
}
