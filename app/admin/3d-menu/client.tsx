"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ModelForm } from "./model-form";

export function Admin3DMenuClient({ products }: { products: any[] }) {
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">3D Menu Management</h2>
          <p className="text-muted-foreground mt-1">Associate 3D models with your products to create premium kiosk experiences.</p>
        </div>
      </div>

      <div className="border rounded-md">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
            <tr>
              <th className="px-6 py-3">Product Name</th>
              <th className="px-6 py-3">Category</th>
              <th className="px-6 py-3">3D Model Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-6 py-4 font-medium">{product.name}</td>
                <td className="px-6 py-4">{product.category.name}</td>
                <td className="px-6 py-4">
                  {product.model3D ? (
                    product.model3D.enabled ? (
                      <Badge className="bg-green-600">Enabled</Badge>
                    ) : (
                      <Badge variant="secondary">Disabled</Badge>
                    )
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">Not Configured</Badge>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <Button variant="outline" size="sm" onClick={() => setSelectedProduct(product)}>
                    {product.model3D ? "Edit Model" : "Add Model"}
                  </Button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-muted-foreground">
                  No products found. Please add products in the Menu section first.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ModelForm 
        product={selectedProduct} 
        isOpen={!!selectedProduct} 
        onClose={() => setSelectedProduct(null)} 
      />
    </div>
  );
}
