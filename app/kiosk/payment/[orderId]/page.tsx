import { db } from "@/lib/db";
import { PaymentClient } from "./client";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PaymentPage({ params }: { params: { orderId: string } }) {
  const order = await db.order.findUnique({
    where: { id: params.orderId },
    include: {
      token: true,
      restaurant: true,
      payment: true
    }
  });

  if (!order) {
    return notFound();
  }

  // If order is already paid, or meant for pay at counter, it shouldn't be here
  if (order.payment?.status === "PAID" || order.payment?.status === "PAY_AT_COUNTER") {
    // We could redirect to success page
  }

  return (
    <div className="h-full w-full bg-muted/20 flex flex-col">
      <div className="p-6 bg-background border-b shadow-sm flex items-center justify-between z-10">
        <h1 className="text-3xl font-black text-foreground drop-shadow-sm">{order.restaurant.name} - Payment</h1>
        <div className="text-2xl font-bold">Total: ₹{Number(order.totalAmount).toFixed(2)}</div>
      </div>
      
      <div className="flex-1 overflow-hidden relative">
        <PaymentClient orderId={order.id} amount={Number(order.totalAmount)} />
      </div>
    </div>
  );
}
