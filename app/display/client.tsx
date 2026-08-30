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
      const data = await res.json();
      if (data.success) {
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
      <div className="h-screen w-full flex items-center justify-center bg-black">
        <Button size="lg" className="text-2xl h-24 px-12 animate-pulse" onClick={() => setHasInteracted(true)}>
          START DISPLAY
        </Button>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col p-8 box-border">
      {settings.brandLogoUrl && (
        <div className="flex justify-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={settings.brandLogoUrl} alt="Brand Logo" className="h-24 object-contain" />
        </div>
      )}

      <div className="flex-1 grid grid-cols-2 gap-12 overflow-hidden">
        
        {/* PREPARING COLUMN */}
        <div className="flex flex-col border-4 border-slate-800 rounded-3xl overflow-hidden bg-slate-900/50">
          <div className="bg-amber-500 py-6 text-center text-4xl font-black tracking-widest text-black">
            NOW PREPARING
          </div>
          <div className="flex-1 p-8 grid grid-cols-2 gap-6 place-content-start overflow-hidden">
            {preparing.map((order) => (
              <div key={order.id} className="text-6xl font-black text-center text-slate-300 py-4">
                #{order.token.tokenNumber}
              </div>
            ))}
            {preparing.length === 0 && (
              <div className="col-span-2 text-center text-slate-600 text-3xl mt-12 font-bold">...</div>
            )}
          </div>
        </div>

        {/* READY COLUMN */}
        <div className="flex flex-col border-4 border-emerald-900 rounded-3xl overflow-hidden bg-emerald-950/20">
          <div className="bg-emerald-500 py-6 text-center text-4xl font-black tracking-widest text-black">
            READY FOR PICKUP
          </div>
          <div className="flex-1 p-8 grid grid-cols-2 gap-6 place-content-start overflow-hidden">
            {ready.map((order) => (
              <div 
                key={order.id} 
                className={`text-7xl font-black text-center py-6 rounded-2xl transition-all duration-500 ${
                  newlyReadyTokens.has(order.id) ? 'bg-emerald-500 text-black scale-110 shadow-[0_0_40px_rgba(16,185,129,0.8)]' : 'text-emerald-400'
                }`}
              >
                #{order.token.tokenNumber}
              </div>
            ))}
            {ready.length === 0 && (
              <div className="col-span-2 text-center text-emerald-900/50 text-3xl mt-12 font-bold">...</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
