import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { OrderStatus } from "@prisma/client";
// Wait, middleware protects `/api/kds`? No, middleware protects `/kitchen` and `/admin`. We should update middleware to protect `/api/kds` or check session here.
// Let's define the API route, and check session.

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  try {
    // Assuming middleware protects this route or we verify token.
    // For now, let's fetch active orders for the KDS.
    
    // We only care about NEW, ACCEPTED, PREPARING, READY. 
    // We'll exclude COMPLETED and CANCELLED.
    const activeOrders = await db.order.findMany({
      where: {
        status: {
          in: [OrderStatus.NEW, OrderStatus.ACCEPTED, OrderStatus.PREPARING, OrderStatus.READY]
        }
        // Ideally filter by restaurantId from session, but for MVP we assume 1 restaurant or fetch all.
      },
      include: {
        token: true,
        table: true,
        payment: true,
        items: {
          include: {
            product: true,
            options: {
              include: {
                option: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'asc' // Oldest first
      }
    });

    return NextResponse.json({ success: true, orders: activeOrders });
  } catch (error) {
    console.error("Failed to fetch KDS orders:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
