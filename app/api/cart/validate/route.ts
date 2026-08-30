import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

type ValidateCartPayload = {
  items: {
    productId: string;
    quantity: number;
    options: {
      optionId: string;
      quantity: number;
    }[];
  }[];
};

export async function POST(req: Request) {
  try {
    const body: ValidateCartPayload = await req.json();
    let calculatedTotal = 0;
    
    // We fetch all needed products and options in a single query (or parallel)
    // for production performance, but for this exercise we can iterate.
    const productIds = body.items.map(i => i.productId);
    
    const dbProducts = await db.product.findMany({
      where: { id: { in: productIds } },
      include: {
        optionGroups: {
          include: {
            options: true
          }
        }
      }
    });

    const productMap = new Map(dbProducts.map(p => [p.id, p]));

    for (const item of body.items) {
      const dbProduct = productMap.get(item.productId);
      
      if (!dbProduct) {
        return NextResponse.json({ error: `Product not found: ${item.productId}` }, { status: 400 });
      }

      if (!dbProduct.isAvailable) {
        return NextResponse.json({ error: `Product unavailable: ${dbProduct.name}` }, { status: 400 });
      }

      let itemTotal = Number(dbProduct.price);

      // Create a map of all valid options for this product
      const validOptions = new Map();
      dbProduct.optionGroups.forEach(og => {
        og.options.forEach(o => {
          validOptions.set(o.id, { ...o, group: og });
        });
      });

      // Track group selections for validation
      const groupSelections = new Map<string, number>();

      for (const opt of item.options) {
        const dbOption = validOptions.get(opt.optionId);
        
        if (!dbOption) {
          return NextResponse.json({ error: `Invalid option ${opt.optionId} for product ${dbProduct.name}` }, { status: 400 });
        }
        
        if (!dbOption.isAvailable) {
          return NextResponse.json({ error: `Option unavailable: ${dbOption.name}` }, { status: 400 });
        }
        
        if (opt.quantity > dbOption.maxQuantity) {
          return NextResponse.json({ error: `Exceeded max quantity for ${dbOption.name}` }, { status: 400 });
        }

        const groupId = dbOption.group.id;
        groupSelections.set(groupId, (groupSelections.get(groupId) || 0) + 1);

        itemTotal += (Number(dbOption.price) * opt.quantity);
      }

      // Validate required groups and max selections
      for (const og of dbProduct.optionGroups) {
        const selections = groupSelections.get(og.id) || 0;
        if (og.isRequired && selections < og.minSelections) {
          return NextResponse.json({ error: `Missing required options for ${dbProduct.name}: ${og.name}` }, { status: 400 });
        }
        if (og.maxSelections && selections > og.maxSelections) {
          return NextResponse.json({ error: `Too many options selected for ${dbProduct.name}: ${og.name}` }, { status: 400 });
        }
      }

      calculatedTotal += (itemTotal * item.quantity);
    }

    return NextResponse.json({
      success: true,
      subtotal: calculatedTotal,
      tax: calculatedTotal * 0.05,
      total: calculatedTotal * 1.05
    });

  } catch (error) {
    console.error("Cart validation error:", error);
    return NextResponse.json({ error: "Internal server error during cart validation." }, { status: 500 });
  }
}
