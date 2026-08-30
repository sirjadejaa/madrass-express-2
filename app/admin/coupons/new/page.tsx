import { CouponForm } from "../coupon-form";

export const dynamic = "force-dynamic";

export default function NewCouponPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Coupon</h1>
        <p className="text-muted-foreground">
          Add a new discount code for your customers.
        </p>
      </div>

      <div className="border rounded-lg bg-card p-6">
        <CouponForm />
      </div>
    </div>
  );
}
