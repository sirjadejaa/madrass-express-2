"use server";

import { db } from "@/lib/db";
import { PaymentStatus, OrderStatus } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function markOrderPaidAtCounter(orderId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "MANAGER", "COUNTER"].includes(session.user.role)) {
      return { error: "Unauthorized. Insufficient permissions." };
    }
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { payment: true }
    });

    if (!order || !order.payment) {
      return { error: "Order or payment not found." };
    }

    if (order.payment.status === PaymentStatus.PAID) {
      return { error: "Already paid." };
    }

    if (order.payment.status !== PaymentStatus.PAY_AT_COUNTER) {
      return { error: "Order is not marked for pay at counter." };
    }

    await db.$transaction([
      db.payment.update({
        where: { id: order.payment.id },
        data: { status: PaymentStatus.PAID }
      }),
      // The order status remains NEW or moves to ACCEPTED based on restaurant flow.
      // Requirement: "keep order status NEW" after payment succeeds.
      db.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.NEW } 
      })
    ]);

    return { success: true };
  } catch (error) {
    console.error("Mark order paid error:", error);
    return { error: "Internal server error." };
  }
}
