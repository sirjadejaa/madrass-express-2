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
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 lg:p-12">
        <div className="w-24 h-24 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-5xl mb-6 shadow-inner">
          🍽️
        </div>
        <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">No items found</h3>
        <p className="text-zinc-500 mt-2 max-w-sm">Try selecting a different category or adjusting your search.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto no-scrollbar scroll-smooth">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 pb-40 lg:pb-8 pt-2 lg:pt-16 max-w-[1920px] mx-auto">
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
