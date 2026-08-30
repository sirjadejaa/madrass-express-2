"use client";

import { Button } from "@/components/ui/button";

export type KioskCategory = {
  id: string;
  name: string;
  order: number;
};

interface CategorySidebarProps {
  categories: KioskCategory[];
  activeCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
}

export function CategorySidebar({ categories, activeCategoryId, onSelectCategory }: CategorySidebarProps) {
  return (
    <div className="w-48 lg:w-64 border-r bg-card flex flex-col h-full overflow-y-auto no-scrollbar">
      <div className="p-4 flex-1 space-y-2">
        <Button
          variant={activeCategoryId === null ? "default" : "ghost"}
          className={`w-full justify-start text-lg h-16 rounded-2xl ${activeCategoryId === null ? "shadow-md" : ""}`}
          onClick={() => onSelectCategory(null)}
        >
          All Items
        </Button>
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={activeCategoryId === category.id ? "default" : "ghost"}
            className={`w-full justify-start text-lg h-16 rounded-2xl ${activeCategoryId === category.id ? "shadow-md" : ""}`}
            onClick={() => onSelectCategory(category.id)}
          >
            {category.name}
          </Button>
        ))}
      </div>
    </div>
  );
}
