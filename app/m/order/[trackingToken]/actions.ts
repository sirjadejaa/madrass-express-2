"use server";

import { db } from "@/lib/db";
import { PaymentStatus } from "@prisma/client";

export async function getOrderTrackingStatus(trackingToken: string) {
  if (!trackingToken || typeof trackingToken !== "string") {
    return { error: "Invalid tracking token" };
  }

  const order = await db.order.findUnique({
    where: { trackingToken },
    select: {
      id: true,
      type: true,
      source: true,
      status: true,
      totalAmount: true,
      discountAmount: true,
      couponCode: true,
      createdAt: true,
      token: {
        select: {
          tokenNumber: true,
        },
      },
      table: {
        select: {
          number: true,
        },
      },
      payment: {
        select: {
          status: true,
          method: true,
          amount: true,
        },
      },
      items: {
        select: {
          id: true,
          quantity: true,
          price: true,
          notes: true,
          product: {
            select: {
              name: true,
              isVegetarian: true,
            },
          },
          options: {
            select: {
              id: true,
              quantity: true,
              price: true,
              option: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
      restaurant: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!order) {
    return { error: "Order not found" };
  }

  return {
    success: true,
    order: {
      displayId: order.id,
      tokenNumber: order.token?.tokenNumber || null,
      status: order.status,
      orderType: order.type,
      tableNumber: order.table?.number || null,
      totalAmount: Number(order.totalAmount),
      discountAmount: order.discountAmount ? Number(order.discountAmount) : 0,
      couponCode: order.couponCode,
      createdAt: order.createdAt,
      paymentStatus: order.payment?.status || PaymentStatus.PENDING,
      paymentMethod: order.payment?.method || null,
      restaurantName: order.restaurant.name,
      items: order.items.map((item) => ({
        id: item.id,
        name: item.product.name,
        isVegetarian: item.product.isVegetarian,
        quantity: item.quantity,
        price: Number(item.price),
        notes: item.notes,
        options: item.options.map((opt) => ({
          id: opt.id,
          name: opt.option.name,
          price: Number(opt.price),
          quantity: opt.quantity,
        })),
      })),
    },
  };
}
