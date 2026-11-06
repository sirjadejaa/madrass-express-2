import { db } from "@/lib/db";
import { TablesClient, AdminTable } from "./client";

export const dynamic = "force-dynamic";

export default async function AdminTablesPage() {
  const restaurant = await db.restaurant.findFirst({
    select: {
      id: true,
      name: true,
    },
  });

  if (!restaurant) {
    return <div className="p-8">No restaurant configured. Please complete initial setup.</div>;
  }

  const rawTables = await db.table.findMany({
    where: { restaurantId: restaurant.id },
    orderBy: { number: "asc" },
  });

  const tables: AdminTable[] = rawTables.map((t) => ({
    id: t.id,
    number: t.number,
    capacity: t.capacity,
    description: t.description,
    qrToken: t.qrToken,
    isActive: t.isActive,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  }));

  return (
    <TablesClient
      initialTables={tables}
      restaurant={restaurant}
    />
  );
}
