"use client";

import { useState } from "react";
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
  ShoppingBag
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";

const sidebarNavItems = [
  { title: "Overview", href: "/admin", icon: LayoutDashboard },
  { title: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { title: "Payments", href: "/admin/payments", icon: CreditCard },
  { title: "Menu", href: "/admin/menu", icon: UtensilsCrossed },
  { title: "Categories", href: "/admin/categories", icon: Tags },
  { title: "Add-ons", href: "/admin/addons", icon: Tags },
  { title: "Combos", href: "/admin/combos", icon: Tags },
  { title: "3D Menu", href: "/admin/3d-menu", icon: Cuboid },
  { title: "Customers", href: "/admin/customers", icon: Users },
  { title: "Tables", href: "/admin/tables", icon: LayoutDashboard },
  { title: "Staff", href: "/admin/staff", icon: Users },
  { title: "Reports", href: "/admin/reports", icon: BarChart3 },
  { title: "Coupons", href: "/admin/coupons", icon: Tags },
  { title: "Printers", href: "/admin/printers", icon: Settings },
  { title: "Settings", href: "/admin/settings", icon: Settings },
];

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: typeof sidebarNavItems;
  onNavItemClick?: () => void;
}

function SidebarNav({ className, items, onNavItemClick, ...props }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex flex-col space-y-1.5", className)} {...props}>
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || (pathname.startsWith(item.href + '/') && item.href !== '/admin');
        
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavItemClick}
            className={cn(
              "flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-all focus:outline-none",
              isActive
                ? "bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.05)]"
                : "text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200 border border-transparent"
            )}
          >
            <Icon className={cn("mr-3 h-[18px] w-[18px] transition-colors", isActive ? "text-amber-500" : "text-zinc-500")} strokeWidth={2} />
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-[100dvh] bg-zinc-50 text-zinc-950 font-sans antialiased selection:bg-amber-200/50 selection:text-amber-900">
      
      {/* Desktop Sidebar (Premium Dark) */}
      <aside className="hidden lg:flex flex-col w-[280px] bg-zinc-950 border-r border-zinc-900 sticky top-0 h-[100dvh] shrink-0 shadow-2xl">
        <div className="h-24 flex items-center px-8 border-b border-zinc-900/50">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mr-4 shadow-lg shadow-amber-500/20 shrink-0">
            <UtensilsCrossed className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-white tracking-tight text-xl">Madrass</span>
        </div>
        
        <div className="flex-1 overflow-y-auto py-8 px-5 custom-scrollbar">
          <div className="px-4 text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Dashboard</div>
          <SidebarNav items={sidebarNavItems} />
        </div>
        
        <div className="p-6 border-t border-zinc-900/50 bg-zinc-950/50">
          <div className="flex items-center gap-4 bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800/50">
            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 text-amber-500 font-bold text-sm shadow-inner">
              {session?.user?.name?.charAt(0).toUpperCase() || session?.user?.email?.charAt(0).toUpperCase() || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-zinc-200 truncate">
                {session?.user?.name || "Admin User"}
              </p>
              <p className="text-xs font-medium text-zinc-500 truncate capitalize">
                {session?.user?.role?.toLowerCase() || "Staff"}
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => signOut({ callbackUrl: "/login" })} 
              className="shrink-0 h-9 w-9 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors"
              title="Logout"
            >
              <LogOut className="h-[18px] w-[18px]" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-[100dvh] overflow-y-auto relative">
        
        {/* Mobile / Tablet Header */}
        <header className="lg:hidden sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-zinc-200 h-16 flex items-center justify-between px-4 shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger render={
                <Button variant="ghost" size="icon" className="-ml-2 text-zinc-600 hover:text-zinc-900">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Toggle Menu</span>
                </Button>
              } />
              <SheetContent side="left" className="w-[300px] p-0 flex flex-col bg-zinc-950 border-r-zinc-900">
                <SheetHeader className="h-24 px-8 text-left border-b border-zinc-900/50 flex flex-row items-center space-y-0 gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
                    <UtensilsCrossed className="h-5 w-5 text-white" strokeWidth={2.5} />
                  </div>
                  <SheetTitle className="text-xl font-bold tracking-tight text-white">Madrass</SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto px-5 py-8">
                  <div className="px-4 text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Dashboard</div>
                  <SidebarNav items={sidebarNavItems} onNavItemClick={() => setOpen(false)} />
                </div>
                <div className="p-6 border-t border-zinc-900/50 bg-zinc-950/50">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-zinc-300 border-zinc-800 bg-zinc-900 hover:bg-zinc-800 hover:text-white rounded-xl h-12 font-medium"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                  >
                    <LogOut className="mr-3 h-[18px] w-[18px] text-zinc-500" />
                    Secure Logout
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
            
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shrink-0 shadow-sm">
                <UtensilsCrossed className="h-4 w-4 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-bold tracking-tight text-zinc-900 text-lg">Madrass</span>
            </div>
          </div>
        </header>

        {/* Content Container (Premium Spacing) */}
        <main className="flex-1 w-full max-w-[1200px] mx-auto p-6 md:p-10 lg:p-12 pb-24">
          {children}
        </main>
      </div>
    </div>
  );
}
