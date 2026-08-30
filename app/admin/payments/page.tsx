import { db } from "@/lib/db";
import { PaymentsClient } from "./client";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  const restaurant = await db.restaurant.findFirst();
  
  if (!restaurant) {
    return <div className="p-8">No restaurant configured.</div>;
  }

  const payments = await db.payment.findMany({
    where: { order: { restaurantId: restaurant.id } },
    orderBy: { createdAt: "desc" },
    include: {
      order: {
        include: {
          token: true,
          customer: true
        }
      }
    }
  });

  return <PaymentsClient initialPayments={payments} />;
}
