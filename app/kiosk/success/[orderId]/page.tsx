import { db } from "@/lib/db";
import { SuccessClient } from "./client";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SuccessPage({ params }: { params: { orderId: string } }) {
  const order = await db.order.findUnique({
    where: { id: params.orderId },
    include: {
      token: true,
      restaurant: true,
      payment: true,
      items: true
    }
  });

  if (!order || !order.token) {
    return notFound();
  }

  // Fetch RECEIPT printer for this restaurant
  const printer = await db.printerSetting.findFirst({
    where: { 
      restaurantId: order.restaurantId,
      type: "RECEIPT"
    }
  });

  return (
    <div className="h-full w-full bg-muted/20 flex flex-col">
      <div className="p-6 bg-background border-b shadow-sm flex items-center justify-between z-10">
        <h1 className="text-3xl font-black text-foreground drop-shadow-sm">{order.restaurant.name}</h1>
      </div>
      
      <div className="flex-1 overflow-hidden relative">
        <SuccessClient 
          orderId={order.id}
          tokenNumber={order.token.tokenNumber} 
          paymentStatus={order.payment?.status || "PENDING"} 
          orderType={order.type}
          printerConfig={printer ? {
            name: printer.name,
            type: printer.type,
            paperWidth: printer.paperWidth,
            autoPrint: printer.autoPrint,
            receiptFooter: printer.receiptFooter,
            ipAddress: printer.ipAddress
          } : undefined}
        />
      </div>
    </div>
  );
}
