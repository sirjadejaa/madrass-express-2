import { db } from "@/lib/db";
import { KioskClient } from "./client";
import { KioskCategory } from "../components/category-sidebar";
import { KioskProduct } from "./types";

export const revalidate = 60;

export default async function KioskMenuPage() {
  const restaurant = await db.restaurant.findFirst({
    include: { settings: true }
  });
  
  if (!restaurant) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-stone-50">
        <h2 className="text-3xl font-bold mb-4">No restaurant configured</h2>
        <p className="text-muted-foreground mb-8 text-lg">Please set up the restaurant in the admin dashboard to start using the kiosk.</p>
        <a href="/admin/setup" className="inline-flex h-12 items-center justify-center rounded-full bg-amber-600 px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-amber-700">
          GO TO ADMIN SETUP
        </a>
      </div>
    );
  }

  const tables = await db.table.findMany({
    where: { restaurantId: restaurant.id },
    orderBy: { number: 'asc' },
    select: { id: true, number: true }
  });

  const categories = await db.category.findMany({
    where: { restaurantId: restaurant.id, isActive: true },
    orderBy: { order: 'asc' },
  });

  const products = await db.product.findMany({
    where: { 
      restaurantId: restaurant.id,
      category: { isActive: true } 
    },
    include: {
      category: true,
      image: true,
      model3D: true,
      optionGroups: {
        include: {
          options: {
            where: { isAvailable: true },
            orderBy: { order: 'asc' }
          }
        },
        orderBy: { order: 'asc' }
      },
      recommendations: {
        include: {
          recommended: {
            include: { image: true }
          }
        }
      }
    },
    orderBy: [
      { category: { order: 'asc' } },
      { name: 'asc' }
    ]
  });

  const kioskProducts: KioskProduct[] = products.map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: Number(p.price),
    isVegetarian: p.isVegetarian,
    isPopular: p.isPopular,
    isAvailable: p.isAvailable,
    categoryId: p.categoryId,
    image: p.image ? { url: p.image.url } : null,
    model3D: p.model3D ? { 
      url: p.model3D.url,
      enabled: p.model3D.enabled,
      autoRotate: p.model3D.autoRotate,
      rotationSpeed: p.model3D.rotationSpeed
    } : null,
    optionGroups: p.optionGroups.map(og => ({
      id: og.id,
      name: og.name,
      isRequired: og.isRequired,
      minSelections: og.minSelections,
      maxSelections: og.maxSelections,
      options: og.options.map(o => ({
        id: o.id,
        name: o.name,
        price: Number(o.price),
        maxQuantity: o.maxQuantity
      }))
    })),
    isCombo: p.isCombo,
    recommendations: p.recommendations.map(r => ({
      id: r.recommended.id,
      name: r.recommended.name,
      price: Number(r.recommended.price),
      image: r.recommended.image ? { url: r.recommended.image.url } : null
    }))
  }));

  const mappedCategories: KioskCategory[] = categories.map(c => ({
    id: c.id,
    name: c.name,
    order: c.order,
  }));

  return (
    <KioskClient 
      categories={mappedCategories} 
      products={kioskProducts} 
      tables={tables}
      restaurantName={restaurant.name}
      taxPercent={restaurant.settings?.taxPercent ?? 5.0}
    />
  );
}
