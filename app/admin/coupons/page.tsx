import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function CouponsPage() {
  const coupons = await db.coupon.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Coupons</h1>
          <p className="text-muted-foreground">
            Manage discount codes and promotions.
          </p>
        </div>
        <Link href="/admin/coupons/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Coupon
          </Button>
        </Link>
      </div>

      <div className="border rounded-lg bg-card">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Code</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Discount</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Limits</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Usage</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <td className="p-4 align-middle font-bold">
                    {coupon.code}
                  </td>
                  <td className="p-4 align-middle">
                    {coupon.discountPercent ? `${coupon.discountPercent}%` : `₹${Number(coupon.discountAmount).toFixed(2)}`}
                    {coupon.maxDiscount && ` (Max ₹${Number(coupon.maxDiscount).toFixed(2)})`}
                  </td>
                  <td className="p-4 align-middle text-muted-foreground">
                    {coupon.minOrderValue && <div>Min: ₹{Number(coupon.minOrderValue).toFixed(2)}</div>}
                    {coupon.endDate && <div>Exp: {format(coupon.endDate, "PPP")}</div>}
                  </td>
                  <td className="p-4 align-middle">
                    {coupon.usageCount} / {coupon.usageLimit ? coupon.usageLimit : '∞'}
                  </td>
                  <td className="p-4 align-middle">
                    <Badge variant={coupon.isActive ? "default" : "secondary"}>
                      {coupon.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="p-4 align-middle text-right">
                    <Link href={`/admin/coupons/${coupon.id}`}>
                      <Button variant="ghost" size="sm">Edit</Button>
                    </Link>
                  </td>
                </tr>
              ))}
              {coupons.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No coupons found. Create one to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
