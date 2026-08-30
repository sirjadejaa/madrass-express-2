"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Product, Category } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { createProduct, updateProduct } from "./actions";

const formSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  description: z.string().optional(),
  price: z.coerce.number().positive("Price must be positive"),
  preparationTime: z.coerce.number().int().nonnegative().optional(),
  categoryId: z.string().min(1, "Category is required"),
  isVegetarian: z.boolean(),
  isPopular: z.boolean(),
  isRecommended: z.boolean(),
  isCombo: z.boolean(),
  isAvailable: z.boolean(),
  comboItems: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive(),
  })),
  recommendations: z.array(z.string()),
});

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: any | null; // Using any to accommodate the extra includes easily
  categories: Category[];
  restaurantId: string;
  allProducts: Product[];
}

export function ProductForm({ isOpen, onClose, initialData, categories, restaurantId, allProducts }: ProductFormProps) {
  
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      price: initialData ? Number(initialData.price) : 0,
      preparationTime: initialData?.preparationTime || 0,
      categoryId: initialData?.categoryId || "",
      isVegetarian: initialData?.isVegetarian || false,
      isPopular: initialData?.isPopular || false,
      isRecommended: initialData?.isRecommended || false,
      isCombo: initialData?.isCombo || false,
      isAvailable: initialData?.isAvailable ?? true,
      comboItems: initialData?.productComboItems ? initialData.productComboItems.map((ci: any) => ({
        productId: ci.productId,
        quantity: ci.quantity
      })) : [],
      recommendations: initialData?.recommendations ? initialData.recommendations.map((r: any) => r.recommendedId) : [],
    },
  });

  const isComboWatcher = form.watch("isCombo");

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      // Clean up conflicting data before submission based on isCombo
      const payload = {
        ...values,
        comboItems: values.isCombo ? values.comboItems : [],
        recommendations: values.isCombo ? [] : values.recommendations,
      };

      if (initialData) {
        await updateProduct(initialData.id, payload);
        toast({ title: "Product updated successfully" });
      } else {
        await createProduct({
          ...payload,
          restaurantId,
        });
        toast({ title: "Product created successfully" });
      }
      onClose();
      form.reset();
    } catch (error) {
      toast({ variant: "destructive", title: "Something went wrong" });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Product" : "Add Product"}</DialogTitle>
          <DialogDescription>
            {initialData ? "Modify product details." : "Add a new item to your menu."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Masala Dosa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select disabled={isLoading} onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Crispy crepe made from fermented batter..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="preparationTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prep Time (minutes)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 border rounded-md p-4">
              <FormField
                control={form.control}
                name="isVegetarian"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Vegetarian</FormLabel>
                      <FormDescription>Mark as pure veg</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isAvailable"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Available</FormLabel>
                      <FormDescription>Currently in stock</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isPopular"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-2">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Popular Item</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isRecommended"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-2">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Chef's Recommendation</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isCombo"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Combo Product</FormLabel>
                      <FormDescription>Is this a combo meal?</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            
            {isComboWatcher && (
              <div className="space-y-4 border rounded-md p-4 bg-muted/20">
                <h4 className="font-semibold text-sm">Combo Items</h4>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {allProducts.filter(p => p.id !== initialData?.id && !p.isCombo).map(p => {
                    const currentItems = form.watch("comboItems");
                    const existing = currentItems.find(ci => ci.productId === p.id);
                    return (
                      <div key={p.id} className="flex items-center space-x-2 border p-2 rounded">
                        <Checkbox 
                          checked={!!existing} 
                          onCheckedChange={(checked) => {
                            if (checked) {
                              form.setValue("comboItems", [...currentItems, { productId: p.id, quantity: 1 }]);
                            } else {
                              form.setValue("comboItems", currentItems.filter(ci => ci.productId !== p.id));
                            }
                          }}
                        />
                        <span className="flex-1 text-sm truncate">{p.name}</span>
                        {existing && (
                          <Input 
                            type="number" 
                            className="w-16 h-8 text-sm" 
                            min={1} 
                            value={existing.quantity}
                            onChange={(e) => {
                              const qty = parseInt(e.target.value) || 1;
                              form.setValue("comboItems", currentItems.map(ci => ci.productId === p.id ? { ...ci, quantity: qty } : ci));
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {!isComboWatcher && (
              <div className="space-y-4 border rounded-md p-4 bg-muted/20">
                <h4 className="font-semibold text-sm">Upselling Recommendations</h4>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {allProducts.filter(p => p.id !== initialData?.id).map(p => {
                    const recs = form.watch("recommendations");
                    const isRec = recs.includes(p.id);
                    return (
                      <div key={p.id} className="flex items-center space-x-2">
                        <Checkbox 
                          checked={isRec} 
                          onCheckedChange={(checked) => {
                            if (checked) {
                              form.setValue("recommendations", [...recs, p.id]);
                            } else {
                              form.setValue("recommendations", recs.filter(id => id !== p.id));
                            }
                          }}
                        />
                        <span className="text-sm truncate">{p.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {initialData ? "Save changes" : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
