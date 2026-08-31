import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function ReportsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Skeleton className="h-9 w-[250px] mb-2" />
          <Skeleton className="h-5 w-[350px]" />
        </div>
        <Skeleton className="h-10 w-[200px] rounded-lg" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="rounded-2xl shadow-sm border-slate-200/60 bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-10 w-10 rounded-lg" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-28 mt-2" />
              <Skeleton className="h-4 w-40 mt-3" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="rounded-2xl shadow-sm border-slate-200/60 bg-white">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-8 w-24 rounded-md" />
            </CardHeader>
            <CardContent className="pt-6 h-[350px] flex items-end justify-between gap-2">
              {Array.from({ length: 7 }).map((_, j) => (
                <Skeleton key={j} className="w-full rounded-t-sm" style={{ height: `${Math.random() * 60 + 20}%` }} />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
