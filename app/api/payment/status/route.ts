import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { payment: true }
    });

    if (!order || !order.payment) {
      return NextResponse.json({ error: "Order or payment not found" }, { status: 404 });
    }

    // In a real app with a provider that doesn't use webhooks, you might call:
    // const verify = await paymentProvider.verifyPayment(order.payment.transactionId);
    // and update the DB here if it changed.
    
    // With webhooks (or our mock), the DB is the source of truth.
    return NextResponse.json({
      status: order.payment.status
    });

  } catch (error) {
    console.error("Payment status error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
