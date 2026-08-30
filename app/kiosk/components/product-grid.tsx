"use client";

import { KioskProduct } from "../menu/types";
import { ProductCard } from "./product-card";

interface ProductGridProps {
  products: KioskProduct[];
  activeCategoryId: string | null;
  onProductClick: (product: KioskProduct) => void;
}

export function ProductGrid({ products, activeCategoryId, onProductClick }: ProductGridProps) {
  const filteredProducts = activeCategoryId 
    ? products.filter(p => p.categoryId === activeCategoryId)
    : products;

  if (filteredProducts.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <div className="text-6xl mb-4">🍽️</div>
        <h3 className="text-2xl font-bold text-zinc-400">No items found</h3>
        <p className="text-muted-foreground mt-2">Try selecting a different category.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-32">
        {filteredProducts.map((product) => (
          <ProductCard 
            key={product.id} 
            product={product} 
            onClick={onProductClick} 
          />
        ))}
      </div>
    </div>
  );
}
