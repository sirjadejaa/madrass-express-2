"use client";

import { useState } from "react";
import { Product, Category } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Plus, Settings } from "lucide-react";
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
    <>
      <div className="flex justify-end">
        <Button onClick={() => { setEditingProduct(null); setIsFormOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">
                  {product.name}
                  <div className="text-xs text-muted-foreground line-clamp-1">{product.description}</div>
                </TableCell>
                <TableCell>{product.category.name}</TableCell>
                <TableCell>₹{Number(product.price).toFixed(2)}</TableCell>
                <TableCell>
                  <div className="flex space-x-1">
                    {product.isVegetarian && <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Veg</Badge>}
                    {product.isPopular && <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">Popular</Badge>}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={product.isAvailable ? "default" : "secondary"}>
                    {product.isAvailable ? "Available" : "Unavailable"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    className="mr-2"
                    onClick={() => { setEditingProduct(product); setIsFormOpen(true); }}
                  >
                    Edit
                  </Button>
                  <Link href={`/admin/menu/${product.id}/customization`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mr-2"
                    >
                      <Settings className="mr-2 h-4 w-4" /> Customize
                    </Button>
                  </Link>
                  <Button
                    variant={product.isAvailable ? "secondary" : "default"}
                    size="sm"
                    onClick={() => handleToggleStatus(product.id, product.isAvailable)}
                  >
                    {product.isAvailable ? "Disable" : "Enable"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
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
    </>
  );
}
