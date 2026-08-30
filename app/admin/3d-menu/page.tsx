import { db } from "@/lib/db";
import { Admin3DMenuClient } from "./client";

export const dynamic = "force-dynamic";

export default async function Admin3DMenuPage() {
  const restaurant = await db.restaurant.findFirst();
  
  if (!restaurant) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center h-full">
        <h2 className="text-2xl font-bold mb-4">No restaurant configured</h2>
        <a href="/admin/setup" className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
          GO TO ADMIN SETUP
        </a>
      </div>
    );
  }

  const products = await db.product.findMany({
    where: { restaurantId: restaurant.id },
    include: {
      category: true,
      model3D: true,
    },
    orderBy: [
      { category: { order: 'asc' } },
      { name: 'asc' }
    ]
  });

  return <Admin3DMenuClient products={products} />;
}
