"use server";

import { createSharedOrder, CreateOrderPayload, CreateOrderResult } from "@/lib/orders/order-service";
import { OrderSource, OrderType, PaymentMethod } from "@prisma/client";
import { cookies } from "next/headers";
import { resolveTableByToken } from "@/lib/tables/table-service";

interface SubmitMobileOrderInput {
  idempotencyKey: string;
  restaurantId: string;
  customerName: string;
  customerPhone: string;
  orderType: OrderType;
  tableId?: string | null;
  cart: Array<{
    productId: string;
    quantity: number;
    notes?: string;
    options: Array<{
      optionId: string;
      quantity: number;
    }>;
  }>;
  couponCode?: string | null;
  paymentMethod?: PaymentMethod;
  payAtCounter?: boolean;
}

export async function submitMobileOrderAction(input: SubmitMobileOrderInput): Promise<CreateOrderResult> {
  try {
    // If DINE_IN, verify table against the secure session cookie if present
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get("madrass_table_session")?.value;
    let verifiedTableId = input.tableId;

    if (input.orderType === OrderType.DINE_IN && sessionCookie) {
      try {
        const parsed = JSON.parse(sessionCookie);
        if (parsed.qrToken) {
          const verified = await resolveTableByToken(parsed.qrToken);
          if (verified.valid && verified.table) {
            verifiedTableId = verified.table.id;
          }
        } else if (parsed.tableId) {
          verifiedTableId = parsed.tableId;
        }
      } catch {
        // Fall back to input tableId
      }
    }

    const payload: CreateOrderPayload = {
      idempotencyKey: input.idempotencyKey,
      restaurantId: input.restaurantId,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      orderType: input.orderType,
      source: OrderSource.QR_MOBILE,
      tableId: input.orderType === OrderType.DINE_IN ? verifiedTableId : null,
      cart: input.cart,
      couponCode: input.couponCode,
      paymentMethod: input.paymentMethod || PaymentMethod.UPI,
      payAtCounter: input.payAtCounter,
    };

    return await createSharedOrder(payload);
  } catch (error: any) {
    console.error("submitMobileOrderAction error:", error);
    return { error: error.message || "Failed to process mobile order." };
  }
}
