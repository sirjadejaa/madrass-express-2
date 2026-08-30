"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function setupRestaurant(data: {
  name: string;
  phone: string;
  address: string;
  gstNumber?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error("Unauthorized");
  }

  const existing = await db.restaurant.findFirst();
  if (existing) {
    throw new Error("Restaurant already configured.");
  }

  // Create restaurant with basic settings
  const restaurant = await db.restaurant.create({
    data: {
      name: data.name,
      settings: {
        create: {
          currency: "INR",
          taxPercent: 5.0,
          dailyTokenStartNumber: 1
        }
      },
      displaySetting: {
        create: {
          enableVoice: true,
          voiceVolume: 1.0,
          tokensCount: 6
        }
      }
    }
  });

  // Since User requires a restaurantId, we must attach it to the current user.
  // We'll update the user to link to this restaurant and make them an ADMIN.
  await db.user.update({
    where: { email: session.user.email as string },
    data: {
      restaurantId: restaurant.id,
      role: "ADMIN"
    }
  });

  return { success: true };
}
