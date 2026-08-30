"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function createCoupon(data: {
  code: string;
  discountAmount: number | null;
  discountPercent: number | null;
  minOrderValue: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  isActive: boolean;
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
      return { success: false, error: "Unauthorized" };
    }

    const restaurant = await db.restaurant.findFirst();
    if (!restaurant) {
      return { success: false, error: "Restaurant not found" };
    }

    // Check if code exists
    const existing = await db.coupon.findFirst({
      where: { code: data.code, restaurantId: restaurant.id }
    });

    if (existing) {
      return { success: false, error: "Coupon code already exists" };
    }

    await db.coupon.create({
      data: {
        code: data.code,
        discountAmount: data.discountAmount,
        discountPercent: data.discountPercent,
        minOrderValue: data.minOrderValue,
        maxDiscount: data.maxDiscount,
        usageLimit: data.usageLimit,
        isActive: data.isActive,
        restaurantId: restaurant.id
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error("Failed to create coupon:", error);
    return { success: false, error: "Internal Server Error" };
  }
}

export async function updateCoupon(id: string, data: {
  code: string;
  discountAmount: number | null;
  discountPercent: number | null;
  minOrderValue: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  isActive: boolean;
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
      return { success: false, error: "Unauthorized" };
    }

    const restaurant = await db.restaurant.findFirst();
    if (!restaurant) {
      return { success: false, error: "Restaurant not found" };
    }

    // Check if code exists and belongs to another coupon
    const existing = await db.coupon.findFirst({
      where: { code: data.code, restaurantId: restaurant.id, NOT: { id } }
    });

    if (existing) {
      return { success: false, error: "Coupon code already exists" };
    }

    await db.coupon.update({
      where: { id, restaurantId: restaurant.id },
      data: {
        code: data.code,
        discountAmount: data.discountAmount,
        discountPercent: data.discountPercent,
        minOrderValue: data.minOrderValue,
        maxDiscount: data.maxDiscount,
        usageLimit: data.usageLimit,
        isActive: data.isActive,
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error("Failed to update coupon:", error);
    return { success: false, error: "Internal Server Error" };
  }
}

export async function deleteCoupon(id: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
      return { success: false, error: "Unauthorized" };
    }

    const restaurant = await db.restaurant.findFirst();
    if (!restaurant) {
      return { success: false, error: "Restaurant not found" };
    }

    await db.coupon.delete({
      where: { id, restaurantId: restaurant.id }
    });

    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete coupon:", error);
    return { success: false, error: "Internal Server Error" };
  }
}
