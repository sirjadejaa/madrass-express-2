"use client";

import React, { useEffect, useState, useRef, memo } from "react";
import { OrderStatus } from "@prisma/client";
import { differenceInMinutes, differenceInSeconds } from "date-fns";
import { acceptOrder, markOrderReady, completeOrder } from "./actions";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, AlertCircle } from "lucide-react";

const OrderTimer = memo(({ createdAt, isDelayed }: { createdAt: string; isDelayed: boolean }) => {
  const [elapsedStr, setElapsedStr] = useState("");

  useEffect(() => {
    const tick = () => {
      const created = new Date(createdAt);
      const now = new Date();
      const mins = Math.max(0, differenceInMinutes(now, created));
      const secs = Math.max(0, differenceInSeconds(now, created) % 60);
      setElapsedStr(`${mins}m ${secs}s`);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [createdAt]);

  return (
    <div className={`text-lg font-mono font-medium ${isDelayed ? 'text-red-400' : 'text-zinc-400'}`}>
      {elapsedStr}
    </div>
  );
});
OrderTimer.displayName = "OrderTimer";

const OrderCard = memo(({ order, actionLabel, onAction, buttonVariant }: any) => {
  const isTakeaway = order.type === "TAKEAWAY";
  
  // Calculate if delayed (>= 15 minutes) exactly once and set a timeout to trigger a single re-render when it crosses the boundary.
  const [isDelayed, setIsDelayed] = useState(() => differenceInMinutes(new Date(), new Date(order.createdAt)) >= 15);

  useEffect(() => {
    if (isDelayed) return;
    const created = new Date(order.createdAt).getTime();
    const msUntilDelayed = (created + 15 * 60 * 1000) - Date.now();
    if (msUntilDelayed <= 0) {
      setIsDelayed(true);
    } else {
      const timer = setTimeout(() => setIsDelayed(true), msUntilDelayed);
      return () => clearTimeout(timer);
    }
  }, [order.createdAt, isDelayed]);

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
          <OrderTimer createdAt={order.createdAt} isDelayed={isDelayed} />
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
}, (prevProps, nextProps) => {
  return prevProps.order.updatedAt === nextProps.order.updatedAt && prevProps.actionLabel === nextProps.actionLabel;
});
OrderCard.displayName = "OrderCard";


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

export function KDSClient() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState("ALL");
  const knownOrderIds = useRef<Set<string>>(new Set());
  const [soundEnabled, setSoundEnabled] = useState(false);
  
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchOrders = async () => {
    setIsFetching(true);
    try {
      const res = await fetch("/api/kds/orders");
      if (!res.ok) throw new Error("Network response was not ok");
      const data = await res.json();
      
      if (data.success) {
        setError(null);
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
      } else {
        throw new Error(data.error || "Failed to load orders");
      }
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Connection lost.");
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000); // Poll every 5s
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundEnabled]);

  const handleAction = async (orderId: string, action: (id: string) => Promise<any>) => {
    const res = await action(orderId);
    if (res.error) {
      toast({ title: "Error", description: res.error, variant: "destructive" });
    } else {
      fetchOrders();
    }
  };

  if (error && orders.length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-zinc-950 text-zinc-100">
        <AlertCircle className="w-16 h-16 text-red-500 mb-6" />
        <h2 className="text-3xl font-bold mb-4">Connection Error</h2>
        <p className="text-zinc-400 mb-8 max-w-md text-center">{error}</p>
        <Button size="lg" onClick={() => { fetchOrders(); }}>
          Retry Connection
        </Button>
      </div>
    );
  }

  const filteredOrders = orders.filter(o => {
    if (filter === "DINE_IN" && o.type !== "DINE_IN") return false;
    if (filter === "TAKEAWAY" && o.type !== "TAKEAWAY") return false;
    if (filter === "PENDING" && o.payment?.status !== "PAID") return false;
    if (filter === "PAY_DUE" && o.payment?.status !== "PAY_AT_COUNTER") return false;
    if (filter === "DELAYED" && differenceInMinutes(new Date(), new Date(o.createdAt)) < 15) return false;
    return true;
  });

  const newOrders = filteredOrders.filter(o => o.status === OrderStatus.NEW || o.status === OrderStatus.ACCEPTED);
  const prepOrders = filteredOrders.filter(o => o.status === OrderStatus.PREPARING);
  const readyOrders = filteredOrders.filter(o => o.status === OrderStatus.READY);

  return (
    <div className="h-full w-full flex flex-col bg-zinc-950 text-zinc-100 p-2 md:p-6">
      <div className="flex justify-between items-center mb-6 gap-4 flex-wrap bg-zinc-900/80 backdrop-blur p-4 rounded-2xl border border-zinc-800 shadow-sm relative">
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
          {isFetching && (
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-400 mr-2">
              <RefreshCw className="w-3 h-3 animate-spin" /> Syncing...
            </div>
          )}
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 h-auto md:h-full overflow-y-auto md:overflow-hidden pb-4">
        <KDSColumn 
          title="NEW ORDERS" 
          orders={newOrders} 
          actionLabel="ACCEPT" 
          onAction={(id: string) => handleAction(id, acceptOrder)}
          color="border-zinc-800"
          headerColor="bg-zinc-900 text-zinc-300"
          buttonVariant="default"
        />
        <KDSColumn 
          title="PREPARING" 
          orders={prepOrders} 
          actionLabel="READY" 
          onAction={(id: string) => handleAction(id, markOrderReady)}
          color="border-amber-900/30"
          headerColor="bg-amber-950/30 text-amber-400 border-b border-amber-900/50"
          buttonVariant="secondary"
        />
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
