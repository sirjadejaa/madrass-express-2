"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";

export function DisplayClient({ initialSettings }: { initialSettings: any }) {
  const [preparing, setPreparing] = useState<any[]>([]);
  const [ready, setReady] = useState<any[]>([]);
  const [settings, setSettings] = useState(initialSettings || { enableVoice: true, voiceVolume: 1.0, tokensCount: 6 });
  const [hasInteracted, setHasInteracted] = useState(false);
  const knownReadyIds = useRef<Set<string>>(new Set());
  const [newlyReadyTokens, setNewlyReadyTokens] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const announceReady = (tokenNumber: string) => {
    if (!hasInteracted || !settings.enableVoice) return;
    try {
      const msg = new SpeechSynthesisUtterance(`Token ${tokenNumber}, please collect your order.`);
      msg.volume = settings.voiceVolume;
      window.speechSynthesis.speak(msg);
    } catch (e) {
      console.error("Speech synthesis failed", e);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/display/orders");
      if (!res.ok) throw new Error("Network response was not ok");
      const data = await res.json();
      
      if (data.success) {
        setError(null);
        setPreparing(data.preparing);
        setReady(data.ready);
        if (data.settings) setSettings(data.settings);

        const newReadySet = new Set<string>();
        data.ready.forEach((o: any) => {
          if (!knownReadyIds.current.has(o.id)) {
            announceReady(o.token.tokenNumber);
            newReadySet.add(o.id);
          }
          knownReadyIds.current.add(o.id);
        });

        if (newReadySet.size > 0) {
          setNewlyReadyTokens(prev => new Set(Array.from(prev).concat(Array.from(newReadySet))));
          // Remove highlight after 5 seconds
          setTimeout(() => {
            setNewlyReadyTokens(prev => {
              const next = new Set(prev);
              newReadySet.forEach(id => next.delete(id));
              return next;
            });
          }, 5000);
        }
      }
    } catch (e) {
      console.error(e);
      setError("Connection lost. Retrying...");
    }
  };

  useEffect(() => {
    if (hasInteracted) {
      fetchOrders();
      const interval = setInterval(fetchOrders, 5000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasInteracted]);

  if (!hasInteracted) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Button size="lg" className="text-2xl h-24 px-12 rounded-2xl shadow-xl shadow-primary/20 animate-pulse" onClick={() => setHasInteracted(true)}>
          START DISPLAY
        </Button>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col p-6 md:p-12 box-border bg-stone-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <div className="flex justify-between items-center mb-10 px-4">
        {settings.brandLogoUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={settings.brandLogoUrl} alt="Brand Logo" className="h-20 object-contain" />
        ) : (
          <h1 className="text-4xl font-black tracking-tight text-zinc-800 dark:text-zinc-100">Madrass Express</h1>
        )}
        <div className="flex items-center gap-4">
          {error && (
            <div className="flex items-center gap-2 text-xs font-medium bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-full border border-red-200 dark:border-red-900/50">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              {error}
            </div>
          )}
          <div className="text-xl font-medium text-zinc-500 tracking-widest uppercase">Order Status</div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 overflow-y-auto md:overflow-hidden pb-4">
        
        {/* PREPARING COLUMN */}
        <div className="flex flex-col rounded-[2.5rem] overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800 shadow-sm min-h-[400px]">
          <div className="py-6 md:py-8 text-center text-2xl md:text-3xl font-bold tracking-widest text-zinc-600 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-800">
            PREPARING
          </div>
          <div className="flex-1 p-6 md:p-10 grid grid-cols-2 gap-4 md:gap-6 place-content-start overflow-y-auto">
            {preparing.map((order) => (
              <div key={order.id} className="text-5xl md:text-6xl font-black text-center text-zinc-400 dark:text-zinc-500 py-4 font-mono">
                #{order.token.tokenNumber}
              </div>
            ))}
            {preparing.length === 0 && (
              <div className="col-span-2 text-center text-zinc-300 dark:text-zinc-700 text-2xl mt-12 font-medium">...</div>
            )}
          </div>
        </div>

        {/* READY COLUMN */}
        <div className="flex flex-col rounded-[2.5rem] overflow-hidden bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 shadow-lg shadow-emerald-500/5 min-h-[400px]">
          <div className="bg-emerald-500 py-6 md:py-8 text-center text-2xl md:text-3xl font-bold tracking-widest text-white shadow-sm">
            READY TO COLLECT
          </div>
          <div className="flex-1 p-6 md:p-10 grid grid-cols-2 gap-4 md:gap-6 place-content-start overflow-y-auto">
            {ready.map((order) => (
              <div 
                key={order.id} 
                className={`text-6xl md:text-7xl font-black text-center py-6 rounded-3xl transition-all duration-700 font-mono ${
                  newlyReadyTokens.has(order.id) 
                  ? 'bg-emerald-500 text-white scale-105 shadow-[0_20px_40px_-15px_rgba(16,185,129,0.5)]' 
                  : 'text-emerald-600 dark:text-emerald-500'
                }`}
              >
                #{order.token.tokenNumber}
              </div>
            ))}
            {ready.length === 0 && (
              <div className="col-span-2 text-center text-emerald-200 dark:text-emerald-900/50 text-2xl mt-12 font-medium">...</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
