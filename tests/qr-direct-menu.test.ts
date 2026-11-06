import { describe, it, expect, vi, beforeEach } from "vitest";
import { useKioskStore } from "@/lib/store/kiosk-store";
import { OrderType, OrderSource } from "@prisma/client";

// Mock next/navigation
const mockRedirect = vi.fn();
vi.mock("next/navigation", () => ({
  redirect: (url: string) => mockRedirect(url),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => "/kiosk/menu",
}));

// Mock table service
vi.mock("@/lib/tables/table-service", () => ({
  resolveTableByToken: vi.fn(async (token: string) => {
    if (token === "valid-qr-token-123") {
      return {
        valid: true,
        table: { id: "tbl-04", number: "Table 04", isActive: true },
        restaurant: { id: "rest-01", name: "Madrass Express", isActive: true },
      };
    }
    return {
      valid: false,
      error: "Invalid or expired table QR code.",
    };
  }),
}));

// Mock order service
const mockCreateSharedOrder = vi.fn(async (payload: any) => ({
  success: true,
  orderId: "ord-test-1",
  tokenNumber: 42,
  trackingToken: "trk-token-abc",
}));
vi.mock("@/lib/orders/order-service", () => ({
  createSharedOrder: (payload: any) => mockCreateSharedOrder(payload),
}));

// Mock next/headers
let mockCookieStore: Record<string, { value: string; options?: any }> = {};
vi.mock("next/headers", () => ({
  cookies: () => ({
    get: (name: string) => mockCookieStore[name],
    set: (name: string, value: string, options?: any) => {
      mockCookieStore[name] = { value, options };
    },
    delete: (name: string) => {
      delete mockCookieStore[name];
    },
  }),
}));

