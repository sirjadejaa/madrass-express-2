export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, IndianRupee, Utensils, Timer, ChefHat, CheckCircle2 } from "lucide-react";
import { OrderStatus, PaymentStatus } from "@prisma/client";

import { redirect } from "next/navigation";

export default async function AdminDashboard() {
  const restaurant = await db.restaurant.findFirst();
  if (!restaurant) {
    redirect("/admin/setup");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dateFilter = {
    createdAt: {
      gte: today,
      lt: tomorrow,
    },
  };

  // Fetch today's orders
  const todayOrders = await db.order.findMany({
    where: dateFilter,
    include: { payment: true },
  });

  const totalOrdersCount = todayOrders.length;
  
  const totalRevenue = todayOrders.reduce((sum, order) => {
    return order.payment?.status === PaymentStatus.PAID ? sum + Number(order.totalAmount) : sum;
  }, 0);

  const upiRevenue = todayOrders.reduce((sum, order) => {
    return (order.payment?.status === PaymentStatus.PAID && order.payment?.method === "UPI") 
      ? sum + Number(order.totalAmount) : sum;
  }, 0);

  const cashRevenue = todayOrders.reduce((sum, order) => {
    return (order.payment?.status === PaymentStatus.PAID && order.payment?.method === "CASH") 
      ? sum + Number(order.totalAmount) : sum;
  }, 0);

  const pendingOrders = todayOrders.filter(o => o.status === OrderStatus.NEW || o.status === OrderStatus.ACCEPTED).length;
  const preparingOrders = todayOrders.filter(o => o.status === OrderStatus.PREPARING).length;
  const readyOrders = todayOrders.filter(o => o.status === OrderStatus.READY).length;

  const averageOrderValue = totalOrdersCount > 0 ? (totalRevenue / totalOrdersCount).toFixed(2) : "0.00";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
        <p className="text-muted-foreground">Here is what's happening at Madrass Express today.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">UPI: ₹{upiRevenue.toFixed(2)} | Cash: ₹{cashRevenue.toFixed(2)}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders Today</CardTitle>
            <Utensils className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrdersCount}</div>
            <p className="text-xs text-muted-foreground">Avg Value: ₹{averageOrderValue}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Preparing Orders</CardTitle>
            <ChefHat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{preparingOrders}</div>
            <p className="text-xs text-muted-foreground">{pendingOrders} Pending</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready Orders</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{readyOrders}</div>
            <p className="text-xs text-muted-foreground">Awaiting pickup/serving</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Additional sections for popular food items can be added here once we have order items populated */}
    </div>
  );
}
