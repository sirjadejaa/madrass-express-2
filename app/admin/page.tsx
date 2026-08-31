export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { IndianRupee, Utensils, ChefHat, TrendingUp, Clock, Package, MoreHorizontal, ArrowUpRight } from "lucide-react";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { DashboardFilter } from "./dashboard-filter";
import { DashboardChart } from "./dashboard-chart";
import { format, startOfDay, endOfDay, subDays } from "date-fns";
import { Badge } from "@/components/ui/badge";

function formatStatus(status: OrderStatus) {
  switch (status) {
    case OrderStatus.NEW: return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 font-medium">New</Badge>;
    case OrderStatus.ACCEPTED: return <Badge variant="outline" className="bg-indigo-500/10 text-indigo-600 border-indigo-500/20 font-medium">Accepted</Badge>;
    case OrderStatus.PREPARING: return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 font-medium">Preparing</Badge>;
    case OrderStatus.READY: return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-medium">Ready</Badge>;
    case OrderStatus.COMPLETED: return <Badge variant="outline" className="bg-zinc-100 text-zinc-600 border-zinc-200 font-medium">Completed</Badge>;
    case OrderStatus.CANCELLED: return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20 font-medium">Cancelled</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
}

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: { days?: string }
}) {
  const restaurant = await db.restaurant.findFirst();
  if (!restaurant) {
    redirect("/admin/setup");
  }

  const days = parseInt(searchParams.days || "1", 10);
  const isValidDays = [1, 7, 10, 15, 30].includes(days);
  const filterDays = isValidDays ? days : 1;

  const now = new Date();
  
  let startDate: Date;
  const endDate: Date = endOfDay(now);

  if (filterDays === 1) {
    startDate = startOfDay(now);
  } else {
    startDate = startOfDay(subDays(now, filterDays - 1));
  }

  const dateFilter = {
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
  };

  // Pre-fill daily data for chart
  const dailyDataMap = new Map<string, { date: string; orders: number; revenue: number }>();
  if (filterDays > 1) {
    for (let i = filterDays - 1; i >= 0; i--) {
      const d = subDays(now, i);
      const dateLabel = filterDays <= 7 ? format(d, "EEE") : format(d, "MMM d");
      const key = format(d, "yyyy-MM-dd");
      dailyDataMap.set(key, { date: dateLabel, orders: 0, revenue: 0 });
    }
  }

  // Fetch orders within the date range
  const periodOrders = await db.order.findMany({
    where: dateFilter,
    select: { 
      id: true,
      status: true,
      totalAmount: true,
      createdAt: true,
      payment: { select: { status: true } },
      token: { select: { tokenNumber: true } },
      items: {
        select: {
          quantity: true,
          productId: true,
          product: { select: { name: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const totalOrdersCount = periodOrders.length;
  
  const totalRevenue = periodOrders.reduce((sum, order) => {
    return order.payment?.status === PaymentStatus.PAID ? sum + Number(order.totalAmount) : sum;
  }, 0);

  const pendingOrders = periodOrders.filter(o => o.status === OrderStatus.NEW || o.status === OrderStatus.ACCEPTED).length;
  const preparingOrders = periodOrders.filter(o => o.status === OrderStatus.PREPARING).length;
  const readyOrders = periodOrders.filter(o => o.status === OrderStatus.READY).length;

  const averageOrderValue = totalOrdersCount > 0 ? (totalRevenue / totalOrdersCount).toFixed(2) : "0.00";

  // Calculate popular items
  const itemCounts: Record<string, { name: string; count: number }> = {};
  
  periodOrders.forEach(order => {
    order.items.forEach(item => {
      if (itemCounts[item.productId]) {
        itemCounts[item.productId].count += item.quantity;
      } else {
        itemCounts[item.productId] = { name: item.product.name, count: item.quantity };
      }
    });

    if (filterDays > 1) {
      const key = format(new Date(order.createdAt), "yyyy-MM-dd");
      if (dailyDataMap.has(key)) {
        const entry = dailyDataMap.get(key)!;
        entry.orders += 1;
        if (order.payment?.status === PaymentStatus.PAID) {
          entry.revenue += Number(order.totalAmount);
        }
      }
    }
  });

  const popularItems = Object.values(itemCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
    
  const chartData = Array.from(dailyDataMap.values());
  const recentOrders = periodOrders.slice(0, 6);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-zinc-200/50">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-950">
            Overview
          </h2>
          <p className="text-sm font-medium text-zinc-500 mt-1.5">
            {filterDays === 1 ? `Today, ${format(now, "MMMM do, yyyy")}` : `Last ${filterDays} days`} performance at {restaurant.name}.
          </p>
        </div>
        <DashboardFilter />
      </div>

      {/* Metrics Row */}
      <div className="grid gap-5 grid-cols-2 xl:grid-cols-4">
        
        <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm flex flex-col justify-between group hover:border-amber-500/20 transition-colors">
          <div className="flex items-center justify-between mb-8">
            <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <IndianRupee className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-zinc-950 tracking-tight">₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            <p className="text-sm font-medium text-zinc-500 mt-2 flex items-center">
              <TrendingUp className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
              Avg ₹{averageOrderValue} / order
            </p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm flex flex-col justify-between group hover:border-amber-500/20 transition-colors">
          <div className="flex items-center justify-between mb-8">
            <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Orders</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Package className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-zinc-950 tracking-tight">{totalOrdersCount.toLocaleString()}</div>
            <p className="text-sm font-medium text-zinc-500 mt-2">{filterDays === 1 ? 'Total orders today' : `Total orders in ${filterDays}d`}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm flex flex-col justify-between group hover:border-amber-500/20 transition-colors">
          <div className="flex items-center justify-between mb-8">
            <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Pending</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-zinc-950 tracking-tight">{pendingOrders.toLocaleString()}</div>
            <p className="text-sm font-medium text-amber-600 mt-2 flex items-center">
              Needs attention
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm flex flex-col justify-between group hover:border-amber-500/20 transition-colors">
          <div className="flex items-center justify-between mb-8">
            <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Preparing</span>
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <ChefHat className="w-4 h-4 text-orange-600" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-zinc-950 tracking-tight">{preparingOrders.toLocaleString()}</div>
            <p className="text-sm font-medium text-zinc-500 mt-2">{readyOrders} ready for pickup</p>
          </div>
        </div>

      </div>

      {filterDays > 1 && (
        <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-zinc-900 tracking-tight">Performance Trend</h3>
          </div>
          <DashboardChart data={chartData} />
        </div>
      )}
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Recent Orders */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between">
            <h3 className="font-bold text-zinc-900 tracking-tight">Recent Orders</h3>
            <button className="text-sm font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1">
              View All <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="p-0 flex-1">
            {recentOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
                <div className="w-16 h-16 rounded-full bg-zinc-50 flex items-center justify-center mb-4 border border-zinc-100">
                  <Utensils className="w-6 h-6 text-zinc-300" strokeWidth={1.5} />
                </div>
                <p className="font-medium text-sm">No orders received {filterDays === 1 ? 'today' : `in the last ${filterDays} days`}.</p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 bg-zinc-50/50">
                      <tr>
                        <th className="px-6 py-4 font-bold">Order ID</th>
                        <th className="px-6 py-4 font-bold">Items</th>
                        <th className="px-6 py-4 font-bold">Amount</th>
                        <th className="px-6 py-4 font-bold">Status</th>
                        <th className="px-6 py-4 font-bold text-right">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {recentOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-zinc-50/50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-zinc-100 border border-zinc-200/50 flex items-center justify-center font-bold text-zinc-700 shadow-sm">
                                {order.token?.tokenNumber ? `#${order.token.tokenNumber}` : '-'}
                              </div>
                              <div className="text-[11px] font-mono font-medium text-zinc-400">{order.id.slice(-6).toUpperCase()}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-zinc-950 font-medium truncate max-w-[200px]">
                                {order.items[0]?.product.name || 'Unknown Item'}
                              </span>
                              {order.items.length > 1 && (
                                <span className="text-[11px] font-semibold text-zinc-500 mt-0.5">
                                  + {order.items.length - 1} more items
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 font-bold text-zinc-950">
                            ₹{Number(order.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4">
                            {formatStatus(order.status)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-[11px] font-semibold text-zinc-500 bg-zinc-100/80 px-2.5 py-1 rounded-md">
                              {format(new Date(order.createdAt), "h:mm a")}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden flex flex-col divide-y divide-zinc-100">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="p-5 flex flex-col gap-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-zinc-100 border border-zinc-200/50 flex items-center justify-center font-bold text-zinc-700">
                            {order.token?.tokenNumber ? `#${order.token.tokenNumber}` : '-'}
                          </div>
                          <div>
                            <div className="font-bold text-zinc-950">
                              ₹{Number(order.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </div>
                            <div className="text-[11px] font-semibold text-zinc-500">
                              {format(new Date(order.createdAt), "h:mm a")} &bull; {order.items.length} item(s)
                            </div>
                          </div>
                        </div>
                        {formatStatus(order.status)}
                      </div>
                      <div className="text-sm font-medium text-zinc-700 truncate pl-13">
                        {order.items.map(i => i.product.name).join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Popular Items */}
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between">
            <h3 className="font-bold text-zinc-900 tracking-tight">Popular Items</h3>
          </div>
          <div className="p-0 flex-1">
            {popularItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
                <p className="font-medium text-sm">Not enough data.</p>
              </div>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {popularItems.map((item, i) => (
                  <li key={i} className="flex items-center justify-between px-6 py-4 hover:bg-zinc-50/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        i === 0 ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' : 
                        i === 1 ? 'bg-slate-200/50 text-slate-600 border border-slate-200' : 
                        i === 2 ? 'bg-orange-500/10 text-orange-600 border border-orange-500/20' : 
                        'bg-zinc-100 text-zinc-500'
                      }`}>
                        {i + 1}
                      </div>
                      <span className="font-semibold text-sm text-zinc-950 line-clamp-1">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-zinc-100/80 px-2.5 py-1 rounded-md border border-zinc-200/50 shrink-0">
                      <span className="text-[11px] font-bold text-zinc-500 uppercase">Qty</span>
                      <span className="text-xs font-bold text-zinc-900">{item.count}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
      
    </div>
  );
}
