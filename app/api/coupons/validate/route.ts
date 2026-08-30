import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { code, cartTotal } = await req.json();

    if (!code || cartTotal === undefined) {
      return NextResponse.json({ error: "Missing code or cartTotal" }, { status: 400 });
    }

    const restaurant = await db.restaurant.findFirst();
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    const coupon = await db.coupon.findFirst({
      where: {
        code: {
          equals: code,
          mode: 'insensitive',
        },
        restaurantId: restaurant.id,
      },
    });

    if (!coupon) {
      return NextResponse.json({ error: "Invalid coupon code" }, { status: 404 });
    }

    if (!coupon.isActive) {
      return NextResponse.json({ error: "Coupon is no longer active" }, { status: 400 });
    }

    const now = new Date();
    if (coupon.startDate && coupon.startDate > now) {
      return NextResponse.json({ error: "Coupon is not valid yet" }, { status: 400 });
    }

    if (coupon.endDate && coupon.endDate < now) {
      return NextResponse.json({ error: "Coupon has expired" }, { status: 400 });
    }

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return NextResponse.json({ error: "Coupon usage limit reached" }, { status: 400 });
    }

    if (coupon.minOrderValue && cartTotal < Number(coupon.minOrderValue)) {
      return NextResponse.json({ error: `Minimum order value is ₹${coupon.minOrderValue}` }, { status: 400 });
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discountAmount) {
      discount = Number(coupon.discountAmount);
    } else if (coupon.discountPercent) {
      discount = cartTotal * (coupon.discountPercent / 100);
    }

    if (coupon.maxDiscount && discount > Number(coupon.maxDiscount)) {
      discount = Number(coupon.maxDiscount);
    }

    // Discount cannot exceed cart total
    if (discount > cartTotal) {
      discount = cartTotal;
    }

    return NextResponse.json({
      success: true,
      discountAmount: discount,
      code: coupon.code
    });

  } catch (error) {
    console.error("Coupon validation error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
