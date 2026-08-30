"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function upsert3DModel(productId: string, data: {
  url: string;
  thumbnail: string | null;
  enabled: boolean;
  rotationSpeed: number;
  autoRotate: boolean;
}) {
  try {
    await db.product3DModel.upsert({
      where: { productId },
      update: {
        url: data.url,
        thumbnail: data.thumbnail,
        enabled: data.enabled,
        rotationSpeed: data.rotationSpeed,
        autoRotate: data.autoRotate,
      },
      create: {
        productId,
        url: data.url,
        thumbnail: data.thumbnail,
        enabled: data.enabled,
        rotationSpeed: data.rotationSpeed,
        autoRotate: data.autoRotate,
      }
    });

    revalidatePath("/admin/3d-menu");
    revalidatePath("/kiosk/menu");
    return { success: true };
  } catch (error) {
    console.error("Failed to upsert 3D model:", error);
    return { error: "Failed to save 3D model configuration." };
  }
}

export async function delete3DModel(productId: string) {
  try {
    await db.product3DModel.delete({
      where: { productId }
    });

    revalidatePath("/admin/3d-menu");
    revalidatePath("/kiosk/menu");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete 3D model:", error);
    return { error: "Failed to delete 3D model." };
  }
}
