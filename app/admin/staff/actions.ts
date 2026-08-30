"use server";

import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";

export async function getStaff(restaurantId: string) {
  return await db.user.findMany({
    where: { restaurantId },
    orderBy: { createdAt: "desc" },
  });
}

export async function createStaff(data: {
  name: string;
  email: string;
  role: Role;
  password?: string;
  restaurantId: string;
}) {
  const existingUser = await db.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    return { error: "Email already in use" };
  }

  const password = data.password || "123456";
  const passwordHash = await bcrypt.hash(password, 10);

  await db.user.create({
    data: {
      name: data.name,
      email: data.email,
      role: data.role,
      passwordHash,
      restaurantId: data.restaurantId,
    },
  });

  revalidatePath("/admin/staff");
  return { success: true };
}

export async function updateStaff(id: string, data: {
  name?: string;
  role?: Role;
  isActive?: boolean;
}) {
  await db.user.update({
    where: { id },
    data,
  });

  revalidatePath("/admin/staff");
  return { success: true };
}

export async function resetPassword(id: string, newPassword?: string) {
  const password = newPassword || "123456";
  const passwordHash = await bcrypt.hash(password, 10);
  
  await db.user.update({
    where: { id },
    data: { passwordHash },
  });

  return { success: true };
}
