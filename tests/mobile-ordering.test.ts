import { describe, it, expect, vi, beforeEach } from "vitest";
import { useMobileCartStore } from "@/lib/store/mobile-cart-store";
import { getOrderTrackingStatus } from "@/app/m/order/[trackingToken]/actions";
import { db } from "@/lib/db";
import { OrderStatus, PaymentStatus, OrderType, OrderSource } from "@prisma/client";

vi.mock("@/lib/db", () => ({
  db: {
    order: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

describe("Module 2: Complete Mobile QR Ordering Experience", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useMobileCartStore.getState().clearCart();
  });

  describe("Persistent Mobile Cart Store", () => {
    it("initializes with empty cart and sets table context", () => {
      const store = useMobileCartStore.getState();
      expect(store.cart).toEqual([]);
      expect(store.orderType).toBe(OrderType.DINE_IN);

      store.setTableContext({
        restaurantId: "rest-1",
        restaurantName: "Madrass Express",
        tableId: "tbl-1",
        tableName: "T1",
      });

      const updated = useMobileCartStore.getState();
      expect(updated.tableId).toBe("tbl-1");
      expect(updated.tableName).toBe("T1");
      expect(updated.restaurantName).toBe("Madrass Express");
    });

    it("adds item to cart and aggregates identical items", () => {
      const store = useMobileCartStore.getState();

      store.addToCart({
        productId: "p1",
        name: "Masala Dosa",
        price: 120,
        quantity: 1,
        options: [{ optionId: "opt-butter", name: "Butter", price: 20, quantity: 1 }],
      });

      expect(useMobileCartStore.getState().cart.length).toBe(1);
      expect(useMobileCartStore.getState().cart[0].quantity).toBe(1);

      // Add identical item with same option
      store.addToCart({
        productId: "p1",
        name: "Masala Dosa",
        price: 120,
        quantity: 2,
        options: [{ optionId: "opt-butter", name: "Butter", price: 20, quantity: 1 }],
      });

      // Should aggregate quantity to 3
      expect(useMobileCartStore.getState().cart.length).toBe(1);
      expect(useMobileCartStore.getState().cart[0].quantity).toBe(3);
    });

    it("updates quantity and removes item when quantity reaches zero", () => {
      const store = useMobileCartStore.getState();

      store.addToCart({
        productId: "p2",
        name: "Idli",
        price: 60,
        quantity: 2,
        options: [],
      });

      const itemId = useMobileCartStore.getState().cart[0].id;
      store.updateQuantity(itemId, 1);
      expect(useMobileCartStore.getState().cart[0].quantity).toBe(3);

      store.updateQuantity(itemId, -3);
      expect(useMobileCartStore.getState().cart.length).toBe(0);
    });

    it("applies and removes coupons cleanly", () => {
      const store = useMobileCartStore.getState();

      store.applyCoupon("WELCOME50", 50);
      expect(useMobileCartStore.getState().appliedCouponCode).toBe("WELCOME50");
      expect(useMobileCartStore.getState().discountAmount).toBe(50);

      store.removeCoupon();
      expect(useMobileCartStore.getState().appliedCouponCode).toBeNull();
      expect(useMobileCartStore.getState().discountAmount).toBe(0);
    });
  });

  describe("Customer Order Tracking Endpoint", () => {
    it("returns error if tracking token is invalid", async () => {
      const res = await getOrderTrackingStatus("");
      expect(res.error).toBe("Invalid tracking token");
    });

    it("returns error if order does not exist", async () => {
      (db.order.findUnique as any).mockResolvedValue(null);

      const res = await getOrderTrackingStatus("non-existent-token");
      expect(res.error).toBe("Order not found");
    });

    it("returns sanitized order status without leaking private records", async () => {
      (db.order.findUnique as any).mockResolvedValue({
        id: "ORD-20261107-000001",
        type: OrderType.DINE_IN,
        source: OrderSource.QR_MOBILE,
        status: OrderStatus.PREPARING,
        totalAmount: 189,
        discountAmount: 0,
        couponCode: null,
        createdAt: new Date(),
        token: { tokenNumber: 15 },
        table: { number: "T3" },
        payment: { status: PaymentStatus.PAY_AT_COUNTER, method: "CASH", amount: 189 },
        restaurant: { name: "Madrass Express" },
        items: [
          {
            id: "item-1",
            quantity: 1,
            price: 180,
            notes: "extra sambar",
            product: { name: "Rava Dosa", isVegetarian: true },
            options: [],
          },
        ],
      });

      const res = await getOrderTrackingStatus("valid-tracking-token-xyz");
      expect(res.success).toBe(true);
      expect(res.order?.tokenNumber).toBe(15);
      expect(res.order?.tableNumber).toBe("T3");
      expect(res.order?.status).toBe(OrderStatus.PREPARING);
      expect(res.order?.paymentStatus).toBe(PaymentStatus.PAY_AT_COUNTER);
      expect(res.order?.items.length).toBe(1);
      expect(res.order?.items[0].name).toBe("Rava Dosa");
    });
  });
});
