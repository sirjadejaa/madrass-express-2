"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Trash } from "lucide-react";
import { createCoupon, updateCoupon, deleteCoupon } from "./actions";

export function CouponForm({ initialData }: { initialData?: any }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [code, setCode] = useState(initialData?.code || "");
  const [discountType, setDiscountType] = useState<"fixed" | "percent">(initialData?.discountPercent ? "percent" : "fixed");
  const [discountValue, setDiscountValue] = useState(initialData?.discountPercent ? initialData.discountPercent.toString() : (initialData?.discountAmount ? initialData.discountAmount.toString() : ""));
  const [minOrderValue, setMinOrderValue] = useState(initialData?.minOrderValue ? initialData.minOrderValue.toString() : "");
  const [maxDiscount, setMaxDiscount] = useState(initialData?.maxDiscount ? initialData.maxDiscount.toString() : "");
  const [usageLimit, setUsageLimit] = useState(initialData?.usageLimit ? initialData.usageLimit.toString() : "");
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const payload = {
        code: code.toUpperCase(),
        discountAmount: discountType === "fixed" ? Number(discountValue) : null,
        discountPercent: discountType === "percent" ? Number(discountValue) : null,
        minOrderValue: minOrderValue ? Number(minOrderValue) : null,
        maxDiscount: maxDiscount ? Number(maxDiscount) : null,
        usageLimit: usageLimit ? Number(usageLimit) : null,
        isActive,
      };

      let res;
      if (initialData) {
        res = await updateCoupon(initialData.id, payload);
      } else {
        res = await createCoupon(payload);
      }

      if (res.success) {
        toast({ title: `Coupon ${initialData ? "updated" : "created"} successfully` });
        router.push("/admin/coupons");
        router.refresh();
      } else {
        toast({ title: "Error", description: res.error, variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData) return;
    if (!confirm("Are you sure you want to delete this coupon?")) return;
    setIsDeleting(true);
    try {
      const res = await deleteCoupon(initialData.id);
      if (res.success) {
        toast({ title: "Coupon deleted" });
        router.push("/admin/coupons");
        router.refresh();
      } else {
        toast({ title: "Error", description: res.error, variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="space-y-2">
        <Label htmlFor="code">Coupon Code</Label>
        <Input 
          id="code" 
          required 
          value={code} 
          onChange={(e) => setCode(e.target.value)} 
          placeholder="e.g. SAVE20"
          className="uppercase"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Discount Type</Label>
          <div className="flex gap-4 items-center h-10">
            <label className="flex items-center gap-2">
              <input 
                type="radio" 
                checked={discountType === "fixed"} 
                onChange={() => setDiscountType("fixed")} 
              />
              Fixed Amount (₹)
            </label>
            <label className="flex items-center gap-2">
              <input 
                type="radio" 
                checked={discountType === "percent"} 
                onChange={() => setDiscountType("percent")} 
              />
              Percentage (%)
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="discountValue">Discount Value</Label>
          <Input 
            id="discountValue" 
            type="number" 
            step="0.01" 
            required 
            value={discountValue} 
            onChange={(e) => setDiscountValue(e.target.value)} 
            placeholder={discountType === "fixed" ? "e.g. 50" : "e.g. 10"}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="minOrderValue">Minimum Order Value (₹) (Optional)</Label>
          <Input 
            id="minOrderValue" 
            type="number" 
            step="0.01" 
            value={minOrderValue} 
            onChange={(e) => setMinOrderValue(e.target.value)} 
          />
        </div>

        {discountType === "percent" && (
          <div className="space-y-2">
            <Label htmlFor="maxDiscount">Max Discount (₹) (Optional)</Label>
            <Input 
              id="maxDiscount" 
              type="number" 
              step="0.01" 
              value={maxDiscount} 
              onChange={(e) => setMaxDiscount(e.target.value)} 
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="usageLimit">Total Usage Limit (Optional)</Label>
        <Input 
          id="usageLimit" 
          type="number" 
          value={usageLimit} 
          onChange={(e) => setUsageLimit(e.target.value)} 
          placeholder="e.g. 100"
        />
        <p className="text-sm text-muted-foreground">Leave empty for unlimited uses.</p>
      </div>

      <div className="flex items-center space-x-4">
        <Switch 
          id="isActive" 
          checked={isActive} 
          onCheckedChange={setIsActive} 
        />
        <Label htmlFor="isActive">Active</Label>
      </div>

      <div className="flex justify-between items-center pt-4">
        <Button type="submit" disabled={loading || isDeleting}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? "Save Changes" : "Create Coupon"}
        </Button>
        {initialData && (
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading || isDeleting}>
            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash className="mr-2 h-4 w-4" />}
            Delete Coupon
          </Button>
        )}
      </div>
    </form>
  );
}
