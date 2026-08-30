import { db } from "@/lib/db";
import { CouponForm } from "../coupon-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditCouponPage({ params }: { params: { id: string } }) {
  const coupon = await db.coupon.findUnique({
    where: { id: params.id }
  });

  if (!coupon) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/coupons" className="flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Coupons
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Edit Coupon</h1>
        <p className="text-muted-foreground">
          Modify the configuration of {coupon.code}.
        </p>
      </div>

      <div className="border rounded-lg bg-card p-6">
        <CouponForm initialData={coupon} />
      </div>
    </div>
  );
}
