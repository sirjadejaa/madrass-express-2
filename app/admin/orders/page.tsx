import { db } from "@/lib/db";
import { OrdersClient } from "./client";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const restaurant = await db.restaurant.findFirst();
  
  if (!restaurant) {
    return <div className="p-8">No restaurant configured.</div>;
  }

  const orders = await db.order.findMany({
    where: { restaurantId: restaurant.id },
    orderBy: { createdAt: "desc" },
    include: {
      customer: true,
      payment: true,
      table: true,
      token: true,
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
    }
  });

  return <OrdersClient initialOrders={orders} />;
}
