"use server";

import { db } from "@/lib/db";
import { OrderType, OrderStatus, PaymentStatus } from "@prisma/client";

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
  try {
    // 1. Basic Validations
    if (!payload.idempotencyKey) return { error: "Missing idempotency key." };
    if (!payload.customerName || !payload.customerPhone) {
      return { error: "Customer name and phone are required." };
    }
    if (payload.orderType === OrderType.DINE_IN && !payload.tableId) {
      return { error: "Table number is required for Dine In." };
    }
    if (!payload.cart || payload.cart.length === 0) {
      return { error: "Cart is empty." };
    }

    // 2. Idempotency Check
    const existingOrder = await db.order.findUnique({
      where: { idempotencyKey: payload.idempotencyKey },
    });
    
    if (existingOrder) {
      return { success: true, orderId: existingOrder.id };
    }

    // 3. Server-Side Pricing Validation
    let calculatedSubtotal = 0;
    const orderItemsData: any[] = [];
    const unavailableProductIds: string[] = [];
    
    for (const item of payload.cart) {
      const dbProduct = await db.product.findUnique({
        where: { id: item.productId },
      });
      if (!dbProduct || !dbProduct.isAvailable) {
        unavailableProductIds.push(item.productId);
        continue;
      }

      const itemBasePrice = Number(dbProduct.price);
      let optionsPrice = 0;
      const optionsData: any[] = [];

      for (const opt of item.options) {
        const dbOption = await db.productOption.findUnique({
          where: { id: opt.optionId }
        });
        if (!dbOption || !dbOption.isAvailable) {
          unavailableProductIds.push(item.productId); // Mark the product itself as unavailable if its option is gone
          continue;
        }
        const optPrice = Number(dbOption.price);
        optionsPrice += optPrice * opt.quantity;
        
        optionsData.push({
          optionId: dbOption.id,
          quantity: opt.quantity,
          price: optPrice
        });
      }

      const itemTotal = (itemBasePrice + optionsPrice) * item.quantity;
      calculatedSubtotal += itemTotal;

      orderItemsData.push({
        productId: dbProduct.id,
        quantity: item.quantity,
        price: itemBasePrice,
        options: {
          create: optionsData
        }
      });
    }

    if (unavailableProductIds.length > 0) {
      return { 
        error: "Some items in your cart are no longer available.", 
        unavailableProductIds 
      };
    }

    const settings = await db.restaurantSetting.findUnique({
      where: { restaurantId: payload.restaurantId }
    });
    
    // Validate Coupon if provided
    let calculatedDiscountAmount = 0;
    if (payload.couponCode) {
      const dbCoupon = await db.coupon.findUnique({
        where: { code: payload.couponCode, restaurantId: payload.restaurantId }
      });

      if (dbCoupon && dbCoupon.isActive && 
          (!dbCoupon.usageLimit || dbCoupon.usageCount < dbCoupon.usageLimit) &&
          (!dbCoupon.startDate || dbCoupon.startDate <= new Date()) &&
          (!dbCoupon.endDate || dbCoupon.endDate >= new Date()) &&
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
      } else {
        return { error: "Invalid or expired coupon applied." };
      }
    }

    const taxableSubtotal = Math.max(0, calculatedSubtotal - calculatedDiscountAmount);
    
    const taxPercent = settings?.taxPercent ?? 5.0;
    const calculatedTax = taxableSubtotal * (taxPercent / 100);
    const calculatedTotal = taxableSubtotal + calculatedTax;

    // Increment coupon usage if a valid discount was applied
    if (calculatedDiscountAmount > 0 && payload.couponCode) {
      await db.coupon.update({
        where: { code: payload.couponCode },
        data: { usageCount: { increment: 1 } }
      });
    }

    // 4. Upsert Customer
    const customer = await db.customer.upsert({
      where: { phone: payload.customerPhone },
      update: { name: payload.customerName },
      create: {
        phone: payload.customerPhone,
        name: payload.customerName,
        restaurantId: payload.restaurantId
      }
    });

    // 5. Concurrency-Safe Token Generation
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of day

    let generatedTokenId: string | null = null;
    let tokenNumber = settings?.dailyTokenStartNumber || 1;

    for (let i = 0; i < 10; i++) {
      const highestToken = await db.token.findFirst({
        where: { date: today },
        orderBy: { tokenNumber: 'desc' }
      });
      
      const nextNumber = highestToken ? highestToken.tokenNumber + 1 : tokenNumber;
      
      try {
        const newToken = await db.token.create({
          data: {
            tokenNumber: nextNumber,
            date: today,
          }
        });
        generatedTokenId = newToken.id;
        tokenNumber = nextNumber;
        break;
      } catch (e: any) {
        // P2002 is Prisma unique constraint violation
        if (e.code !== 'P2002') {
          throw e; // Rethrow unexpected errors
        }
        // Loop and try again if P2002
      }
    }

    if (!generatedTokenId) {
      return { error: "Failed to generate a token. Please try again." };
    }

    // 6. Generate Order ID (e.g. ORD-20260829-000127)
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const paddedToken = tokenNumber.toString().padStart(6, '0');
    const displayOrderId = `ORD-${dateStr}-${paddedToken}`;

    // 7. Create Order Transaction
    const order = await db.order.create({
      data: {
        id: displayOrderId,
        idempotencyKey: payload.idempotencyKey,
        type: payload.orderType,
        status: OrderStatus.NEW,
        totalAmount: calculatedTotal,
        restaurantId: payload.restaurantId,
        customerId: customer.id,
        tableId: payload.tableId,
        tokenId: generatedTokenId,
        couponCode: calculatedDiscountAmount > 0 ? payload.couponCode : null,
        discountAmount: calculatedDiscountAmount > 0 ? calculatedDiscountAmount : null,
        items: {
          create: orderItemsData
        },
        payment: {
          create: {
            amount: calculatedTotal,
            method: "UPI", // Defaulting for now, real implementation would let user select or default to counter
            status: PaymentStatus.PENDING
          }
        }
      }
    });
    
    return { success: true, orderId: order.id };
  } catch (error) {
    console.error("Checkout process error:", error);
    return { error: "Internal server error during checkout process." };
  }
}
