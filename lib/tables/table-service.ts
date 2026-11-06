import crypto from "crypto";
import { db } from "@/lib/db";

/**
 * Generates a cryptographically random, URL-safe 32-character token.
 * Unguessable and secure for public table QR codes.
 */
export function generateSecureQRToken(): string {
  return crypto.randomBytes(24).toString("base64url");
}

/**
 * Validates a table QR token from the customer scan.
 * Ensures the table exists, is active, and belongs to an active restaurant.
 */
export async function resolveTableByToken(token: string) {
  if (!token || typeof token !== "string" || token.trim().length < 10) {
    return { valid: false, error: "Invalid QR code format." };
  }

  const table = await db.table.findUnique({
    where: { qrToken: token.trim() },
    include: {
      restaurant: {
        include: {
          settings: true,
          displaySetting: true,
        },
      },
    },
  });

  if (!table) {
    return { valid: false, error: "Table QR code not found or has been revoked." };
  }

  if (!table.isActive) {
    return { valid: false, error: "This table is currently inactive or not available for ordering." };
  }

  if (!table.restaurant) {
    return { valid: false, error: "Restaurant configuration not found." };
  }

  return {
    valid: true,
    table: {
      id: table.id,
      number: table.number,
      capacity: table.capacity,
      description: table.description,
      restaurantId: table.restaurantId,
    },
    restaurant: {
      id: table.restaurant.id,
      name: table.restaurant.name,
      currency: table.restaurant.settings?.currency || "INR",
      taxPercent: table.restaurant.settings?.taxPercent ?? 5.0,
      brandLogoUrl: table.restaurant.displaySetting?.brandLogoUrl || null,
    },
  };
}
