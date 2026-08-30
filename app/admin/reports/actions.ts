"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { startOfDay, endOfDay, subDays, format } from "date-fns";

export async function getReportData(startDateIso: string, endDateIso: string) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
    throw new Error("Unauthorized");
  }

  const restaurant = await db.restaurant.findFirst();
  if (!restaurant) {
    throw new Error("Restaurant not found");
  }

  const startDate = new Date(startDateIso);
  const endDate = new Date(endDateIso);

  const orders = await db.order.findMany({
    where: {
      restaurantId: restaurant.id,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      payment: true,
      items: {
        include: {
          product: {
            include: {
              category: true
            }
          },
          options: {
            include: {
              option: true
            }
          }
        }
      }
    }
  });

  // Calculate top-level stats
  let totalOrders = 0;
  let totalRevenue = 0;
  let upiRevenue = 0;
  let cashRevenue = 0;
  let cancelledOrders = 0;

  const validStatuses = ["COMPLETED", "READY", "PREPARING", "ACCEPTED"];
  
  const productStats: Record<string, { id: string, name: string, quantity: number, revenue: number }> = {};
  const categoryStats: Record<string, { name: string, revenue: number, quantity: number }> = {};
  const orderTypeStats = { DINE_IN: 0, TAKEAWAY: 0 };
  const paymentStats = { UPI: 0, CASH: 0 };
  
  // Initialize 24 hours for time analysis
  const timeAnalysis: Record<string, { hour: string, orders: number, revenue: number }> = {};
  for (let i = 0; i < 24; i++) {
    const hr = i.toString().padStart(2, '0') + ":00";
    timeAnalysis[hr] = { hour: hr, orders: 0, revenue: 0 };
  }

  orders.forEach(order => {
    if (order.status === "CANCELLED") {
      cancelledOrders++;
      return; // Skip cancelled from revenue and items
    }

    if (validStatuses.includes(order.status) || order.payment?.status === "PAID" || order.payment?.status === "PAY_AT_COUNTER") {
      totalOrders++;
      const orderTotal = Number(order.totalAmount);
      totalRevenue += orderTotal;

      if (order.payment?.method === "UPI") {
        upiRevenue += orderTotal;
        paymentStats.UPI++;
      } else if (order.payment?.method === "CASH") {
        cashRevenue += orderTotal;
        paymentStats.CASH++;
      }

      if (order.type === "DINE_IN") {
        orderTypeStats.DINE_IN++;
      } else if (order.type === "TAKEAWAY") {
        orderTypeStats.TAKEAWAY++;
      }

      const hourKey = format(order.createdAt, "HH:00");
      if (timeAnalysis[hourKey]) {
        timeAnalysis[hourKey].orders++;
        timeAnalysis[hourKey].revenue += orderTotal;
      }

      // Aggregate Products and Categories
      order.items.forEach(item => {
        const itemRev = Number(item.price) * item.quantity;
        let optionRev = 0;
        item.options.forEach(opt => {
          optionRev += Number(opt.price) * opt.quantity * item.quantity;
        });

        const totalItemRev = itemRev + optionRev;

        // Product
        if (!productStats[item.productId]) {
          productStats[item.productId] = {
            id: item.productId,
            name: item.product.name,
            quantity: 0,
            revenue: 0,
          };
        }
        productStats[item.productId].quantity += item.quantity;
        productStats[item.productId].revenue += totalItemRev;

        // Category
        const catName = item.product.category?.name || "Uncategorized";
        if (!categoryStats[catName]) {
          categoryStats[catName] = { name: catName, revenue: 0, quantity: 0 };
        }
        categoryStats[catName].quantity += item.quantity;
        categoryStats[catName].revenue += totalItemRev;
      });
    }
  });

  const averageOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders) : 0;

  const productPerformance = Object.values(productStats).sort((a, b) => b.quantity - a.quantity);
  const categoryPerformance = Object.values(categoryStats).sort((a, b) => b.revenue - a.revenue);
  const timeAnalysisArray = Object.values(timeAnalysis);

  return {
    summary: {
      totalOrders,
      totalRevenue,
      upiRevenue,
      cashRevenue,
      cancelledOrders,
      averageOrderValue,
    },
    productPerformance,
    categoryPerformance,
    orderTypeStats: [
      { name: "Dine In", value: orderTypeStats.DINE_IN },
      { name: "Takeaway", value: orderTypeStats.TAKEAWAY },
    ],
    paymentStats: [
      { name: "UPI", value: paymentStats.UPI },
      { name: "Cash/Counter", value: paymentStats.CASH },
    ],
    timeAnalysis: timeAnalysisArray,
  };
}
