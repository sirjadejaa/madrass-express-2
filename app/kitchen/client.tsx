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
  
  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/kds/orders");
      const data = await res.json();
      if (data.success) {
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
    <div className="h-full w-full flex flex-col">
      <div className="flex justify-between items-center mb-4 gap-4 flex-wrap">
        <div className="flex gap-2">
          {["ALL", "DINE_IN", "TAKEAWAY", "PENDING", "DELAYED"].map(f => (
            <Button 
              key={f} 
              variant={filter === f ? "default" : "outline"} 
              size="sm"
              onClick={() => setFilter(f)}
              className={filter !== f ? "text-slate-400 border-slate-700 bg-slate-900" : ""}
            >
              {f.replace('_', ' ')}
            </Button>
          ))}
        </div>
        {!soundEnabled && (
          <Button variant="destructive" size="sm" onClick={() => setSoundEnabled(true)} className="animate-pulse">
            Enable Order Sound
          </Button>
        )}
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-auto md:h-full overflow-y-auto md:overflow-hidden pb-4">
        
        {/* NEW COLUMN */}
        <KDSColumn 
          title="NEW ORDERS" 
          orders={newOrders} 
          actionLabel="ACCEPT" 
          onAction={(id: string) => handleAction(id, acceptOrder)}
          color="border-sky-500/50"
          headerColor="bg-sky-500/20 text-sky-300"
        />

        {/* PREPARING COLUMN */}
        <KDSColumn 
          title="PREPARING" 
          orders={prepOrders} 
          actionLabel="READY" 
          onAction={(id: string) => handleAction(id, markOrderReady)}
          color="border-amber-500/50"
          headerColor="bg-amber-500/20 text-amber-300"
        />

        {/* READY COLUMN */}
        <KDSColumn 
          title="READY" 
          orders={readyOrders} 
          actionLabel="COMPLETED" 
          onAction={(id: string) => handleAction(id, completeOrder)}
          color="border-emerald-500/50"
          headerColor="bg-emerald-500/20 text-emerald-300"
        />

      </div>
    </div>
  );
}

function KDSColumn({ title, orders, actionLabel, onAction, color, headerColor }: any) {
  return (
    <div className={`flex flex-col border-2 rounded-xl overflow-hidden bg-slate-900/50 ${color} h-[400px] md:h-auto min-h-0`}>
      <div className={`p-4 font-bold tracking-widest text-center shadow-md ${headerColor}`}>
        {title} ({orders.length})
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {orders.map((order: any) => (
          <OrderCard key={order.id} order={order} actionLabel={actionLabel} onAction={() => onAction(order.id)} />
        ))}
        {orders.length === 0 && (
          <div className="text-center text-slate-600 mt-10 font-bold uppercase">No orders</div>
        )}
      </div>
    </div>
  );
}

function OrderCard({ order, actionLabel, onAction }: any) {
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
    <div className={`p-4 rounded-xl border-2 transition-all ${isDelayed ? 'border-red-500 bg-red-500/10' : 'border-slate-800 bg-slate-800'} shadow-lg`}>
      <div className="flex justify-between items-start mb-4 border-b border-slate-700 pb-3">
        <div>
          <div className="text-3xl font-black">#{order.token.tokenNumber}</div>
          <div className={`text-xs font-bold uppercase mt-1 px-2 py-0.5 rounded-full inline-block ${isTakeaway ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'}`}>
            {isTakeaway ? 'Takeaway' : `Dine In - Table ${order.table?.number}`}
          </div>
        </div>
        <div className="text-right">
          <div className={`text-lg font-mono font-bold ${isDelayed ? 'text-red-400' : 'text-slate-300'}`}>{elapsedStr}</div>
          {order.payment?.status === "PAY_AT_COUNTER" && (
            <div className="text-[10px] font-bold text-red-400 uppercase mt-1 bg-red-900/40 px-2 py-0.5 rounded">
              PAY DUE
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3 mb-5">
        {order.items.map((item: any) => (
          <div key={item.id} className="text-sm">
            <div className="flex font-bold">
              <span className="text-slate-400 w-8">{item.quantity}x</span>
              <span className="text-slate-100">{item.product.name}</span>
            </div>
            {item.options.map((opt: any) => (
              <div key={opt.id} className="text-slate-400 pl-8 text-xs">
                + {opt.option.name} {opt.quantity > 1 ? `(x${opt.quantity})` : ''}
              </div>
            ))}
          </div>
        ))}
      </div>

      <Button className="w-full font-bold h-12 text-lg" size="lg" onClick={onAction}>
        {actionLabel}
      </Button>
    </div>
  );
}
