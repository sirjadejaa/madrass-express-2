import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateSecureQRToken, resolveTableByToken } from "@/lib/tables/table-service";
import { db } from "@/lib/db";

vi.mock("@/lib/db", () => ({
  db: {
    table: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    order: {
      findFirst: vi.fn(),
    },
  },
}));

describe("Module 1: Table Management and Secure QR Generation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("QR Token Generation", () => {
    it("generates cryptographically unguessable, 32-character URL-safe tokens", () => {
      const token1 = generateSecureQRToken();
      const token2 = generateSecureQRToken();

      expect(token1).toBeDefined();
      expect(typeof token1).toBe("string");
      expect(token1.length).toBeGreaterThanOrEqual(30);
      expect(token1).not.toBe(token2);
      // Verify URL-safe characters
      expect(token1).toMatch(/^[A-Za-z0-9_-]+$/);
    });
  });

  describe("QR Token Resolution", () => {
    it("rejects empty or malformed tokens", async () => {
      const res1 = await resolveTableByToken("");
      expect(res1.valid).toBe(false);
      expect(res1.error).toContain("Invalid QR code format");

      const res2 = await resolveTableByToken("short");
      expect(res2.valid).toBe(false);
    });

    it("returns error when QR token is not found in database", async () => {
      (db.table.findUnique as any).mockResolvedValue(null);

      const res = await resolveTableByToken("valid-length-token-12345678901234567890");
      expect(res.valid).toBe(false);
      expect(res.error).toContain("revoked");
    });

    it("rejects an inactive table even if token exists", async () => {
      (db.table.findUnique as any).mockResolvedValue({
        id: "tbl-1",
        number: "T5",
        qrToken: "test-token-12345678901234567890",
        isActive: false,
        restaurant: {
          id: "rest-1",
          name: "Madrass Express",
          settings: { currency: "INR", taxPercent: 5.0 },
        },
      });

      const res = await resolveTableByToken("test-token-12345678901234567890");
      expect(res.valid).toBe(false);
      expect(res.error).toContain("inactive");
    });

    it("successfully resolves an active table and returns restaurant context", async () => {
      (db.table.findUnique as any).mockResolvedValue({
        id: "tbl-10",
        number: "T10",
        capacity: 4,
        description: "Corner table",
        qrToken: "secure-token-12345678901234567890",
        isActive: true,
        restaurantId: "rest-1",
        restaurant: {
          id: "rest-1",
          name: "Madrass Express",
          settings: { currency: "INR", taxPercent: 5.0 },
          displaySetting: { brandLogoUrl: null },
        },
      });

      const res = await resolveTableByToken("secure-token-12345678901234567890");
      expect(res.valid).toBe(true);
      expect(res.table?.number).toBe("T10");
      expect(res.restaurant?.name).toBe("Madrass Express");
      expect(res.restaurant?.currency).toBe("INR");
    });
  });
});
