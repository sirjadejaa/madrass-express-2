"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { generateSecureQRToken } from "@/lib/tables/table-service";
import { OrderStatus } from "@prisma/client";

async function checkAdminOrManager() {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "MANAGER"].includes(session.user.role)) {
    throw new Error("Unauthorized. Insufficient permissions.");
  }
  return session;
}

export async function createTableAction(data: {
  number: string;
  capacity?: number;
  description?: string;
  restaurantId: string;
}) {
  try {
    await checkAdminOrManager();

    const cleanNumber = data.number?.trim();
    if (!cleanNumber) {
      return { error: "Table number/name is required." };
    }

    // Check for duplicate table number within the same restaurant
    const existing = await db.table.findFirst({
      where: {
        restaurantId: data.restaurantId,
        number: { equals: cleanNumber, mode: "insensitive" },
      },
    });

    if (existing) {
      return { error: `Table '${cleanNumber}' already exists in this restaurant.` };
    }

    const qrToken = generateSecureQRToken();

    const table = await db.table.create({
      data: {
        number: cleanNumber,
        capacity: data.capacity ? Number(data.capacity) : null,
        description: data.description?.trim() || null,
        restaurantId: data.restaurantId,
        qrToken,
        isActive: true,
      },
    });

    revalidatePath("/admin/tables");
    return { success: true, table };
  } catch (error: any) {
    console.error("Create table error:", error);
    return { error: error.message || "Failed to create table." };
  }
}

export async function updateTableAction(
  tableId: string,
  data: {
    number?: string;
    capacity?: number | null;
    description?: string | null;
    isActive?: boolean;
  }
) {
  try {
    await checkAdminOrManager();

    const table = await db.table.findUnique({
      where: { id: tableId },
    });

    if (!table) {
      return { error: "Table not found." };
    }

    if (data.number !== undefined) {
      const cleanNumber = data.number.trim();
      if (!cleanNumber) {
        return { error: "Table number cannot be empty." };
      }

      // Check if duplicate number exists in restaurant
      const duplicate = await db.table.findFirst({
        where: {
          restaurantId: table.restaurantId,
          number: { equals: cleanNumber, mode: "insensitive" },
          id: { not: tableId },
        },
      });

      if (duplicate) {
        return { error: `Table '${cleanNumber}' already exists.` };
      }
    }

    await db.table.update({
      where: { id: tableId },
      data: {
        ...(data.number !== undefined && { number: data.number.trim() }),
        ...(data.capacity !== undefined && {
          capacity: data.capacity !== null ? Number(data.capacity) : null,
        }),
        ...(data.description !== undefined && {
          description: data.description ? data.description.trim() : null,
        }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    revalidatePath("/admin/tables");
    return { success: true };
  } catch (error: any) {
    console.error("Update table error:", error);
    return { error: error.message || "Failed to update table." };
  }
}

export async function rotateTableQRTokenAction(tableId: string) {
  try {
    await checkAdminOrManager();

    const table = await db.table.findUnique({
      where: { id: tableId },
    });

    if (!table) {
      return { error: "Table not found." };
    }

    const newQrToken = generateSecureQRToken();

    await db.table.update({
      where: { id: tableId },
      data: { qrToken: newQrToken },
    });

    revalidatePath("/admin/tables");
    return { success: true, qrToken: newQrToken };
  } catch (error: any) {
    console.error("Rotate table QR token error:", error);
    return { error: error.message || "Failed to rotate QR token." };
  }
}

export async function deleteTableAction(tableId: string) {
  try {
    await checkAdminOrManager();

    // Check if table has active orders
    const activeOrder = await db.order.findFirst({
      where: {
        tableId,
        status: {
          in: [
            OrderStatus.NEW,
            OrderStatus.ACCEPTED,
            OrderStatus.PREPARING,
            OrderStatus.READY,
          ],
        },
      },
    });

    if (activeOrder) {
      return {
        error:
          "Cannot delete table with active orders. Complete or cancel active orders first.",
      };
    }

    await db.table.delete({
      where: { id: tableId },
    });

    revalidatePath("/admin/tables");
    return { success: true };
  } catch (error: any) {
    console.error("Delete table error:", error);
    return { error: error.message || "Failed to delete table." };
  }
}
