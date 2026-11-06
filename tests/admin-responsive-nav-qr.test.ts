import { describe, it, expect } from "vitest";
import { primaryNavItems, secondaryNavSections } from "@/app/admin/layout";

describe("Admin Responsive Navigation Architecture", () => {
  it("contains exactly 4 primary navigation tabs with correct routes and labels", () => {
    expect(primaryNavItems).toHaveLength(4);

    const routes = primaryNavItems.map((item) => ({
      title: item.title,
      href: item.href,
    }));

    expect(routes).toEqual([
      { title: "Dashboard", href: "/admin" },
      { title: "Orders", href: "/admin/orders" },
      { title: "Menu", href: "/admin/menu" },
      { title: "Tables & QR", href: "/admin/tables" },
    ]);
  });

  it("preserves all 11+ existing administrative features in secondary navigation sections", () => {
    const allSecondaryHrefs = secondaryNavSections.flatMap((s) =>
      s.items.map((i) => i.href)
    );

    // Verify all key modules are accessible
    expect(allSecondaryHrefs).toContain("/admin/payments");
    expect(allSecondaryHrefs).toContain("/admin/customers");
    expect(allSecondaryHrefs).toContain("/admin/reports");
    expect(allSecondaryHrefs).toContain("/admin/categories");
    expect(allSecondaryHrefs).toContain("/admin/addons");
    expect(allSecondaryHrefs).toContain("/admin/combos");
    expect(allSecondaryHrefs).toContain("/admin/3d-menu");
    expect(allSecondaryHrefs).toContain("/admin/coupons");
    expect(allSecondaryHrefs).toContain("/admin/staff");
    expect(allSecondaryHrefs).toContain("/admin/printers");
    expect(allSecondaryHrefs).toContain("/admin/settings");
    expect(allSecondaryHrefs).toContain("/admin/setup");
  });

  it("ensures no route collision between primary and secondary navigation", () => {
    const primaryHrefs = new Set(primaryNavItems.map((item) => item.href));
    const allSecondaryHrefs = secondaryNavSections.flatMap((s) =>
      s.items.map((i) => i.href)
    );

    allSecondaryHrefs.forEach((href) => {
      expect(primaryHrefs.has(href)).toBe(false);
    });
  });
});
