"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { MobileProduct, MobileCategory } from "./types";
import { MobileProductCard } from "./components/mobile-product-card";
import { MobileProductModal } from "./components/mobile-product-modal";
import { useMobileCartStore } from "@/lib/store/mobile-cart-store";
import { Input } from "@/components/ui/input";
import { 
  UtensilsCrossed, 
  MapPin, 
  Search, 
  ShoppingBag, 
  ArrowRight, 
  X, 
  Leaf
} from "lucide-react";

interface MenuClientProps {
  categories: MobileCategory[];
  products: MobileProduct[];
  restaurant: {
    id: string;
    name: string;
    taxPercent: number;
    currency: string;
  };
  tableContext?: {
    tableId: string;
    tableName: string;
  } | null;
}

export function MenuClient({ categories, products, restaurant, tableContext }: MenuClientProps) {
  const router = useRouter();

  // Store access
  const cart = useMobileCartStore((state) => state.cart);
  const storeTableName = useMobileCartStore((state) => state.tableName);
  const activeTableName = tableContext?.tableName || storeTableName || "Table";

  // State
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [vegOnly, setVegOnly] = useState(false);
  const [modalProduct, setModalProduct] = useState<MobileProduct | null>(null);

  // Cart totals
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => {
    const optsPrice = item.options.reduce((s, o) => s + o.price * o.quantity, 0);
    return sum + (item.price + optsPrice) * item.quantity;
  }, 0);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.description &&
          product.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        selectedCategory === "ALL" || product.categoryId === selectedCategory;

      const matchesVeg = !vegOnly || product.isVegetarian;

      return matchesSearch && matchesCategory && matchesVeg;
    });
  }, [products, searchQuery, selectedCategory, vegOnly]);

  // Group filtered products by category for clean sectioning
  const categorySections = useMemo(() => {
    if (selectedCategory !== "ALL") {
      const cat = categories.find((c) => c.id === selectedCategory);
      return [
        {
          id: selectedCategory,
          name: cat ? cat.name : "Selected Category",
          products: filteredProducts,
        },
      ];
    }

    return categories
      .map((cat) => ({
        id: cat.id,
        name: cat.name,
        products: filteredProducts.filter((p) => p.categoryId === cat.id),
      }))
      .filter((sec) => sec.products.length > 0);
  }, [categories, filteredProducts, selectedCategory]);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-stone-50 pb-28">
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-zinc-100 shadow-sm px-4 pt-3 pb-2 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-sm">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-black text-base tracking-tight text-zinc-950 uppercase leading-none">
                {restaurant.name}
              </h1>
              <p className="text-[10px] font-semibold text-zinc-400 mt-0.5">
                Fresh & Authentic
              </p>
            </div>
          </div>

          {/* Table Pill */}
          <div className="flex items-center gap-1.5 bg-zinc-950 text-white font-extrabold text-xs px-3 py-1.5 rounded-full shadow-sm">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span>Table {activeTableName}</span>
          </div>
        </div>

        {/* Search & Veg Filter Row */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Search dishes, drinks, combos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 h-9 text-xs bg-zinc-50 border-zinc-200 rounded-xl focus:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Veg Only Toggle */}
          <button
            onClick={() => setVegOnly(!vegOnly)}
            className={`h-9 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
              vegOnly
                ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                : "bg-white text-zinc-600 border-zinc-200 hover:border-emerald-300"
            }`}
          >
            <Leaf className={`w-3.5 h-3.5 ${vegOnly ? "text-white" : "text-emerald-600"}`} />
            <span>Pure Veg</span>
          </button>
        </div>

        {/* Horizontal Category Navigation Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold shrink-0 transition-all ${
              selectedCategory === "ALL"
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            All Dishes
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold shrink-0 transition-all ${
                selectedCategory === cat.id
                  ? "bg-amber-600 text-white shadow-sm"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </header>

      {/* Product List Content */}
      <main className="p-4 space-y-6">
        {filteredProducts.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <p className="font-bold text-sm text-zinc-800">No dishes match your filter</p>
            <p className="text-xs text-zinc-400 max-w-xs mx-auto">
              Try searching for something else or turn off the pure veg filter.
            </p>
          </div>
        ) : (
          categorySections.map((section) => (
            <div key={section.id} className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="font-black text-base text-zinc-900 tracking-tight">
                  {section.name}
                </h2>
                <span className="text-[11px] font-bold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">
                  {section.products.length}
                </span>
              </div>

              <div className="space-y-2.5">
                {section.products.map((product) => (
                  <MobileProductCard
                    key={product.id}
                    product={product}
                    onSelect={(p) => setModalProduct(p)}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </main>

      {/* Floating Bottom Cart Bar */}
      {totalItems > 0 && (
        <div className="fixed bottom-3 left-0 right-0 max-w-md mx-auto px-4 z-40 animate-in slide-in-from-bottom-4 duration-300">
          <div
            onClick={() => router.push("/m/cart")}
            className="w-full bg-zinc-950 text-white p-3.5 rounded-2xl shadow-2xl flex items-center justify-between cursor-pointer border border-zinc-800 hover:bg-zinc-900 transition-all active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-sm shadow-sm">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <p className="font-black text-sm tracking-tight">
                  {totalItems} {totalItems === 1 ? "Item" : "Items"} • ₹{subtotal}
                </p>
                <p className="text-[10px] text-zinc-400 font-medium">
                  Taxes extra • Serving to Table {activeTableName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 font-black text-xs text-amber-400 uppercase tracking-wider pr-1">
              <span>View Cart</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      )}

      {/* Customization Modal */}
      <MobileProductModal
        product={modalProduct}
        isOpen={!!modalProduct}
        onClose={() => setModalProduct(null)}
      />
    </div>
  );
}
