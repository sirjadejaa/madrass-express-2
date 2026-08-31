"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const RANGES = [
  { value: "1", label: "Today" },
  { value: "7", label: "7 Days" },
  { value: "10", label: "10 Days" },
  { value: "15", label: "15 Days" },
  { value: "30", label: "30 Days" },
];

export function DashboardFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentDays = searchParams.get("days") || "1";

  const handleValueChange = (val: string | null) => {
    if (val) {
      router.push(`?days=${val}`);
    }
  };

  return (
    <div>
      {/* Mobile view - Select Dropdown */}
      <div className="md:hidden">
        <Select value={currentDays} onValueChange={handleValueChange}>
          <SelectTrigger className="w-[140px] h-10 bg-white border-zinc-200/50 shadow-sm rounded-xl font-medium text-zinc-950 focus:ring-amber-500/20 focus:border-amber-500/50">
            <SelectValue placeholder="Select Range" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-zinc-200/50 shadow-lg">
            {RANGES.map((range) => (
              <SelectItem key={range.value} value={range.value} className="focus:bg-amber-50 focus:text-amber-900 rounded-lg">
                {range.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop view - Toggle Buttons */}
      <div className="hidden md:flex items-center p-1 bg-white rounded-xl border border-zinc-200/50 shadow-sm w-max">
        {RANGES.map((range) => {
          const isActive = currentDays === range.value;
          return (
            <button
              key={range.value}
              onClick={() => handleValueChange(range.value)}
              className={cn(
                "px-5 py-2 text-sm font-semibold rounded-lg transition-all",
                isActive 
                  ? "bg-amber-500/10 text-amber-600 shadow-[0_0_10px_rgba(245,158,11,0.05)] border border-amber-500/20" 
                  : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 border border-transparent"
              )}
            >
              {range.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
