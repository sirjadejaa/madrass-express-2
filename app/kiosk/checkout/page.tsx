import { db } from "@/lib/db";
import { CheckoutClient } from "./client";
import { cookies } from "next/headers";
import { resolveTableByToken } from "@/lib/tables/table-service";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const restaurant = await db.restaurant.findFirst({
    include: { settings: true }
  });

  if (!restaurant) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-stone-50">
        <h2 className="text-3xl font-bold mb-4">No restaurant configured</h2>
        <p className="text-muted-foreground mb-8 text-lg">Please set up the restaurant in the admin dashboard to start using the kiosk.</p>
        <a href="/admin/setup" className="inline-flex h-12 items-center justify-center rounded-full bg-amber-600 px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-amber-700">
          GO TO ADMIN SETUP
        </a>
      </div>
    );
  }

  const tables = await db.table.findMany({
    where: { restaurantId: restaurant.id },
    orderBy: { number: 'asc' },
    select: { id: true, number: true }
  });

  // Verify table session from QR scan cookie if present
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get("madrass_table_session")?.value;
  let tableSession: { id: string; number: string } | null = null;

  if (sessionCookie) {
    try {
      const parsed = JSON.parse(sessionCookie);
      if (parsed.qrToken) {
        const verified = await resolveTableByToken(parsed.qrToken);
        if (verified.valid && verified.table) {
          tableSession = {
            id: verified.table.id,
            number: verified.table.number,
          };
        }
      }
    } catch {
      // Ignore invalid cookie
    }
  }

  return (
    <div className="h-full w-full bg-muted/20 flex flex-col">
      <div className="p-6 bg-background border-b shadow-sm flex items-center justify-between z-10">
        <h1 className="text-3xl font-black text-foreground drop-shadow-sm">{restaurant?.name} - Checkout</h1>
      </div>
      
      <div className="flex-1 overflow-hidden relative">
        <CheckoutClient 
          tables={tables} 
          restaurantId={restaurant?.id || ""} 
          taxPercent={restaurant?.settings?.taxPercent ?? 5.0} 
          tableSession={tableSession}
        />
      </div>
    </div>
  );
}
