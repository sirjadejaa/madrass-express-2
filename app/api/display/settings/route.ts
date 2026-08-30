import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const restaurant = await db.restaurant.findFirst({
      include: {
        displaySetting: true
      }
    });

    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    let displaySetting = restaurant.displaySetting;
    if (!displaySetting) {
      // Create default
      displaySetting = await db.displaySetting.create({
        data: {
          restaurantId: restaurant.id
        }
      });
    }

    return NextResponse.json({ success: true, settings: displaySetting });
  } catch (error) {
    console.error("Failed to fetch display settings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { enableVoice, voiceVolume, tokensCount, brandLogoUrl } = body;

    const restaurant = await db.restaurant.findFirst();
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    const displaySetting = await db.displaySetting.upsert({
      where: {
        restaurantId: restaurant.id
      },
      update: {
        enableVoice,
        voiceVolume,
        tokensCount,
        brandLogoUrl
      },
      create: {
        restaurantId: restaurant.id,
        enableVoice,
        voiceVolume,
        tokensCount,
        brandLogoUrl
      }
    });

    return NextResponse.json({ success: true, settings: displaySetting });
  } catch (error) {
    console.error("Failed to update display settings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
