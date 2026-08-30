import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { OrderStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const restaurant = await db.restaurant.findFirst({
      include: {
        displaySetting: true
      }
    });

    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    const tokensCount = restaurant.displaySetting?.tokensCount || 6;

    // Fetch PREPARING orders (newest first, limit to tokensCount)
    const preparingOrders = await db.order.findMany({
      where: {
        status: OrderStatus.PREPARING,
        restaurantId: restaurant.id
      },
      include: {
        token: true
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: tokensCount
    });

    // Fetch READY orders (newest first, limit to tokensCount)
    const readyOrders = await db.order.findMany({
      where: {
        status: OrderStatus.READY,
        restaurantId: restaurant.id
      },
      include: {
        token: true
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: tokensCount
    });

    return NextResponse.json({ 
      success: true, 
      preparing: preparingOrders,
      ready: readyOrders,
      settings: restaurant.displaySetting
    });
  } catch (error) {
    console.error("Failed to fetch display orders:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
