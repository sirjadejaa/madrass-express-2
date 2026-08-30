"use client";

import { KioskProduct } from "../menu/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Cuboid, Leaf } from "lucide-react";
import Image from "next/image";

interface ProductCardProps {
  product: KioskProduct;
  onClick: (product: KioskProduct) => void;
}

export function ProductCard({ product, onClick }: ProductCardProps) {
  return (
    <Card 
      className={`overflow-hidden cursor-pointer transition-all hover:shadow-lg active:scale-95 group flex flex-col ${!product.isAvailable ? 'opacity-50 grayscale' : ''}`}
      onClick={() => product.isAvailable && onClick(product)}
    >
      <div className="relative aspect-square w-full bg-orange-100 dark:bg-zinc-800">
        {product.image ? (
          <Image 
            src={product.image.url} 
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl">
            🍲
          </div>
        )}
        
        {/* Badges Overlay */}
        <div className="absolute top-2 left-2 flex flex-col gap-2">
          {product.isVegetarian && (
            <Badge className="bg-green-600 hover:bg-green-700 text-white shadow-sm flex items-center gap-1 border-0">
              <Leaf className="w-3 h-3" /> Veg
            </Badge>
          )}
          {product.isPopular && (
            <Badge className="bg-orange-500 hover:bg-orange-600 text-white shadow-sm border-0">
              Popular
            </Badge>
          )}
        </div>

        {product.model3D && (
          <div className="absolute bottom-2 left-2">
             <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm shadow-sm flex items-center gap-1">
              <Cuboid className="w-3 h-3" /> 3D View
            </Badge>
          </div>
        )}

        {!product.isAvailable && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center backdrop-blur-[2px]">
            <Badge variant="destructive" className="text-lg px-4 py-1">Sold Out</Badge>
          </div>
        )}
      </div>

      <CardHeader className="p-4 pb-2 space-y-1">
        <h3 className="font-bold text-xl line-clamp-1">{product.name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
          {product.description || "Authentic South Indian taste."}
        </p>
      </CardHeader>
      
      <CardFooter className="p-4 pt-0 mt-auto flex items-center justify-between">
        <span className="text-xl font-bold">₹{Number(product.price).toFixed(2)}</span>
      </CardFooter>
    </Card>
  );
}
