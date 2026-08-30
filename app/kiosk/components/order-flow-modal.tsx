"use client";

import { useState } from "react";
import { OrderType } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useKioskStore } from "@/lib/store/kiosk-store";
import { Utensils, ShoppingBag } from "lucide-react";

export function OrderFlowModal({ tables }: { tables: { id: string, number: string }[] }) {
  const { orderType, setOrderType, setTable } = useKioskStore();
  const [selectedType, setSelectedType] = useState<OrderType | null>(null);

  const isOpen = orderType === null;

  const handleSelectTakeaway = () => {
    setOrderType(OrderType.TAKEAWAY);
  };

  const handleSelectDineIn = (tableId: string, tableName: string) => {
    setTable(tableId, tableName);
    setOrderType(OrderType.DINE_IN);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden hide-close-button border-0">
        <div className="p-8 bg-orange-50/50 dark:bg-zinc-900/50">
          <DialogHeader>
            <DialogTitle className="text-4xl text-center font-bold mb-8">
              {!selectedType ? "How would you like your order?" : "Please select your table"}
            </DialogTitle>
          </DialogHeader>

          {!selectedType ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
              <Button
                variant="outline"
                className="h-64 flex flex-col items-center justify-center gap-6 rounded-3xl border-2 hover:border-primary hover:bg-primary/5 transition-all"
                onClick={() => setSelectedType(OrderType.DINE_IN)}
              >
                <Utensils className="h-20 w-20 text-primary" />
                <span className="text-3xl font-bold">Dine In</span>
              </Button>
              <Button
                variant="outline"
                className="h-64 flex flex-col items-center justify-center gap-6 rounded-3xl border-2 hover:border-primary hover:bg-primary/5 transition-all"
                onClick={handleSelectTakeaway}
              >
                <ShoppingBag className="h-20 w-20 text-primary" />
                <span className="text-3xl font-bold">Takeaway</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {tables.map((table) => (
                  <Button
                    key={table.id}
                    variant="outline"
                    className="h-24 text-2xl font-bold rounded-2xl hover:border-primary hover:bg-primary/5"
                    onClick={() => handleSelectDineIn(table.id, table.number)}
                  >
                    {table.number}
                  </Button>
                ))}
              </div>
              <Button 
                variant="ghost" 
                className="w-full text-xl h-16" 
                onClick={() => setSelectedType(null)}
              >
                Back
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
