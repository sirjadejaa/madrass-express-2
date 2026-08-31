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
    <div className="w-full lg:w-[240px] border-b lg:border-b-0 lg:border-r bg-white dark:bg-zinc-950 flex lg:flex-col shrink-0 overflow-x-auto lg:overflow-y-auto no-scrollbar scroll-smooth">
      <div className="p-4 lg:p-6 flex lg:flex-col gap-3 lg:gap-4 min-w-max lg:min-w-0">
        <Button
          variant={activeCategoryId === null ? "default" : "secondary"}
          className={`shrink-0 lg:w-full justify-center lg:justify-start text-base lg:text-lg h-12 lg:h-16 rounded-full lg:rounded-2xl transition-all duration-300 ${
            activeCategoryId === null 
              ? "bg-primary text-primary-foreground shadow-[0_8px_20px_rgba(234,88,12,0.25)] hover:bg-primary/90" 
              : "bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800"
          } px-6 lg:px-6`}
          onClick={() => onSelectCategory(null)}
        >
          <span className="font-semibold tracking-wide">All Items</span>
        </Button>
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={activeCategoryId === category.id ? "default" : "secondary"}
            className={`shrink-0 lg:w-full justify-center lg:justify-start text-base lg:text-lg h-12 lg:h-16 rounded-full lg:rounded-2xl transition-all duration-300 ${
              activeCategoryId === category.id 
                ? "bg-primary text-primary-foreground shadow-[0_8px_20px_rgba(234,88,12,0.25)] hover:bg-primary/90" 
                : "bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800"
            } px-6 lg:px-6`}
            onClick={() => onSelectCategory(category.id)}
          >
            <span className="font-semibold tracking-wide">{category.name}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
