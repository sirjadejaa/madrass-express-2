import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getOrderTrackingStatus,
  createServiceRequestAction,
  cancelServiceRequestAction,
  getQuizQuestionsAction,
  submitQuizAction,
} from "@/app/m/order/[trackingToken]/actions";
import { updateServiceRequestStatusAction } from "@/app/admin/service-requests/actions";
import { db } from "@/lib/db";
import {
  OrderStatus,
  PaymentStatus,
  OrderType,
  ServiceRequestType,
  ServiceRequestStatus,
} from "@prisma/client";

// Mock next-auth
let mockSession: any = {
  user: { id: "user-1", email: "admin@madrass.com", role: "ADMIN", restaurantId: "rest-01" },
};
vi.mock("next-auth/next", () => ({
  getServerSession: vi.fn(async () => mockSession),
}));

// Mock revalidatePath
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("Customer Waiting Experience & Call Waiter System (Modules 1-7)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(db.product, "findMany").mockResolvedValue([]);
    vi.spyOn(db.serviceRequest, "findMany").mockResolvedValue([]);
  });

  describe("Module 1 & 2: Post-Order Waiting Screen & Wi-Fi Details", () => {
    it("1. Dine-in order returns table number, preparation message, and active Wi-Fi", async () => {
      vi.spyOn(db.order, "findUnique").mockResolvedValueOnce({
        id: "ord-dine-in-1",
        type: OrderType.DINE_IN,
        source: "QR_MOBILE",
        status: OrderStatus.PREPARING,
        totalAmount: 240 as any,
        discountAmount: 0 as any,
        couponCode: null,
        createdAt: new Date(),
        restaurantId: "rest-01",
        tableId: "tbl-04",
        token: { tokenNumber: 42 },
        table: { id: "tbl-04", number: "Table 04" },
        payment: { status: PaymentStatus.PAID, method: "UPI", amount: 240 as any },
        items: [
          {
            id: "item-1",
            quantity: 2,
            price: 120 as any,
            notes: null,
            product: { name: "Masala Dosa", isVegetarian: true },
            options: [],
          },
        ],
        restaurant: {
          id: "rest-01",
          name: "Madrass Express",
          settings: {
            id: "set-1",
            restaurantId: "rest-01",
            wifiEnabled: true,
            wifiSSID: "MadrassExpress-Guest",
            wifiPassword: "FilterCoffee@123",
            wifiInstructions: "Select network and enter password.",
            gamesEnabled: true,
            gameRewardEnabled: true,
            gameRewardCouponCode: "WINNER10",
            gameRewardMinScore: 75,
            exploreMoreEnabled: true,
            serviceRequestsEnabled: true,
            serviceRequestCooldownSeconds: 60,
          },
        },
      } as any);

      vi.spyOn(db.serviceRequest, "findMany").mockResolvedValueOnce([]);
      vi.spyOn(db.product, "findMany").mockResolvedValueOnce([]);

      const result = await getOrderTrackingStatus("tracking-dine-in-123");
      expect(result.success).toBe(true);
      expect(result.order?.tableNumber).toBe("Table 04");
      expect(result.order?.orderType).toBe(OrderType.DINE_IN);
      expect(result.order?.tokenNumber).toBe(42);
      expect(result.order?.status).toBe(OrderStatus.PREPARING);

      // Verify Wi-Fi is returned with credentials
      expect(result.order?.wifi.enabled).toBe(true);
      expect(result.order?.wifi.ssid).toBe("MadrassExpress-Guest");
      expect(result.order?.wifi.password).toBe("FilterCoffee@123");
    });

    it("2. Takeaway order does NOT display a table number", async () => {
      vi.spyOn(db.order, "findUnique").mockResolvedValueOnce({
        id: "ord-takeaway-1",
        type: OrderType.TAKEAWAY,
        source: "KIOSK",
        status: OrderStatus.NEW,
        totalAmount: 150 as any,
        discountAmount: 0 as any,
        couponCode: null,
        createdAt: new Date(),
        restaurantId: "rest-01",
        tableId: null,
        token: { tokenNumber: 10 },
        table: null,
        payment: { status: PaymentStatus.PAID, method: "UPI", amount: 150 as any },
        items: [],
        restaurant: {
          id: "rest-01",
          name: "Madrass Express",
          settings: {
            wifiEnabled: false,
          },
        },
      } as any);

      const result = await getOrderTrackingStatus("tracking-takeaway-123");
      expect(result.success).toBe(true);
      expect(result.order?.orderType).toBe(OrderType.TAKEAWAY);
      expect(result.order?.tableNumber).toBeNull();
      expect(result.order?.wifi.enabled).toBe(false);
    });
  });

  describe("Module 3: Play & Win Server-Side Scoring & Reward Security", () => {
    it("3. getQuizQuestionsAction omits correctIndex and explanation to prevent cheating", async () => {
      vi.spyOn(db.order, "findUnique").mockResolvedValueOnce({
        restaurantId: "rest-01",
      } as any);

      vi.spyOn(db.quizQuestion, "findMany").mockResolvedValueOnce([
        {
          id: "q-1",
          question: "Which lentil is used in Medu Vada?",
          options: ["Urad Dal", "Chana Dal"],
          order: 1,
        },
      ] as any);

      const res = await getQuizQuestionsAction("token-123");
      expect(res.success).toBe(true);
      expect(res.questions?.[0].id).toBe("q-1");
      expect((res.questions?.[0] as any).correctIndex).toBeUndefined();
      expect((res.questions?.[0] as any).explanation).toBeUndefined();
    });

    it("4. submitQuizAction calculates score strictly on server and awards coupon for winning score", async () => {
      vi.spyOn(db.order, "findUnique").mockResolvedValueOnce({
        id: "ord-1",
        restaurantId: "rest-01",
        tableId: "tbl-04",
        restaurant: {
          settings: {
            gamesEnabled: true,
            gameRewardEnabled: true,
            gameRewardCouponCode: "WINNER10",
            gameRewardMinScore: 50,
          },
        },
      } as any);

      vi.spyOn(db.quizQuestion, "findMany").mockResolvedValueOnce([
        { id: "q-1", correctIndex: 0, explanation: "Urad dal is key." },
        { id: "q-2", correctIndex: 1, explanation: "Davarah froths coffee." },
      ] as any);

      vi.spyOn(db.gameRewardClaim, "findFirst").mockResolvedValueOnce(null);
      vi.spyOn(db.gameRewardClaim, "create").mockResolvedValueOnce({ id: "claim-1" } as any);

      const res = await submitQuizAction({
        trackingToken: "token-123",
        answers: [
          { questionId: "q-1", selectedIndex: 0 }, // correct
          { questionId: "q-2", selectedIndex: 1 }, // correct
        ],
      });

      expect(res.success).toBe(true);
      expect(res.score).toBe(2);
      expect(res.total).toBe(2);
      expect(res.percentage).toBe(100);
      expect(res.passed).toBe(true);
      expect(res.reward?.code).toBe("WINNER10");
      expect(res.alreadyClaimed).toBe(false);
    });

    it("5. submitQuizAction prevents duplicate reward claims for the same order", async () => {
      vi.spyOn(db.order, "findUnique").mockResolvedValueOnce({
        id: "ord-1",
        restaurantId: "rest-01",
        tableId: "tbl-04",
        restaurant: {
          settings: {
            gamesEnabled: true,
            gameRewardEnabled: true,
            gameRewardCouponCode: "WINNER10",
            gameRewardMinScore: 50,
          },
        },
      } as any);

      vi.spyOn(db.quizQuestion, "findMany").mockResolvedValueOnce([
        { id: "q-1", correctIndex: 0, explanation: "Urad dal." },
      ] as any);

      // Simulate reward already claimed
      vi.spyOn(db.gameRewardClaim, "findFirst").mockResolvedValueOnce({
        id: "claim-existing",
        rewardCode: "WINNER10",
        rewardDetails: "You previously unlocked this reward!",
      } as any);

      const createSpy = vi.spyOn(db.gameRewardClaim, "create");

      const res = await submitQuizAction({
        trackingToken: "token-123",
        answers: [{ questionId: "q-1", selectedIndex: 0 }],
      });

      expect(res.success).toBe(true);
      expect(res.alreadyClaimed).toBe(true);
      expect(createSpy).not.toHaveBeenCalled();
    });
  });

  describe("Module 5: Call Waiter / Service Request System", () => {
    it("6. Customer can submit a valid waiter request for their table", async () => {
      vi.spyOn(db.order, "findUnique").mockResolvedValueOnce({
        id: "ord-1",
        type: OrderType.DINE_IN,
        tableId: "tbl-04",
        restaurantId: "rest-01",
        table: { id: "tbl-04", number: "Table 04" },
        restaurant: { settings: { serviceRequestsEnabled: true, serviceRequestCooldownSeconds: 60 } },
      } as any);

      vi.spyOn(db.serviceRequest, "findFirst")
        .mockResolvedValueOnce(null) // no existing pending of same type
        .mockResolvedValueOnce(null); // no cooldown violation

      vi.spyOn(db.serviceRequest, "create").mockResolvedValueOnce({
        id: "req-1",
        type: ServiceRequestType.WATER,
        status: ServiceRequestStatus.PENDING,
        notes: null,
        createdAt: new Date(),
      } as any);

      const res = await createServiceRequestAction({
        trackingToken: "valid-token-123",
        type: ServiceRequestType.WATER,
      });

      expect(res.success).toBe(true);
      expect(res.serviceRequest?.type).toBe(ServiceRequestType.WATER);
      expect(res.serviceRequest?.status).toBe(ServiceRequestStatus.PENDING);
    });

    it("7. Takeaway orders cannot create table service requests", async () => {
      vi.spyOn(db.order, "findUnique").mockResolvedValueOnce({
        id: "ord-takeaway",
        type: OrderType.TAKEAWAY,
        tableId: null,
        restaurant: { settings: { serviceRequestsEnabled: true } },
      } as any);

      const res = await createServiceRequestAction({
        trackingToken: "token-takeaway",
        type: ServiceRequestType.CALL_WAITER,
      });

      expect(res.error).toBe("Service requests are only available for dine-in tables.");
    });

    it("8. Duplicate pending requests of identical type are rejected with a friendly message", async () => {
      vi.spyOn(db.order, "findUnique").mockResolvedValueOnce({
        id: "ord-1",
        type: OrderType.DINE_IN,
        tableId: "tbl-04",
        restaurantId: "rest-01",
        table: { id: "tbl-04" },
        restaurant: { settings: { serviceRequestsEnabled: true } },
      } as any);

      // Existing pending WATER request
      vi.spyOn(db.serviceRequest, "findFirst").mockResolvedValueOnce({
        id: "existing-req",
        type: ServiceRequestType.WATER,
        status: ServiceRequestStatus.PENDING,
      } as any);

      const res = await createServiceRequestAction({
        trackingToken: "valid-token-123",
        type: ServiceRequestType.WATER,
      });

      expect(res.error).toContain("already pending");
    });

    it("9. Cooldown timer prevents spamming multiple requests rapidly", async () => {
      vi.spyOn(db.order, "findUnique").mockResolvedValueOnce({
        id: "ord-1",
        type: OrderType.DINE_IN,
        tableId: "tbl-04",
        restaurantId: "rest-01",
        table: { id: "tbl-04" },
        restaurant: { settings: { serviceRequestsEnabled: true, serviceRequestCooldownSeconds: 60 } },
      } as any);

      // No pending of same type
      vi.spyOn(db.serviceRequest, "findFirst")
        .mockResolvedValueOnce(null)
        // Last request was created 10 seconds ago (less than 60s cooldown)
        .mockResolvedValueOnce({
          id: "req-recent",
          createdAt: new Date(Date.now() - 10 * 1000),
        } as any);

      const res = await createServiceRequestAction({
        trackingToken: "valid-token-123",
        type: ServiceRequestType.BILL,
      });

      expect(res.error).toContain("Please wait");
      expect(res.error).toContain("seconds before submitting another service request");
    });

    it("10. Customer can cancel their own pending service request", async () => {
      vi.spyOn(db.order, "findUnique").mockResolvedValueOnce({
        id: "ord-1",
        tableId: "tbl-04",
      } as any);

      vi.spyOn(db.serviceRequest, "findUnique").mockResolvedValueOnce({
        id: "req-1",
        tableId: "tbl-04",
        status: ServiceRequestStatus.PENDING,
      } as any);

      vi.spyOn(db.serviceRequest, "update").mockResolvedValueOnce({} as any);

      const res = await cancelServiceRequestAction({
        trackingToken: "token-123",
        requestId: "req-1",
      });

      expect(res.success).toBe(true);
    });
  });

  describe("Module 6: Staff Dashboard & Tenant Isolation", () => {
    it("11. Staff can accept and complete a service request", async () => {
      vi.spyOn(db.serviceRequest, "findUnique").mockResolvedValueOnce({
        id: "req-1",
        restaurantId: "rest-01",
        status: ServiceRequestStatus.PENDING,
      } as any);

      vi.spyOn(db.serviceRequest, "update").mockResolvedValueOnce({
        id: "req-1",
        status: ServiceRequestStatus.ACCEPTED,
        acceptedAt: new Date(),
        table: { number: "Table 04" },
      } as any);

      const res = await updateServiceRequestStatusAction({
        requestId: "req-1",
        status: ServiceRequestStatus.ACCEPTED,
      });

      expect(res.success).toBe(true);
      expect(res.request?.status).toBe(ServiceRequestStatus.ACCEPTED);
    });

    it("12. Staff cannot access or update requests belonging to another restaurant", async () => {
      // User is in rest-01, but request belongs to rest-99
      vi.spyOn(db.serviceRequest, "findUnique").mockResolvedValueOnce({
        id: "req-other-restaurant",
        restaurantId: "rest-99",
        status: ServiceRequestStatus.PENDING,
      } as any);

      const updateSpy = vi.spyOn(db.serviceRequest, "update");

      const res = await updateServiceRequestStatusAction({
        requestId: "req-other-restaurant",
        status: ServiceRequestStatus.COMPLETED,
      });

      expect(res.error).toBe("Access denied. Request belongs to another restaurant.");
      expect(updateSpy).not.toHaveBeenCalled();
    });
  });
});
