"use client";

import { KioskProduct } from "../menu/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Cuboid, Leaf, Plus, Minus } from "lucide-react";
import Image from "next/image";
import { useKioskStore } from "@/lib/store/kiosk-store";
import { Button } from "@/components/ui/button";

interface ProductCardProps {
  product: KioskProduct;
  onClick: (product: KioskProduct) => void;
}

export function ProductCard({ product, onClick }: ProductCardProps) {
  const cart = useKioskStore((state) => state.cart);
  const addToCart = useKioskStore((state) => state.addToCart);
  const updateQuantity = useKioskStore((state) => state.updateQuantity);
  const removeFromCart = useKioskStore((state) => state.removeFromCart);

  const hasRequiredOptions = product.optionGroups?.some(g => g.isRequired);
  
  // Find if this specific product is already in the cart (without options if it has none)
  const cartItems = cart.filter(item => item.productId === product.id);
  const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent opening the modal if not needed
    if (!product.isAvailable) return;

    if (hasRequiredOptions) {
      onClick(product);
    } else {
      if (cartItems.length > 0) {
        // Just increment the first one found
        updateQuantity(cartItems[0].id, cartItems[0].quantity + 1);
      } else {
        addToCart({
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          options: []
        });
      }
    }
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (cartItems.length > 0) {
      const item = cartItems[0];
      if (item.quantity > 1) {
        updateQuantity(item.id, item.quantity - 1);
      } else {
        removeFromCart(item.id);
      }
    }
  };

  return (
    <Card 
      className={`overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-3xl group flex flex-col ${!product.isAvailable ? 'opacity-60 grayscale' : ''}`}
      onClick={() => product.isAvailable && onClick(product)}
    >
      <div className="relative aspect-[4/3] w-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
        {product.image ? (
          <Image 
            src={product.image.url} 
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl opacity-50">
            🍲
          </div>
        )}
        
        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.isVegetarian && (
            <Badge className="bg-green-600/90 backdrop-blur-md hover:bg-green-600 text-white shadow-sm flex items-center gap-1 border-0 rounded-full px-2.5 py-0.5">
              <Leaf className="w-3 h-3" /> <span className="text-xs font-semibold tracking-wide">Veg</span>
            </Badge>
          )}
          {product.isPopular && (
            <Badge className="bg-orange-500/90 backdrop-blur-md hover:bg-orange-500 text-white shadow-sm border-0 rounded-full px-2.5 py-0.5">
              <span className="text-xs font-semibold tracking-wide">Popular</span>
            </Badge>
          )}
        </div>

        {product.model3D && (
          <div className="absolute bottom-3 left-3">
             <Badge variant="secondary" className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md shadow-sm flex items-center gap-1 rounded-full text-xs px-2.5 py-0.5">
              <Cuboid className="w-3 h-3" /> 3D
            </Badge>
          </div>
        )}

        {!product.isAvailable && (
          <div className="absolute inset-0 bg-white/60 dark:bg-zinc-950/60 flex items-center justify-center backdrop-blur-[2px]">
            <Badge variant="destructive" className="text-sm font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">Sold Out</Badge>
          </div>
        )}
      </div>

      <div className="p-4 sm:p-5 flex flex-col flex-1">
        <h3 className="font-bold text-lg leading-tight line-clamp-1 mb-1 text-zinc-900 dark:text-zinc-50">{product.name}</h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 min-h-[40px] mb-4 leading-relaxed">
          {product.description || "Authentic South Indian taste."}
        </p>
        
        <div className="mt-auto flex items-center justify-between">
          <span className="text-xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">₹{Number(product.price).toFixed(2)}</span>
          
          {totalQuantity > 0 && !hasRequiredOptions ? (
            <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-full shadow-inner h-10 border border-zinc-200 dark:border-zinc-700" onClick={(e) => e.stopPropagation()}>
              <button 
                className="w-10 h-10 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:text-primary active:scale-90 transition-transform"
                onClick={handleDecrement}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-6 text-center font-bold text-sm select-none">{totalQuantity}</span>
              <button 
                className="w-10 h-10 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:text-primary active:scale-90 transition-transform"
                onClick={handleAddClick}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Button 
              className="h-10 rounded-full px-5 shadow-[0_4px_14px_rgba(234,88,12,0.25)] hover:shadow-[0_6px_20px_rgba(234,88,12,0.3)] transition-all active:scale-95"
              onClick={handleAddClick}
              disabled={!product.isAvailable}
            >
              Add
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
