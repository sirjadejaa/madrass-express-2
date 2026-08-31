import { Skeleton } from "@/components/ui/skeleton";

export default function PaymentLoading() {
  return (
    <div className="h-full w-full bg-muted/20 flex flex-col">
      <div className="p-6 bg-background border-b shadow-sm flex items-center justify-between z-10">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-8 w-32" />
      </div>
      
      <div className="flex-1 overflow-hidden relative flex items-center justify-center p-6">
        <div className="w-full max-w-4xl bg-card rounded-3xl shadow-2xl border flex flex-col md:flex-row overflow-hidden min-h-[500px]">
          {/* Left Side - Payment Methods Skeleton */}
          <div className="w-full md:w-1/2 p-8 flex flex-col justify-center space-y-6">
            <Skeleton className="h-8 w-48 mb-4" />
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-2xl" />
              ))}
            </div>
          </div>
          
          {/* Right Side - Summary Skeleton */}
          <div className="w-full md:w-1/2 bg-muted/30 p-8 border-t md:border-t-0 md:border-l flex flex-col justify-center">
            <Skeleton className="h-8 w-32 mb-8 mx-auto" />
            <div className="space-y-6">
              <Skeleton className="h-[200px] w-full rounded-2xl" />
              <div className="space-y-4">
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <div className="pt-4 border-t flex justify-between">
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-8 w-32" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
