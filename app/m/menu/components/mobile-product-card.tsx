"use client";

import { MobileProduct } from "../types";
import { useMobileCartStore } from "@/lib/store/mobile-cart-store";
import { Plus, UtensilsCrossed } from "lucide-react";
import Image from "next/image";

interface MobileProductCardProps {
  product: MobileProduct;
  onSelect: (product: MobileProduct) => void;
}

export function MobileProductCard({ product, onSelect }: MobileProductCardProps) {
  const cart = useMobileCartStore((state) => state.cart);
  const addToCart = useMobileCartStore((state) => state.addToCart);

  // Check how many of this product are in cart
  const cartCount = cart
    .filter((c) => c.productId === product.id)
    .reduce((sum, c) => sum + c.quantity, 0);

  const hasOptions = product.optionGroups && product.optionGroups.length > 0;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasOptions) {
      // Must open modal to choose options
      onSelect(product);
    } else {
      addToCart({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        options: [],
        isVegetarian: product.isVegetarian,
        imageUrl: product.imageUrl,
      });
    }
  };

  return (
    <div
      onClick={() => onSelect(product)}
      className="p-3.5 bg-white border border-zinc-100/80 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-3 cursor-pointer group active:scale-[0.99]"
    >
      {/* Product Details (Left) */}
      <div className="flex-1 min-w-0 space-y-1">
        {/* Veg/Non-Veg & Popular Tag */}
        <div className="flex items-center gap-1.5">
          <div
            className={`w-3.5 h-3.5 border-2 flex items-center justify-center rounded-sm bg-white shrink-0 ${
              product.isVegetarian ? "border-emerald-600" : "border-red-600"
            }`}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                product.isVegetarian ? "bg-emerald-600" : "bg-red-600"
              }`}
            />
          </div>
          {product.isPopular && (
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-1.5 py-0.2 rounded-md">
              Bestseller
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-extrabold text-sm text-zinc-900 group-hover:text-amber-700 transition-colors leading-tight truncate">
          {product.name}
        </h3>

        {/* Price */}
        <div className="text-xs font-black text-zinc-900">
          ₹{product.price}
        </div>

        {/* Description */}
        {product.description && (
          <p className="text-[11px] text-zinc-500 font-medium line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        )}
      </div>

      {/* Product Image & Add Button (Right) */}
      <div className="relative shrink-0 flex flex-col items-center">
        <div className="w-24 h-24 rounded-2xl overflow-hidden bg-stone-100 relative shadow-inner border border-zinc-100">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="96px"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-amber-500/5 text-amber-600/40">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
          )}
        </div>

        {/* Add / Quantity Button overlay */}
        <div className="-mt-3 z-10">
          <button
            onClick={handleQuickAdd}
            className={`h-7 px-3.5 rounded-xl font-black text-xs shadow-md transition-all flex items-center gap-1 border ${
              cartCount > 0
                ? "bg-amber-600 border-amber-600 text-white"
                : "bg-white border-amber-600 text-amber-700 hover:bg-amber-50"
            }`}
          >
            {cartCount > 0 ? (
              <span>{cartCount} in Cart</span>
            ) : (
              <>
                <span>{hasOptions ? "CUSTOMIZE" : "ADD"}</span>
                <Plus className="w-3 h-3 stroke-[3]" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
