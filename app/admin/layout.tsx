"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  Tags, 
  Users, 
  CreditCard, 
  BarChart3, 
  Settings,
  LogOut,
  Menu,
  Cuboid,
  ShoppingBag,
  QrCode,
  SlidersHorizontal,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
  PlusCircle,
  Layers,
  Ticket,
  Printer,
  Wrench,
  Check
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

// Exactly 4 Primary Navigation Tabs (Prominent on both Desktop & Mobile)
export const primaryNavItems = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { title: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { title: "Menu", href: "/admin/menu", icon: UtensilsCrossed },
  { title: "Tables & QR", href: "/admin/tables", icon: QrCode },
];

// Secondary Navigation Sections (Preserving all 11 additional admin capabilities)
export const secondaryNavSections = [
  {
    title: "Operations & Sales",
    items: [
      { title: "Payments", href: "/admin/payments", icon: CreditCard },
      { title: "Customers", href: "/admin/customers", icon: Users },
      { title: "Reports & Analytics", href: "/admin/reports", icon: BarChart3 },
    ],
  },
  {
    title: "Menu & Catalog",
    items: [
      { title: "Categories", href: "/admin/categories", icon: Tags },
      { title: "Add-ons", href: "/admin/addons", icon: PlusCircle },
      { title: "Combos", href: "/admin/combos", icon: Layers },
      { title: "3D Menu Models", href: "/admin/3d-menu", icon: Cuboid },
      { title: "Coupons & Offers", href: "/admin/coupons", icon: Ticket },
    ],
  },
  {
    title: "Administration",
    items: [
      { title: "Staff & Roles", href: "/admin/staff", icon: Users },
      { title: "Printers", href: "/admin/printers", icon: Printer },
      { title: "Restaurant Settings", href: "/admin/settings", icon: Settings },
      { title: "Initial Setup", href: "/admin/setup", icon: Wrench },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [pathname]);

  const isRouteActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  // Find current active section title for mobile header
  const getActiveTitle = () => {
    const primary = primaryNavItems.find(item => isRouteActive(item.href));
    if (primary) return primary.title;

    for (const section of secondaryNavSections) {
      const secondary = section.items.find(item => isRouteActive(item.href));
      if (secondary) return secondary.title;
    }

    return "Admin";
  };

  return (
    <div className="min-h-[100dvh] bg-zinc-50 dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 flex flex-col antialiased selection:bg-amber-200/50 selection:text-amber-900 overflow-x-hidden">
      
      {/* =========================================================================
          DESKTOP TOP NAVBAR (4 PRIMARY TABS + QUICK CONTROLS)
          ========================================================================= */}
      <header className="hidden lg:flex sticky top-0 z-40 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 h-16 items-center justify-between px-6 shadow-xs shrink-0 print:hidden">
        {/* Left: Brand + Sidebar Toggle */}
        <div className="flex items-center gap-3">
          <Link href="/admin" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <UtensilsCrossed className="h-4.5 w-4.5 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-zinc-900 dark:text-white tracking-tight text-base leading-tight">
                Madrass <span className="text-amber-600 dark:text-amber-500">Express</span>
              </span>
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest leading-none">
                Admin Panel
              </span>
            </div>
          </Link>

          <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-800 mx-2" />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDesktopSidebarCollapsed(!desktopSidebarCollapsed)}
            className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 h-8 px-2 rounded-lg text-xs font-semibold gap-1.5"
            title={desktopSidebarCollapsed ? "Expand Secondary Sidebar" : "Collapse Sidebar"}
          >
            {desktopSidebarCollapsed ? (
              <>
                <PanelLeft className="w-4 h-4 text-amber-600" />
                <span>Show Sidebar</span>
              </>
            ) : (
              <>
                <PanelLeftClose className="w-4 h-4" />
                <span>Hide Sidebar</span>
              </>
            )}
          </Button>
        </div>

        {/* Center: THE 4 PRIMARY NAVIGATION TABS */}
        <nav className="flex items-center bg-zinc-100 dark:bg-zinc-900 p-1 rounded-2xl border border-zinc-200/70 dark:border-zinc-800/80 shadow-inner">
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const active = isRouteActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all select-none",
                  active
                    ? "bg-white dark:bg-zinc-950 text-amber-700 dark:text-amber-400 shadow-sm border border-zinc-200/80 dark:border-zinc-800"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50"
                )}
              >
                <Icon className={cn("w-4 h-4", active ? "text-amber-600 dark:text-amber-400" : "text-zinc-400")} />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right: User Badge & Secure Logout */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-full">
            <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold text-xs">
              {session?.user?.name?.charAt(0).toUpperCase() || "A"}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 leading-tight truncate max-w-[110px]">
                {session?.user?.name || "Admin"}
              </span>
              <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider leading-none">
                {session?.user?.role || "Staff"}
              </span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-9 h-9 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-full"
            title="Sign out of Admin Panel"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* =========================================================================
          MOBILE TOP HEADER (< 1024px)
          ========================================================================= */}
      <header className="lg:hidden sticky top-0 z-40 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 h-14 flex items-center justify-between px-4 shrink-0 shadow-xs print:hidden">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
            <UtensilsCrossed className="h-4 w-4" strokeWidth={2.5} />
          </div>
          <span className="font-extrabold text-sm tracking-tight text-zinc-900 dark:text-white">
            Madrass Admin
          </span>
        </Link>

        {/* Current Active Section Badge */}
        <div className="text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
          {getActiveTitle()}
        </div>

        {/* All Features Menu Trigger */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMobileDrawerOpen(true)}
          className="h-8 px-2.5 rounded-xl border-zinc-200 dark:border-zinc-800 text-xs font-bold gap-1.5 shadow-xs"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
          <span>More</span>
        </Button>
      </header>

      {/* =========================================================================
          MAIN LAYOUT CONTAINER (DESKTOP SIDEBAR + CONTENT AREA)
          ========================================================================= */}
      <div className="flex-1 flex w-full relative overflow-x-hidden min-h-0">
        
        {/* DESKTOP SECONDARY SIDEBAR */}
        <aside
          className={cn(
            "hidden lg:flex flex-col bg-zinc-950 text-white border-r border-zinc-900 shrink-0 sticky top-16 h-[calc(100dvh-4rem)] shadow-xl transition-all duration-300 z-30 print:hidden",
            desktopSidebarCollapsed ? "w-0 overflow-hidden border-none opacity-0 pointer-events-none" : "w-[260px] opacity-100"
          )}
        >
          <div className="p-4 border-b border-zinc-900/60 bg-zinc-900/40">
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
              More Admin Modules
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 custom-scrollbar">
            {secondaryNavSections.map((section) => (
              <div key={section.title} className="space-y-1.5">
                <div className="px-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  {section.title}
                </div>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const active = isRouteActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all group",
                          active
                            ? "bg-amber-500/15 text-amber-400 border border-amber-500/25 shadow-xs"
                            : "text-zinc-400 hover:bg-zinc-900/70 hover:text-zinc-100 border border-transparent"
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={cn("w-4 h-4", active ? "text-amber-400" : "text-zinc-500 group-hover:text-zinc-300")} />
                          <span>{item.title}</span>
                        </div>
                        {active && <Check className="w-3 h-3 text-amber-400" />}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Staff info in sidebar bottom */}
          <div className="p-4 border-t border-zinc-900/80 bg-zinc-950/80">
            <div className="text-[11px] text-zinc-500 text-center font-medium">
              Restaurant POS & QR Engine v2.1
            </div>
          </div>
        </aside>

        {/* =========================================================================
            MOBILE SLIDE-OUT DRAWER (Radix/Shadcn Sheet)
            ========================================================================= */}
        <Sheet open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
          <SheetContent
            side="left"
            className="w-[85vw] max-w-[320px] p-0 flex flex-col bg-zinc-950 text-white border-r border-zinc-900 z-50 pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]"
          >
            <SheetHeader className="p-5 border-b border-zinc-900/80 flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md">
                  <UtensilsCrossed className="h-4 w-4 text-white" strokeWidth={2.5} />
                </div>
                <SheetTitle className="text-base font-extrabold text-white tracking-tight">
                  All Features
                </SheetTitle>
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Primary Tabs Shortcut inside Drawer */}
              <div className="space-y-1.5">
                <div className="px-3 text-[10px] font-bold text-amber-500/80 uppercase tracking-widest">
                  Primary Sections
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {primaryNavItems.map((item) => {
                    const Icon = item.icon;
                    const active = isRouteActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileDrawerOpen(false)}
                        className={cn(
                          "flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border text-center transition-all",
                          active
                            ? "bg-amber-500/15 border-amber-500/30 text-amber-400 font-bold"
                            : "bg-zinc-900/50 border-zinc-850 text-zinc-300 hover:bg-zinc-900"
                        )}
                      >
                        <Icon className="w-4.5 h-4.5" />
                        <span className="text-[11px]">{item.title}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Secondary Navigation Sections */}
              {secondaryNavSections.map((section) => (
                <div key={section.title} className="space-y-1.5">
                  <div className="px-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    {section.title}
                  </div>
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const active = isRouteActive(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileDrawerOpen(false)}
                          className={cn(
                            "flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all",
                            active
                              ? "bg-amber-500/15 text-amber-400 border border-amber-500/25"
                              : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 border border-transparent"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className={cn("w-4 h-4", active ? "text-amber-400" : "text-zinc-500")} />
                            <span>{item.title}</span>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom session / signout */}
            <div className="p-4 border-t border-zinc-900 bg-zinc-900/50 space-y-3">
              <div className="flex items-center justify-between px-2">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-zinc-200">
                    {session?.user?.name || "Admin"}
                  </span>
                  <span className="text-[10px] text-zinc-500 uppercase font-bold">
                    {session?.user?.role || "STAFF"}
                  </span>
                </div>
                <div className="w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
              </div>

              <Button
                variant="outline"
                onClick={() => {
                  setMobileDrawerOpen(false);
                  signOut({ callbackUrl: "/login" });
                }}
                className="w-full justify-center text-xs text-red-400 border-zinc-800 bg-zinc-900 hover:bg-red-950/30 hover:text-red-300 hover:border-red-900/40 rounded-xl h-10 font-bold gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* =========================================================================
            RESPONSIVE CONTENT CONTAINER (320px to 1440px)
            ========================================================================= */}
        <main className="flex-1 w-full max-w-[1240px] mx-auto p-4 sm:p-6 md:p-8 lg:p-10 pb-28 lg:pb-12 min-w-0">
          {children}
        </main>
      </div>

      {/* =========================================================================
          MOBILE BOTTOM PRIMARY NAVIGATION BAR (THE 4 PRIMARY TABS + MORE)
          ========================================================================= */}
      <nav
        aria-label="Mobile Primary Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-200 dark:border-zinc-800 px-2 pt-1.5 pb-[calc(env(safe-area-inset-bottom,0px)+0.4rem)] shadow-[0_-4px_25px_rgba(0,0,0,0.06)] print:hidden"
      >
        <div className="grid grid-cols-5 items-center gap-1 max-w-md mx-auto">
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const active = isRouteActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center py-1 rounded-xl transition-all min-h-[46px] select-none",
                  active
                    ? "text-amber-700 dark:text-amber-400 font-extrabold"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                )}
              >
                <div
                  className={cn(
                    "p-1 rounded-lg transition-transform",
                    active && "bg-amber-500/15 scale-110"
                  )}
                >
                  <Icon className="w-4.5 h-4.5" strokeWidth={active ? 2.5 : 2} />
                </div>
                <span className="text-[10px] tracking-tight mt-0.5 truncate max-w-[64px]">
                  {item.title}
                </span>
              </Link>
            );
          })}

          {/* 5th Button: More (opens secondary drawer) */}
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            className="flex flex-col items-center justify-center py-1 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all min-h-[46px] select-none"
          >
            <div className="p-1 rounded-lg">
              <Menu className="w-4.5 h-4.5" strokeWidth={2} />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5 truncate max-w-[64px]">
              More
            </span>
          </button>
        </div>
      </nav>

    </div>
  );
}
