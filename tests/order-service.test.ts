import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSharedOrder } from "@/lib/orders/order-service";
import { OrderType, OrderSource, PaymentMethod, PaymentStatus, OrderStatus } from "@prisma/client";
import { db } from "@/lib/db";

vi.mock("@/lib/db", () => ({
  db: {
    order: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    table: {
      findUnique: vi.fn(),
    },
    product: {
      findUnique: vi.fn(),
    },
    productOption: {
      findUnique: vi.fn(),
    },
    restaurantSetting: {
      findUnique: vi.fn(),
    },
    coupon: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    token: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    customer: {
      upsert: vi.fn(),
    },
  },
}));

describe("Module 3 & Shared Order Engine: createSharedOrder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fails if idempotency key is missing", async () => {
    const res = await createSharedOrder({
      idempotencyKey: "",
      restaurantId: "rest-1",
      customerName: "Jane Doe",
      customerPhone: "9876543210",
      orderType: OrderType.DINE_IN,
      source: OrderSource.QR_MOBILE,
      cart: [{ productId: "p1", quantity: 1, options: [] }],
    });

    expect(res.error).toContain("Missing or invalid idempotency key");
  });

  it("fails if customer name or phone is missing", async () => {
    const res = await createSharedOrder({
      idempotencyKey: "key-123",
      restaurantId: "rest-1",
      customerName: "",
      customerPhone: "",
      orderType: OrderType.DINE_IN,
      source: OrderSource.QR_MOBILE,
      cart: [{ productId: "p1", quantity: 1, options: [] }],
    });

    expect(res.error).toContain("Customer name and phone number are required");
  });

  it("requires tableId for DINE_IN order", async () => {
    const res = await createSharedOrder({
      idempotencyKey: "key-123",
      restaurantId: "rest-1",
      customerName: "Jane",
      customerPhone: "9876543210",
      orderType: OrderType.DINE_IN,
      source: OrderSource.QR_MOBILE,
      tableId: undefined,
      cart: [{ productId: "p1", quantity: 1, options: [] }],
    });

    expect(res.error).toContain("Table is required for Dine-In orders");
  });

  it("rejects inactive table", async () => {
    (db.table.findUnique as any).mockResolvedValue({
      id: "tbl-1",
      number: "T1",
      restaurantId: "rest-1",
      isActive: false,
    });

    const res = await createSharedOrder({
      idempotencyKey: "key-123",
      restaurantId: "rest-1",
      customerName: "Jane",
      customerPhone: "9876543210",
      orderType: OrderType.DINE_IN,
      source: OrderSource.QR_MOBILE,
      tableId: "tbl-1",
      cart: [{ productId: "p1", quantity: 1, options: [] }],
    });

    expect(res.error).toContain("inactive");
  });

  it("enforces required option group selection", async () => {
    (db.table.findUnique as any).mockResolvedValue({
      id: "tbl-1",
      number: "T1",
      restaurantId: "rest-1",
      isActive: true,
    });

    (db.order.findUnique as any).mockResolvedValue(null);

    (db.product.findUnique as any).mockResolvedValue({
      id: "p1",
      name: "Masala Dosa",
      price: 120,
      isAvailable: true,
      restaurantId: "rest-1",
      optionGroups: [
        {
          id: "grp-size",
          name: "Size",
          isRequired: true,
          minSelections: 1,
          maxSelections: 1,
          options: [{ id: "opt-large", name: "Large", price: 20, isAvailable: true, maxQuantity: 1 }],
        },
      ],
    });

    const res = await createSharedOrder({
      idempotencyKey: "key-123",
      restaurantId: "rest-1",
      customerName: "Jane",
      customerPhone: "9876543210",
      orderType: OrderType.DINE_IN,
      source: OrderSource.QR_MOBILE,
      tableId: "tbl-1",
      cart: [{ productId: "p1", quantity: 1, options: [] }], // Missing required option
    });

    expect(res.error).toContain("Please make a selection for required option 'Size'");
  });

  it("successfully creates a QR_MOBILE order with server-calculated price and trackingToken", async () => {
    (db.table.findUnique as any).mockResolvedValue({
      id: "tbl-1",
      number: "T1",
      restaurantId: "rest-1",
      isActive: true,
    });

    (db.order.findUnique as any).mockResolvedValue(null);

    (db.product.findUnique as any).mockResolvedValue({
      id: "p1",
      name: "Plain Dosa",
      price: 100,
      isAvailable: true,
      restaurantId: "rest-1",
      optionGroups: [],
    });

    (db.restaurantSetting.findUnique as any).mockResolvedValue({
      taxPercent: 5.0,
      dailyTokenStartNumber: 1,
    });

    (db.token.findFirst as any).mockResolvedValue({
      tokenNumber: 42,
    });

    (db.token.create as any).mockResolvedValue({
      id: "tok-43",
      tokenNumber: 43,
    });

    (db.customer.upsert as any).mockResolvedValue({
      id: "cust-1",
    });

    (db.order.create as any).mockImplementation(({ data }: any) => ({
      id: data.id,
      trackingToken: data.trackingToken,
      source: data.source,
      totalAmount: data.totalAmount,
    }));

    const res = await createSharedOrder({
      idempotencyKey: "key-success-123",
      restaurantId: "rest-1",
      customerName: "John Smith",
      customerPhone: "9876543210",
      orderType: OrderType.DINE_IN,
      source: OrderSource.QR_MOBILE,
      tableId: "tbl-1",
      cart: [{ productId: "p1", quantity: 2, options: [] }], // 2 * 100 = 200, 5% tax = 10, total = 210
    });

    expect(res.success).toBe(true);
    expect(res.tokenNumber).toBe(43);
    expect(res.total).toBe(210);
    expect(res.trackingToken).toBeDefined();
    expect(typeof res.trackingToken).toBe("string");
    expect(res.trackingToken?.length).toBeGreaterThan(20);
  });
});
