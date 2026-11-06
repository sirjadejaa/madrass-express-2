import { db } from "@/lib/db";
import { OrderType, OrderStatus, PaymentStatus, OrderSource, PaymentMethod } from "@prisma/client";
import crypto from "crypto";

export interface OrderCartItemOption {
  optionId: string;
  quantity: number;
}

export interface OrderCartItem {
  productId: string;
  quantity: number;
  options: OrderCartItemOption[];
  notes?: string;
}

export interface CreateOrderPayload {
  idempotencyKey: string;
  restaurantId: string;
  customerName: string;
  customerPhone: string;
  orderType: OrderType;
  source: OrderSource;
  tableId?: string | null;
  cart: OrderCartItem[];
  couponCode?: string | null;
  paymentMethod?: PaymentMethod;
  payAtCounter?: boolean;
}

export interface CreateOrderResult {
  success?: boolean;
  orderId?: string;
  trackingToken?: string;
  tokenNumber?: number;
  total?: number;
  error?: string;
  unavailableProductIds?: string[];
}

/**
 * Shared, canonical order creation engine for Madrass Express.
 * Handles pricing validation, option group constraints, coupon validation,
 * concurrency-safe token generation, and secure tracking token creation.
 */
export async function createSharedOrder(payload: CreateOrderPayload): Promise<CreateOrderResult> {
  try {
    // 1. Basic Validations
    if (!payload.idempotencyKey || typeof payload.idempotencyKey !== "string") {
      return { error: "Missing or invalid idempotency key." };
    }

    const cleanName = payload.customerName?.trim();
    const cleanPhone = payload.customerPhone?.trim();

    if (!cleanName || !cleanPhone) {
      return { error: "Customer name and phone number are required." };
    }

    if (!payload.cart || payload.cart.length === 0) {
      return { error: "Your cart is empty." };
    }

    // Validate Table for Dine-In
    let verifiedTableId: string | null = null;
    if (payload.orderType === OrderType.DINE_IN) {
      if (!payload.tableId) {
        return { error: "Table is required for Dine-In orders." };
      }

      const table = await db.table.findUnique({
        where: { id: payload.tableId },
      });

      if (!table || table.restaurantId !== payload.restaurantId) {
        return { error: "Specified table does not belong to this restaurant." };
      }

      if (!table.isActive) {
        return { error: `Table ${table.number} is currently inactive.` };
      }

      verifiedTableId = table.id;
    }

    // 2. Idempotency Check
    const existingOrder = await db.order.findUnique({
      where: { idempotencyKey: payload.idempotencyKey },
      include: {
        token: true,
      },
    });

    if (existingOrder) {
      return {
        success: true,
        orderId: existingOrder.id,
        trackingToken: existingOrder.trackingToken || existingOrder.id,
        tokenNumber: existingOrder.token?.tokenNumber,
        total: Number(existingOrder.totalAmount),
      };
    }

    // 3. Server-Side Pricing, Options, and Availability Validation
    let calculatedSubtotal = 0;
    const orderItemsData: any[] = [];
    const unavailableProductIds: string[] = [];

    for (const item of payload.cart) {
      if (!item.quantity || item.quantity <= 0) {
        return { error: "Invalid item quantity in cart." };
      }

      const dbProduct = await db.product.findUnique({
        where: { id: item.productId },
        include: {
          optionGroups: {
            include: {
              options: true,
            },
          },
        },
      });

      if (!dbProduct || !dbProduct.isAvailable || dbProduct.restaurantId !== payload.restaurantId) {
        unavailableProductIds.push(item.productId);
        continue;
      }

      const itemBasePrice = Number(dbProduct.price);
      let itemOptionsPrice = 0;
      const optionsData: any[] = [];

      // Validate option groups
      const selectedOptionIds = new Set(item.options.map((o) => o.optionId));

      for (const group of dbProduct.optionGroups) {
        const groupOptionsSelected = group.options.filter((opt) => selectedOptionIds.has(opt.id));
        const totalSelectionsInGroup = groupOptionsSelected.reduce((sum, opt) => {
          const itemOpt = item.options.find((o) => o.optionId === opt.id);
          return sum + (itemOpt?.quantity || 1);
        }, 0);

        if (group.isRequired && totalSelectionsInGroup < Math.max(1, group.minSelections)) {
          return { error: `Please make a selection for required option '${group.name}' on ${dbProduct.name}.` };
        }

        if (group.maxSelections && totalSelectionsInGroup > group.maxSelections) {
          return { error: `Too many selections for option group '${group.name}' on ${dbProduct.name}.` };
        }
      }

      // Validate and price individual chosen options
      for (const opt of item.options) {
        const dbOption = await db.productOption.findUnique({
          where: { id: opt.optionId },
        });

        if (!dbOption || !dbOption.isAvailable) {
          unavailableProductIds.push(item.productId);
          continue;
        }

        if (opt.quantity > dbOption.maxQuantity) {
          return { error: `Maximum quantity for option '${dbOption.name}' is ${dbOption.maxQuantity}.` };
        }

        const optPrice = Number(dbOption.price);
        itemOptionsPrice += optPrice * opt.quantity;

        optionsData.push({
          optionId: dbOption.id,
          quantity: opt.quantity,
          price: optPrice,
        });
      }

      const itemTotal = (itemBasePrice + itemOptionsPrice) * item.quantity;
      calculatedSubtotal += itemTotal;

      orderItemsData.push({
        productId: dbProduct.id,
        quantity: item.quantity,
        price: itemBasePrice,
        notes: item.notes?.trim() || null,
        options: {
          create: optionsData,
        },
      });
    }

    if (unavailableProductIds.length > 0) {
      return {
        error: "Some items in your cart are no longer available.",
        unavailableProductIds,
      };
    }

    // 4. Fetch Restaurant Settings & Calculate Taxes
    const settings = await db.restaurantSetting.findUnique({
      where: { restaurantId: payload.restaurantId },
    });

    // 5. Coupon Validation
    let calculatedDiscountAmount = 0;
    let validatedCouponCode: string | null = null;

    if (payload.couponCode?.trim()) {
      const code = payload.couponCode.trim().toUpperCase();
      const dbCoupon = await db.coupon.findUnique({
        where: { code, restaurantId: payload.restaurantId },
      });

      const now = new Date();
      if (
        dbCoupon &&
        dbCoupon.isActive &&
        (!dbCoupon.usageLimit || dbCoupon.usageCount < dbCoupon.usageLimit) &&
        (!dbCoupon.startDate || dbCoupon.startDate <= now) &&
        (!dbCoupon.endDate || dbCoupon.endDate >= now) &&
        (!dbCoupon.minOrderValue || calculatedSubtotal >= Number(dbCoupon.minOrderValue))
      ) {
        if (dbCoupon.discountAmount) {
          calculatedDiscountAmount = Number(dbCoupon.discountAmount);
        } else if (dbCoupon.discountPercent) {
          calculatedDiscountAmount = calculatedSubtotal * (dbCoupon.discountPercent / 100);
          if (dbCoupon.maxDiscount) {
            calculatedDiscountAmount = Math.min(calculatedDiscountAmount, Number(dbCoupon.maxDiscount));
          }
        }
        calculatedDiscountAmount = Math.min(calculatedDiscountAmount, calculatedSubtotal);
        validatedCouponCode = code;
      } else {
        return { error: "The entered coupon code is invalid, expired, or does not meet minimum order value." };
      }
    }

    const taxableSubtotal = Math.max(0, calculatedSubtotal - calculatedDiscountAmount);
    const taxPercent = settings?.taxPercent ?? 5.0;
    const calculatedTax = taxableSubtotal * (taxPercent / 100);
    const calculatedTotal = Number((taxableSubtotal + calculatedTax).toFixed(2));

    // 6. Concurrency-Safe Daily Token Generation
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let generatedTokenId: string | null = null;
    let tokenNumber = settings?.dailyTokenStartNumber || 1;

    for (let i = 0; i < 10; i++) {
      const highestToken = await db.token.findFirst({
        where: { date: today },
        orderBy: { tokenNumber: "desc" },
      });

      const nextNumber = highestToken ? highestToken.tokenNumber + 1 : tokenNumber;

      try {
        const newToken = await db.token.create({
          data: {
            tokenNumber: nextNumber,
            date: today,
          },
        });
        generatedTokenId = newToken.id;
        tokenNumber = nextNumber;
        break;
      } catch (e: any) {
        if (e.code !== "P2002") {
          throw e;
        }
      }
    }

    if (!generatedTokenId) {
      return { error: "Failed to generate daily order token. Please retry." };
    }

    // 7. Generate Display Order ID and Secure Tracking Token
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
    const paddedToken = tokenNumber.toString().padStart(6, "0");
    const displayOrderId = `ORD-${dateStr}-${paddedToken}`;
    const secureTrackingToken = crypto.randomBytes(24).toString("base64url");

    // 8. Upsert Customer
    const customer = await db.customer.upsert({
      where: { phone: cleanPhone },
      update: { name: cleanName },
      create: {
        phone: cleanPhone,
        name: cleanName,
        restaurantId: payload.restaurantId,
      },
    });

    // 9. Determine initial payment status
    const initialPaymentStatus = payload.payAtCounter
      ? PaymentStatus.PAY_AT_COUNTER
      : PaymentStatus.PENDING;

    const chosenPaymentMethod = payload.paymentMethod || (payload.payAtCounter ? PaymentMethod.CASH : PaymentMethod.UPI);

    // 10. Create Order Transaction
    const order = await db.order.create({
      data: {
        id: displayOrderId,
        idempotencyKey: payload.idempotencyKey,
        trackingToken: secureTrackingToken,
        source: payload.source,
        type: payload.orderType,
        status: OrderStatus.NEW,
        totalAmount: calculatedTotal,
        restaurantId: payload.restaurantId,
        customerId: customer.id,
        tableId: verifiedTableId,
        tokenId: generatedTokenId,
        couponCode: calculatedDiscountAmount > 0 ? validatedCouponCode : null,
        discountAmount: calculatedDiscountAmount > 0 ? calculatedDiscountAmount : null,
        items: {
          create: orderItemsData,
        },
        payment: {
          create: {
            amount: calculatedTotal,
            method: chosenPaymentMethod,
            status: initialPaymentStatus,
          },
        },
      },
    });

    // Increment coupon usage if discount was applied
    if (calculatedDiscountAmount > 0 && validatedCouponCode) {
      await db.coupon.update({
        where: { code: validatedCouponCode },
        data: { usageCount: { increment: 1 } },
      });
    }

    return {
      success: true,
      orderId: order.id,
      trackingToken: secureTrackingToken,
      tokenNumber,
      total: calculatedTotal,
    };
  } catch (error: any) {
    console.error("createSharedOrder error:", error);
    return { error: "An unexpected error occurred while processing your order." };
  }
}
