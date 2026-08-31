"use client";

import { useState } from "react";
import { Product, Category } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Plus, Settings, Pencil, Power, PowerOff } from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ProductForm } from "./product-form";
import { toggleProductAvailability } from "./actions";
import { useToast } from "@/components/ui/use-toast";

type ProductWithCategory = Product & { category: Category };

interface MenuClientProps {
  data: ProductWithCategory[];
  categories: Category[];
  restaurantId: string;
}

export function MenuClient({ data, categories, restaurantId }: MenuClientProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { toast } = useToast();
  const [editingProduct, setEditingProduct] = useState<ProductWithCategory | null>(null);

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await toggleProductAvailability(id, !currentStatus);
      toast({ title: "Availability updated successfully" });
    } catch (error) {
      toast({ variant: "destructive", title: "Error updating availability" });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-zinc-200/50">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-950">Menu Items</h2>
          <p className="text-sm font-medium text-zinc-500 mt-1.5">Manage your products and availability.</p>
        </div>
        <Button 
          onClick={() => { setEditingProduct(null); setIsFormOpen(true); }} 
          className="bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-sm h-10 px-5 rounded-lg"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </div>

      {/* Mobile view: Cards */}
      <div className="grid gap-4 md:hidden">
        {data.map((product) => (
          <div key={product.id} className="bg-white rounded-xl border border-zinc-100 p-5 shadow-sm flex flex-col gap-4">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <h3 className="font-bold text-lg text-zinc-950">{product.name}</h3>
                <p className="text-sm text-zinc-500 mt-1 line-clamp-2">{product.description}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="secondary" className="bg-zinc-100 text-zinc-600 font-semibold border-transparent">
                    {product.category.name}
                  </Badge>
                  {product.isVegetarian && <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 font-semibold">Veg</Badge>}
                  {product.isPopular && <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50 font-semibold">Popular</Badge>}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className="font-bold text-lg text-zinc-950">₹{Number(product.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                <Badge variant={product.isAvailable ? "default" : "secondary"} className={product.isAvailable ? "bg-amber-500 hover:bg-amber-600" : "bg-zinc-200 text-zinc-600"}>
                  {product.isAvailable ? "Available" : "Unavailable"}
                </Badge>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 pt-4 border-t border-zinc-100">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 min-h-[40px] border-zinc-200 font-semibold text-zinc-600"
                onClick={() => { setEditingProduct(product); setIsFormOpen(true); }}
              >
                <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
              </Button>
              <Link href={`/admin/menu/${product.id}/customization`} className="flex-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full min-h-[40px] border-zinc-200 font-semibold text-zinc-600"
                >
                  <Settings className="mr-2 h-3.5 w-3.5" /> Options
                </Button>
              </Link>
              <Button
                variant={product.isAvailable ? "secondary" : "default"}
                size="sm"
                className={`flex-1 min-h-[40px] font-semibold ${product.isAvailable ? 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}`}
                onClick={() => handleToggleStatus(product.id, product.isAvailable)}
              >
                {product.isAvailable ? <PowerOff className="mr-2 h-3.5 w-3.5" /> : <Power className="mr-2 h-3.5 w-3.5" />}
                {product.isAvailable ? "Disable" : "Enable"}
              </Button>
            </div>
          </div>
        ))}
        {data.length === 0 && (
          <div className="text-center py-16 text-zinc-400 bg-white rounded-2xl border border-zinc-100 shadow-sm">
            <p className="font-medium text-sm">No products found.</p>
          </div>
        )}
      </div>

      {/* Desktop view: Table */}
      <div className="hidden md:block rounded-2xl border border-zinc-100 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-zinc-50/80 border-b border-zinc-100">
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-bold text-zinc-500 uppercase tracking-widest text-[11px] h-12">Name</TableHead>
              <TableHead className="font-bold text-zinc-500 uppercase tracking-widest text-[11px] h-12">Category</TableHead>
              <TableHead className="font-bold text-zinc-500 uppercase tracking-widest text-[11px] h-12">Price</TableHead>
              <TableHead className="font-bold text-zinc-500 uppercase tracking-widest text-[11px] h-12">Tags</TableHead>
              <TableHead className="font-bold text-zinc-500 uppercase tracking-widest text-[11px] h-12">Status</TableHead>
              <TableHead className="font-bold text-zinc-500 uppercase tracking-widest text-[11px] h-12 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-zinc-100">
            {data.map((product) => (
              <TableRow key={product.id} className="hover:bg-zinc-50/50 transition-colors group border-none">
                <TableCell className="py-4">
                  <div className="font-bold text-zinc-950">{product.name}</div>
                  <div className="text-xs font-medium text-zinc-500 line-clamp-1 mt-0.5 max-w-[250px]">{product.description}</div>
                </TableCell>
                <TableCell className="py-4">
                  <span className="text-sm font-semibold text-zinc-600 bg-zinc-100/80 px-2.5 py-1 rounded-md border border-zinc-200/50">
                    {product.category.name}
                  </span>
                </TableCell>
                <TableCell className="py-4 font-bold text-zinc-950">₹{Number(product.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                <TableCell className="py-4">
                  <div className="flex space-x-1.5">
                    {product.isVegetarian && <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50/50 font-bold text-[10px] uppercase tracking-wider">Veg</Badge>}
                    {product.isPopular && <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50/50 font-bold text-[10px] uppercase tracking-wider">Popular</Badge>}
                  </div>
                </TableCell>
                <TableCell className="py-4">
                  <Badge variant={product.isAvailable ? "default" : "secondary"} className={product.isAvailable ? "bg-amber-500/10 text-amber-600 border border-amber-500/20 font-bold" : "bg-zinc-100 text-zinc-500 border border-zinc-200/50 font-bold"}>
                    {product.isAvailable ? "Available" : "Unavailable"}
                  </Badge>
                </TableCell>
                <TableCell className="py-4 text-right">
                  <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-zinc-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
                      onClick={() => { setEditingProduct(product); setIsFormOpen(true); }}
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Link href={`/admin/menu/${product.id}/customization`}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Options"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 rounded-lg ${product.isAvailable ? 'text-red-500 hover:text-red-600 hover:bg-red-50' : 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50'}`}
                      onClick={() => handleToggleStatus(product.id, product.isAvailable)}
                      title={product.isAvailable ? "Disable" : "Enable"}
                    >
                      {product.isAvailable ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center text-zinc-400 font-medium">
                  No products found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ProductForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        initialData={editingProduct}
        categories={categories}
        restaurantId={restaurantId}
        allProducts={data}
      />
    </div>
  );
}
