import { Skeleton } from "@/components/ui/skeleton";

export default function CheckoutLoading() {
  return (
    <div className="h-full w-full bg-muted/20 flex flex-col">
      <div className="p-6 bg-background border-b shadow-sm flex items-center justify-between z-10">
        <Skeleton className="h-9 w-64" />
      </div>
      
      <div className="flex-1 overflow-hidden relative flex flex-col lg:flex-row">
        {/* Left Column - Form */}
        <div className="flex-1 p-6 lg:p-12 overflow-y-auto">
          <div className="max-w-2xl mx-auto space-y-8">
            <Skeleton className="h-8 w-48 mb-6" />
            
            <div className="space-y-6">
              {/* Order Type Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-32 w-full rounded-2xl" />
                <Skeleton className="h-32 w-full rounded-2xl" />
              </div>

              <Skeleton className="h-[2px] w-full" />

              <div className="space-y-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-14 w-full rounded-xl" />
                <Skeleton className="h-14 w-full rounded-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Summary */}
        <div className="w-full lg:w-[400px] border-t lg:border-t-0 lg:border-l bg-card flex flex-col shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.1)] z-10">
          <div className="p-6 border-b flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-16" />
          </div>
          <div className="flex-1 p-6 space-y-6 overflow-y-auto">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex justify-between items-start gap-4">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <Skeleton className="h-5 w-16" />
              </div>
            ))}
          </div>
          <div className="p-6 bg-muted/30 border-t space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="flex justify-between pt-4">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-24" />
              </div>
            </div>
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
