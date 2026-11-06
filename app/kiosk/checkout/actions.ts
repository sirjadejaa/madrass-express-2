"use server";

import { createSharedOrder } from "@/lib/orders/order-service";
import { OrderType, OrderSource } from "@prisma/client";
import { cookies } from "next/headers";
import { resolveTableByToken } from "@/lib/tables/table-service";

interface CheckoutPayload {
  idempotencyKey: string;
  restaurantId: string;
  customerName: string;
  customerPhone: string;
  orderType: OrderType;
  tableId?: string;
  cart: any[];
  subtotal: number;
  tax: number;
  total: number;
  couponCode?: string;
  discountAmount?: number;
}

export async function processCheckoutAction(payload: CheckoutPayload) {
  // Convert cart options into standard OrderCartItem shape
  const formattedCart = (payload.cart || []).map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
    notes: item.notes,
    options: (item.options || []).map((opt: any) => ({
      optionId: opt.optionId,
      quantity: opt.quantity || 1,
    })),
  }));

  // Cryptographically verify table session from cookie
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get("madrass_table_session")?.value;
  let resolvedTableId: string | null = payload.tableId || null;
  let resolvedSource: OrderSource = OrderSource.KIOSK;
  let resolvedOrderType: OrderType = payload.orderType;

  if (sessionCookie) {
    try {
      const parsed = JSON.parse(sessionCookie);
      if (parsed.qrToken) {
        const verified = await resolveTableByToken(parsed.qrToken);
        if (verified.valid && verified.table) {
          resolvedTableId = verified.table.id;
          resolvedSource = OrderSource.QR_MOBILE;
          resolvedOrderType = OrderType.DINE_IN;
        }
      }
    } catch {
      // Fallback to payload values
    }
  }

  return await createSharedOrder({
    idempotencyKey: payload.idempotencyKey,
    restaurantId: payload.restaurantId,
    customerName: payload.customerName,
    customerPhone: payload.customerPhone,
    orderType: resolvedOrderType,
    source: resolvedSource,
    tableId: resolvedTableId,
    cart: formattedCart,
    couponCode: payload.couponCode || null,
  });
}
