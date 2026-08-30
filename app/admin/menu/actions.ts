"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getProducts(restaurantId: string) {
  return await db.product.findMany({
    where: { restaurantId },
    include: { 
      category: true,
      productComboItems: true,
      recommendations: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createProduct(data: {
  name: string;
  description?: string;
  price: number;
  preparationTime?: number;
  isVegetarian: boolean;
  isPopular: boolean;
  isRecommended: boolean;
  isCombo: boolean;
  isAvailable: boolean;
  categoryId: string;
  restaurantId: string;
  comboItems: { productId: string; quantity: number }[];
  recommendations: string[];
}) {
  await db.product.create({
    data: {
      name: data.name,
      description: data.description,
      price: data.price,
      preparationTime: data.preparationTime,
      isVegetarian: data.isVegetarian,
      isPopular: data.isPopular,
      isRecommended: data.isRecommended,
      isCombo: data.isCombo,
      isAvailable: data.isAvailable,
      categoryId: data.categoryId,
      restaurantId: data.restaurantId,
      productComboItems: {
        create: data.comboItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
        }))
      },
      recommendations: {
        create: data.recommendations.map(id => ({
          recommendedId: id,
        }))
      }
    },
  });

  revalidatePath("/admin/menu");
  return { success: true };
}

export async function updateProduct(id: string, data: {
  name?: string;
  description?: string;
  price?: number;
  preparationTime?: number;
  isVegetarian?: boolean;
  isPopular?: boolean;
  isRecommended?: boolean;
  isCombo?: boolean;
  isAvailable?: boolean;
  categoryId?: string;
  comboItems?: { productId: string; quantity: number }[];
  recommendations?: string[];
}) {
  
  // Update base product
  await db.product.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      price: data.price,
      preparationTime: data.preparationTime,
      isVegetarian: data.isVegetarian,
      isPopular: data.isPopular,
      isRecommended: data.isRecommended,
      isCombo: data.isCombo,
      isAvailable: data.isAvailable,
      categoryId: data.categoryId,
    },
  });

  if (data.comboItems !== undefined) {
    await db.productComboItem.deleteMany({ where: { comboId: id } });
    if (data.comboItems.length > 0) {
      await db.productComboItem.createMany({
        data: data.comboItems.map(item => ({
          comboId: id,
          productId: item.productId,
          quantity: item.quantity,
        }))
      });
    }
  }

  if (data.recommendations !== undefined) {
    await db.productRecommendation.deleteMany({ where: { productId: id } });
    if (data.recommendations.length > 0) {
      await db.productRecommendation.createMany({
        data: data.recommendations.map(recId => ({
          productId: id,
          recommendedId: recId,
        }))
      });
    }
  }

  revalidatePath("/admin/menu");
  return { success: true };
}

export async function toggleProductAvailability(id: string, isAvailable: boolean) {
  await db.product.update({
    where: { id },
    data: { isAvailable },
  });

  revalidatePath("/admin/menu");
  return { success: true };
}
