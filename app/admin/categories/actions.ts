"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getCategories(restaurantId: string) {
  return await db.category.findMany({
    where: { restaurantId },
    orderBy: { order: "asc" },
  });
}

export async function createCategory(data: {
  name: string;
  description?: string;
  restaurantId: string;
}) {
  const count = await db.category.count({ where: { restaurantId: data.restaurantId } });
  
  await db.category.create({
    data: {
      name: data.name,
      description: data.description,
      restaurantId: data.restaurantId,
      order: count,
    },
  });

  revalidatePath("/admin/categories");
  return { success: true };
}

export async function updateCategory(id: string, data: {
  name?: string;
  description?: string;
  isActive?: boolean;
}) {
  await db.category.update({
    where: { id },
    data,
  });

  revalidatePath("/admin/categories");
  return { success: true };
}

export async function deleteCategory(id: string) {
  // We might want to check if it has products first, but for now we allow deletion or soft-delete (isActive = false)
  // Let's soft-delete it by setting isActive to false for safety, or hard delete if you prefer.
  await db.category.delete({
    where: { id },
  });

  revalidatePath("/admin/categories");
  return { success: true };
}

export async function reorderCategories(items: { id: string, order: number }[]) {
  // Update order in a transaction
  await db.$transaction(
    items.map((item) =>
      db.category.update({
        where: { id: item.id },
        data: { order: item.order },
      })
    )
  );

  revalidatePath("/admin/categories");
  return { success: true };
}