describe("Unified QR Customer Homepage Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCookieStore = {};
    useKioskStore.getState().clearCart();
    useKioskStore.setState({
      orderType: null,
      tableId: null,
      tableName: null,
      isQRSession: false,
      cart: [],
      appliedCouponCode: null,
      discountAmount: 0,
    });
  });

  describe("QR Table Session Locking in Store", () => {
    it("locks table, dine-in mode and qr session flag", () => {
      const store = useKioskStore.getState();
      store.setTable("tbl-04", "Table 04");
      store.setOrderType(OrderType.DINE_IN);
      store.setQRSession(true);

      const state = useKioskStore.getState();
      expect(state.tableId).toBe("tbl-04");
      expect(state.tableName).toBe("Table 04");
      expect(state.orderType).toBe(OrderType.DINE_IN);
      expect(state.isQRSession).toBe(true);
    });

    it("resetKiosk preserves locked table when isQRSession is true", () => {
      const store = useKioskStore.getState();
      store.setTable("tbl-04", "Table 04");
      store.setOrderType(OrderType.DINE_IN);
      store.setQRSession(true);

      store.addToCart({
        productId: "p1",
        name: "Filter Coffee",
        price: 40,
        quantity: 2,
        options: [],
      });
      store.applyCoupon("DISCOUNT10", 10);

      expect(useKioskStore.getState().cart.length).toBe(1);
      expect(useKioskStore.getState().discountAmount).toBe(10);

      // Call resetKiosk (such as after order placement or order more)
      useKioskStore.getState().resetKiosk();

      const afterReset = useKioskStore.getState();
      // Cart & coupon should be cleared
      expect(afterReset.cart).toEqual([]);
      expect(afterReset.discountAmount).toBe(0);
      expect(afterReset.appliedCouponCode).toBeNull();
      // BUT Table assignment and session MUST be preserved for QR diner!
      expect(afterReset.tableId).toBe("tbl-04");
      expect(afterReset.tableName).toBe("Table 04");
      expect(afterReset.orderType).toBe(OrderType.DINE_IN);
      expect(afterReset.isQRSession).toBe(true);
    });

    it("resetKiosk clears table completely when NOT in QR session (regular kiosk mode)", () => {
      const store = useKioskStore.getState();
      store.setTable("tbl-01", "Table 01");
      store.setOrderType(OrderType.DINE_IN);
      store.setQRSession(false);

      useKioskStore.getState().resetKiosk();

      const state = useKioskStore.getState();
      expect(state.tableId).toBeNull();
      expect(state.tableName).toBeNull();
      expect(state.orderType).toBeNull();
      expect(state.cart).toEqual([]);
    });
  });

  describe("Direct Landing on /kiosk/menu upon QR Scan", () => {
    it("redirects directly to /kiosk/menu and sets session cookie in Route Handler for valid QR code", async () => {
      const { GET } = await import("@/app/m/t/[token]/route");
      const { NextRequest } = await import("next/server");

      const req = new NextRequest("https://madrass-express.com/m/t/valid-qr-token-123");
      const response = await GET(req, { params: { token: "valid-qr-token-123" } });

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe("https://madrass-express.com/kiosk/menu");

      const sessionCookie = response.cookies.get("madrass_table_session");
      expect(sessionCookie).toBeDefined();
      expect(sessionCookie?.httpOnly).toBe(true);

      const cookieData = JSON.parse(sessionCookie!.value);
      expect(cookieData.tableId).toBe("tbl-04");
      expect(cookieData.tableName).toBe("Table 04");
      expect(cookieData.qrToken).toBe("valid-qr-token-123");
    });

    it("redirects to /m/invalid-qr and clears session cookie for invalid QR code", async () => {
      const { GET } = await import("@/app/m/t/[token]/route");
      const { NextRequest } = await import("next/server");

      const req = new NextRequest("https://madrass-express.com/m/t/invalid-token");
      const response = await GET(req, { params: { token: "invalid-token" } });

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("/m/invalid-qr");

      const sessionCookie = response.cookies.get("madrass_table_session");
      // Cookie is deleted or has maxAge 0 / empty
      expect(sessionCookie?.value || "").toBe("");
    });
  });

  describe("Secure Checkout Integration with QR Order Source", () => {
    it("stamps order as QR_MOBILE with verified table when QR cookie is present", async () => {
      const { processCheckoutAction } = await import("@/app/kiosk/checkout/actions");

      // Set valid session cookie
      mockCookieStore["madrass_table_session"] = {
        value: JSON.stringify({
          tableId: "tbl-04",
          tableName: "Table 04",
          restaurantId: "rest-01",
          qrToken: "valid-qr-token-123",
        }),
      };

      await processCheckoutAction({
        idempotencyKey: "idem-qr-123",
        restaurantId: "rest-01",
        customerName: "Ramesh Kumar",
        customerPhone: "9876543210",
        orderType: OrderType.DINE_IN,
        tableId: "tbl-04",
        cart: [
          {
            productId: "prod-dosa",
            quantity: 2,
            options: [],
          },
        ],
        subtotal: 160,
        tax: 8,
        total: 168,
      });

      expect(mockCreateSharedOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          source: OrderSource.QR_MOBILE,
          tableId: "tbl-04",
          orderType: OrderType.DINE_IN,
          customerName: "Ramesh Kumar",
          customerPhone: "9876543210",
        })
      );
    });

    it("stamps order as KIOSK when no QR table session cookie is present", async () => {
      const { processCheckoutAction } = await import("@/app/kiosk/checkout/actions");

      // No session cookie
      delete mockCookieStore["madrass_table_session"];

      await processCheckoutAction({
        idempotencyKey: "idem-kiosk-456",
        restaurantId: "rest-01",
        customerName: "Priya",
        customerPhone: "9876500000",
        orderType: OrderType.TAKEAWAY,
        cart: [
          {
            productId: "prod-idli",
            quantity: 1,
            options: [],
          },
        ],
        subtotal: 60,
        tax: 3,
        total: 63,
      });

      expect(mockCreateSharedOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          source: OrderSource.KIOSK,
          orderType: OrderType.TAKEAWAY,
          tableId: null,
          customerName: "Priya",
        })
      );
    });
  });
});
