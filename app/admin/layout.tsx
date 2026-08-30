"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  ShoppingCart, 
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

const sidebarNavItems = [
  {
    title: "Overview",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Orders",
    href: "/admin/orders",
    icon: ShoppingBag,
  },
  {
    title: "Payments",
    href: "/admin/payments",
    icon: CreditCard,
  },
  {
    title: "Menu",
    href: "/admin/menu",
    icon: UtensilsCrossed,
  },
  {
    title: "Categories",
    href: "/admin/categories",
    icon: Tags,
  },
  {
    title: "Add-ons",
    href: "/admin/addons",
    icon: Tags,
  },
  {
    title: "Combos",
    href: "/admin/combos",
    icon: Tags,
  },
  {
    title: "3D Menu",
    href: "/admin/3d-menu",
    icon: Cuboid,
  },
  {
    title: "Customers",
    href: "/admin/customers",
    icon: Users,
  },
  {
    title: "Tables",
    href: "/admin/tables",
    icon: LayoutDashboard,
  },
  {
    title: "Staff",
    href: "/admin/staff",
    icon: Users,
  },
  {
    title: "Reports",
    href: "/admin/reports",
    icon: BarChart3,
  },
  {
    title: "Coupons",
    href: "/admin/coupons",
    icon: Tags,
  },
  {
    title: "Printers",
    href: "/admin/printers",
    icon: Settings,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: typeof sidebarNavItems;
}

function SidebarNav({ className, items, ...props }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1",
        className
      )}
      {...props}
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "justify-start flex h-10 items-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50",
              pathname === item.href
                ? "bg-accent text-accent-foreground"
                : "transparent",
              "justify-start"
            )}
          >
            <Icon className="mr-2 h-4 w-4" />
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container flex h-16 items-center justify-between py-4 gap-2">
          <div className="flex gap-2 items-center shrink-0">
            <UtensilsCrossed className="h-6 w-6" />
            <h1 className="text-xl font-bold tracking-tight hidden sm:block">Madrass Express Admin</h1>
            <h1 className="text-xl font-bold tracking-tight sm:hidden">Admin</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
            <div className="text-sm hidden sm:block truncate">
              Logged in as <span className="font-semibold">{session?.user?.name || session?.user?.email}</span> ({session?.user?.role})
            </div>
            <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/login" })} className="shrink-0">
              <LogOut className="sm:mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>
      <div className="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
        <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 overflow-y-auto border-r md:sticky md:block">
          <div className="py-6 pr-6">
            <SidebarNav items={sidebarNavItems} />
          </div>
        </aside>

        {/* Mobile Navigation */}
        <div className="md:hidden py-4 overflow-x-auto no-scrollbar w-full border-b mb-2 -mx-4 px-4 w-[calc(100%+2rem)]">
          <SidebarNav items={sidebarNavItems} className="flex-row space-x-2" />
        </div>

        <main className="flex w-full flex-col overflow-hidden py-4 md:py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
