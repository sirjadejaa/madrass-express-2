"use client";

import { useState } from "react";
import { Category } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Plus, ArrowUp, ArrowDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CategoryForm } from "./category-form";
import { updateCategory, reorderCategories } from "./actions";
import { useToast } from "@/components/ui/use-toast";

interface CategoriesClientProps {
  data: Category[];
  restaurantId: string;
}

export function CategoriesClient({ data, restaurantId }: CategoriesClientProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { toast } = useToast();
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [items, setItems] = useState<Category[]>(data);
  

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await updateCategory(id, { isActive: !currentStatus });
      toast({ title: "Status updated successfully" });
      setItems(items.map(item => item.id === id ? { ...item, isActive: !currentStatus } : item));
    } catch (error) {
      toast({ variant: "destructive", title: "Error updating status" });
    }
  };

  const moveUp = async (index: number) => {
    if (index === 0) return;
    const newItems = [...items];
    const temp = newItems[index - 1];
    newItems[index - 1] = newItems[index];
    newItems[index] = temp;
    
    // Update local order values
    newItems[index - 1].order = index - 1;
    newItems[index].order = index;
    
    setItems(newItems);
    
    // Save to DB
    await reorderCategories(newItems.map(item => ({ id: item.id, order: item.order })));
  };

  const moveDown = async (index: number) => {
    if (index === items.length - 1) return;
    const newItems = [...items];
    const temp = newItems[index + 1];
    newItems[index + 1] = newItems[index];
    newItems[index] = temp;
    
    // Update local order values
    newItems[index + 1].order = index + 1;
    newItems[index].order = index;
    
    setItems(newItems);
    
    // Save to DB
    await reorderCategories(newItems.map(item => ({ id: item.id, order: item.order })));
  };

  // Re-sync local state if props change (e.g. after create/edit)
  if (JSON.stringify(data) !== JSON.stringify(items) && !isFormOpen) {
    setItems(data);
  }

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={() => { setEditingCategory(null); setIsFormOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Add Category
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Order</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((category, index) => (
              <TableRow key={category.id}>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Button variant="ghost" size="icon" disabled={index === 0} onClick={() => moveUp(index)}>
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" disabled={index === items.length - 1} onClick={() => moveDown(index)}>
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell>{category.description || "-"}</TableCell>
                <TableCell>
                  <Badge variant={category.isActive ? "default" : "secondary"}>
                    {category.isActive ? "Active" : "Hidden"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    className="mr-2"
                    onClick={() => { setEditingCategory(category); setIsFormOpen(true); }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant={category.isActive ? "destructive" : "default"}
                    size="sm"
                    onClick={() => handleToggleStatus(category.id, category.isActive)}
                  >
                    {category.isActive ? "Hide" : "Show"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No categories found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <CategoryForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        initialData={editingCategory}
        restaurantId={restaurantId}
      />
    </>
  );
}
