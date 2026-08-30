import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { CustomizationClient } from "./client";

export const dynamic = "force-dynamic";

export default async function ProductCustomizationPage({ params }: { params: { id: string } }) {
  const product = await db.product.findUnique({
    where: { id: params.id },
    include: {
      optionGroups: {
        include: {
          options: {
            orderBy: { order: 'asc' }
          }
        },
        orderBy: { order: 'asc' }
      }
    }
  });

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Customization: {product.name}</h2>
        <p className="text-muted-foreground mt-1">Manage add-ons, sizes, and options for this product.</p>
      </div>

      <CustomizationClient product={product} />
    </div>
  );
}
