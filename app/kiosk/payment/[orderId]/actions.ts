"use server";

import { db } from "@/lib/db";
import { PaymentStatus } from "@prisma/client";

export async function updatePaymentToCounterAction(orderId: string) {
  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { payment: true }
    });

    if (!order || !order.payment) {
      return { error: "Order or payment not found." };
    }

    if (order.payment.status === PaymentStatus.PAID) {
      return { error: "Order is already paid." };
    }

    await db.payment.update({
      where: { id: order.payment.id },
      data: {
        method: "CASH",
        status: PaymentStatus.PAY_AT_COUNTER
      }
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to update to pay at counter:", error);
    return { error: "Internal server error." };
  }
}

export async function mockWebhookAction(orderId: string) {
  // This simulates the payment provider hitting our endpoint.
  // We use this for the dev "Simulate Webhook" button so it tests the polling.
  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { payment: true }
    });

    if (!order || !order.payment) return { error: "Not found" };

    await db.payment.update({
      where: { id: order.payment.id },
      data: { status: PaymentStatus.PAID }
    });

    return { success: true };
  } catch (error) {
    return { error: "Failed" };
  }
}
