import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { paymentProvider } from "@/lib/payments/mock-provider";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { orderId, amount } = await req.json();

    if (!orderId || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const order = await db.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Use abstraction to create intent
    const intent = await paymentProvider.createPaymentIntent(order, amount);

    if (!intent.success) {
      return NextResponse.json({ error: intent.error || "Failed to initialize payment" }, { status: 500 });
    }

    // Save the provider transaction ID to the payment record
    if (intent.providerTransactionId) {
      await db.payment.update({
        where: { orderId: order.id },
        data: {
          transactionId: intent.providerTransactionId,
          method: "UPI"
        }
      });
    }

    return NextResponse.json({
      success: true,
      qrCodeData: intent.qrCodeData
    });

  } catch (error) {
    console.error("Payment intent error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
