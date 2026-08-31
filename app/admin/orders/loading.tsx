import { Skeleton } from "@/components/ui/skeleton";

export default function AdminTableLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-[250px] mb-2" />
          <Skeleton className="h-5 w-[300px]" />
        </div>
        <Skeleton className="h-10 w-[150px] rounded-lg" />
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200/60 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
          <Skeleton className="h-9 w-[250px] rounded-lg" />
          <Skeleton className="h-9 w-[100px] rounded-lg" />
        </div>
        
        <div className="p-0">
          <div className="w-full">
            {/* Table Header */}
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4 p-4 border-b border-zinc-100 bg-zinc-50/30">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full hidden sm:block" />
              <Skeleton className="h-4 w-full hidden md:block" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
            
            {/* Table Rows */}
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4 p-4 border-b border-zinc-50 items-center">
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full hidden sm:block" />
                <Skeleton className="h-5 w-full hidden md:block" />
                <Skeleton className="h-6 w-16 rounded-full" />
                <div className="flex justify-end gap-2">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
