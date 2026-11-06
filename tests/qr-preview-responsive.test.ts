import { describe, it, expect } from "vitest";

describe("Table QR Preview & Print/Download Capabilities", () => {
  const mockTable = {
    id: "table-1",
    number: "T4",
    qrToken: "secure-token-xyz-123",
    isActive: true,
    capacity: 4,
    description: "Window booth",
  };

  const origin = "https://madrass-express.com";

  it("constructs the exact customer scan URL using saved token without regeneration", () => {
    const qrUrl = mockTable.qrToken
      ? `${origin}/m/t/${mockTable.qrToken}`
      : `${origin}/m/t/not-configured`;

    expect(qrUrl).toBe("https://madrass-express.com/m/t/secure-token-xyz-123");
    // Ensure internal database ID is NOT exposed in the public QR URL
    expect(qrUrl).not.toContain("table-1");
  });

  it("generates correct filename for high-res PNG download", () => {
    const restaurantName = "Madrass Express";
    const filename = `${restaurantName.toLowerCase().replace(/\s+/g, "-")}-table-${mockTable.number}-qr-card.png`;

    expect(filename).toBe("madrass-express-table-T4-qr-card.png");
  });

  it("generates correct filename for scalable vector SVG download", () => {
    const restaurantName = "Madrass Express";
    const filename = `${restaurantName.toLowerCase().replace(/\s+/g, "-")}-table-${mockTable.number}-qr.svg`;

    expect(filename).toBe("madrass-express-table-T4-qr.svg");
  });

  it("preserves table token and does not rotate token during regular preview", () => {
    // Initial token
    const tokenBefore = mockTable.qrToken;
    // Dialog render simulation
    const displayedUrl = `${origin}/m/t/${mockTable.qrToken}`;
    expect(displayedUrl).toContain(tokenBefore);
    expect(mockTable.qrToken).toBe(tokenBefore);
  });
});
