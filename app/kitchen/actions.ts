"use server";

import { db } from "@/lib/db";
import { OrderStatus } from "@prisma/client";

export async function acceptOrder(orderId: string) {
  try {
    const order = await db.order.findUnique({ where: { id: orderId } });
    if (!order) return { error: "Order not found" };
    
    if (order.status !== OrderStatus.NEW) {
      return { error: "Order is not in NEW state." };
    }

    await db.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.PREPARING }
    });

    return { success: true };
  } catch (e: any) {
    return { error: e.message || "Failed to update order" };
  }
}

export async function markOrderReady(orderId: string) {
  try {
    const order = await db.order.findUnique({ where: { id: orderId } });
    if (!order) return { error: "Order not found" };
    
    if (order.status !== OrderStatus.PREPARING) {
      return { error: "Order is not in PREPARING state." };
    }

    await db.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.READY }
    });

    return { success: true };
  } catch (e: any) {
    return { error: e.message || "Failed to update order" };
  }
}

export async function completeOrder(orderId: string) {
  try {
    const order = await db.order.findUnique({ where: { id: orderId } });
    if (!order) return { error: "Order not found" };
    
    if (order.status !== OrderStatus.READY) {
      return { error: "Order is not in READY state." };
    }

    await db.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.COMPLETED }
    });

    return { success: true };
  } catch (e: any) {
    return { error: e.message || "Failed to update order" };
  }
}
