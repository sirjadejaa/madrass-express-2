"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createOptionGroup(productId: string, data: any) {
  try {
    await db.productOptionGroup.create({
      data: {
        productId,
        name: data.name,
        isRequired: data.isRequired,
        minSelections: data.minSelections,
        maxSelections: data.maxSelections || null,
        order: data.order,
      }
    });
    revalidatePath(`/admin/menu/${productId}/customization`);
    revalidatePath("/kiosk/menu");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Failed to create option group" };
  }
}

export async function deleteOptionGroup(groupId: string, productId: string) {
  try {
    await db.productOptionGroup.delete({
      where: { id: groupId }
    });
    revalidatePath(`/admin/menu/${productId}/customization`);
    revalidatePath("/kiosk/menu");
    return { success: true };
  } catch (error) {
    return { error: "Failed to delete group" };
  }
}

export async function createOption(groupId: string, productId: string, data: any) {
  try {
    await db.productOption.create({
      data: {
        optionGroupId: groupId,
        name: data.name,
        price: data.price,
        maxQuantity: data.maxQuantity,
        isAvailable: data.isAvailable,
      }
    });
    revalidatePath(`/admin/menu/${productId}/customization`);
    revalidatePath("/kiosk/menu");
    return { success: true };
  } catch (error) {
    return { error: "Failed to create option" };
  }
}

export async function deleteOption(optionId: string, productId: string) {
  try {
    await db.productOption.delete({
      where: { id: optionId }
    });
    revalidatePath(`/admin/menu/${productId}/customization`);
    revalidatePath("/kiosk/menu");
    return { success: true };
  } catch (error) {
    return { error: "Failed to delete option" };
  }
}
