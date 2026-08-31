"use client";

import { useState } from "react";
import { Category } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Plus, ArrowUp, ArrowDown, Pencil, Eye, EyeOff } from "lucide-react";
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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-zinc-200/50">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-950">Categories</h2>
          <p className="text-sm font-medium text-zinc-500 mt-1.5">Manage and reorder your menu categories.</p>
        </div>
        <Button 
          onClick={() => { setEditingCategory(null); setIsFormOpen(true); }} 
          className="bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-sm h-10 px-5 rounded-lg"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Category
        </Button>
      </div>

      {/* Mobile view: Cards */}
      <div className="grid gap-4 md:hidden">
        {items.map((category, index) => (
          <div key={category.id} className="bg-white rounded-xl border border-zinc-100 p-5 shadow-sm flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg text-zinc-950">{category.name}</h3>
                <p className="text-sm text-zinc-500 mt-1">{category.description || "No description"}</p>
              </div>
              <Badge variant={category.isActive ? "default" : "secondary"} className={category.isActive ? "bg-emerald-500 hover:bg-emerald-600" : "bg-zinc-200 text-zinc-600"}>
                {category.isActive ? "Active" : "Hidden"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="icon" disabled={index === 0} onClick={() => moveUp(index)} className="min-h-[40px] min-w-[40px] border-zinc-200">
                  <ArrowUp className="h-4 w-4 text-zinc-600" />
                </Button>
                <Button variant="outline" size="icon" disabled={index === items.length - 1} onClick={() => moveDown(index)} className="min-h-[40px] min-w-[40px] border-zinc-200">
                  <ArrowDown className="h-4 w-4 text-zinc-600" />
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="min-h-[40px] border-zinc-200 font-semibold text-zinc-600"
                  onClick={() => { setEditingCategory(category); setIsFormOpen(true); }}
                >
                  <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                </Button>
                <Button
                  variant={category.isActive ? "destructive" : "default"}
                  size="sm"
                  className={`min-h-[40px] font-semibold ${category.isActive ? 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}`}
                  onClick={() => handleToggleStatus(category.id, category.isActive)}
                >
                  {category.isActive ? <EyeOff className="mr-2 h-3.5 w-3.5" /> : <Eye className="mr-2 h-3.5 w-3.5" />}
                  {category.isActive ? "Hide" : "Show"}
                </Button>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-center py-16 text-zinc-400 bg-white rounded-2xl border border-zinc-100 shadow-sm">
            <p className="font-medium text-sm">No categories found.</p>
          </div>
        )}
      </div>

      {/* Desktop view: Table */}
      <div className="hidden md:block rounded-2xl border border-zinc-100 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-zinc-50/80 border-b border-zinc-100">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[140px] font-bold text-zinc-500 uppercase tracking-widest text-[11px] h-12">Order</TableHead>
              <TableHead className="font-bold text-zinc-500 uppercase tracking-widest text-[11px] h-12">Name</TableHead>
              <TableHead className="font-bold text-zinc-500 uppercase tracking-widest text-[11px] h-12">Description</TableHead>
              <TableHead className="font-bold text-zinc-500 uppercase tracking-widest text-[11px] h-12">Status</TableHead>
              <TableHead className="text-right font-bold text-zinc-500 uppercase tracking-widest text-[11px] h-12">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-zinc-100">
            {items.map((category, index) => (
              <TableRow key={category.id} className="hover:bg-zinc-50/50 transition-colors group border-none">
                <TableCell className="py-4">
                  <div className="flex items-center space-x-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      disabled={index === 0} 
                      onClick={() => moveUp(index)}
                      className="h-8 w-8 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/50"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      disabled={index === items.length - 1} 
                      onClick={() => moveDown(index)}
                      className="h-8 w-8 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/50"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="py-4 font-bold text-zinc-950">{category.name}</TableCell>
                <TableCell className="py-4 text-sm font-medium text-zinc-500 max-w-[300px] truncate">{category.description || "-"}</TableCell>
                <TableCell className="py-4">
                  <Badge variant={category.isActive ? "default" : "secondary"} className={category.isActive ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-bold" : "bg-zinc-100 text-zinc-500 border border-zinc-200/50 font-bold"}>
                    {category.isActive ? "Active" : "Hidden"}
                  </Badge>
                </TableCell>
                <TableCell className="py-4 text-right">
                  <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-zinc-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
                      onClick={() => { setEditingCategory(category); setIsFormOpen(true); }}
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 rounded-lg ${category.isActive ? 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50' : 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50'}`}
                      onClick={() => handleToggleStatus(category.id, category.isActive)}
                      title={category.isActive ? "Hide" : "Show"}
                    >
                      {category.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-40 text-center text-zinc-400 font-medium">
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
    </div>
  );
}
