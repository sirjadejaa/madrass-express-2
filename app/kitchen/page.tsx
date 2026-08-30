import { KDSClient } from "./client";

import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function KitchenPage() {
  const restaurant = await db.restaurant.findFirst();

  if (!restaurant) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-8 text-center bg-stone-900 text-stone-50">
        <h2 className="text-3xl font-bold mb-4">No restaurant configured</h2>
        <p className="text-stone-400 mb-8 text-lg">Please set up the restaurant in the admin dashboard.</p>
        <a href="/admin/setup" className="inline-flex h-12 items-center justify-center rounded-md bg-stone-100 px-8 text-sm font-medium text-stone-900 shadow transition-colors hover:bg-stone-200">
          GO TO ADMIN SETUP
        </a>
      </div>
    );
  }

  // We can pass initial session data if needed, or initial orders, but SWR/polling works best
  // when client hydrates immediately.
  
  return (
    <div className="h-screen w-full flex flex-col overflow-hidden">
      <div className="flex-none p-4 bg-slate-900 border-b border-slate-800 shadow-md flex items-center justify-between">
        <h1 className="text-2xl font-black tracking-tight text-white">KITCHEN DISPLAY SYSTEM</h1>
      </div>
      
      <div className="flex-1 overflow-hidden p-4">
        <KDSClient />
      </div>
    </div>
  );
}
