"use client";

import { useState, useEffect, useCallback } from "react";
import { format, startOfDay, endOfDay, subDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Download, TrendingUp, IndianRupee, ShoppingBag, XCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getReportData } from "./actions";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

type ReportData = Awaited<ReturnType<typeof getReportData>>;

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a28CFE', '#FE8C9F'];

export function ReportsClient() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportData | null>(null);

  const [dateFilter, setDateFilter] = useState("today");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      let start: Date;
      let end: Date;

      switch (dateFilter) {
        case "today":
          start = startOfDay(now);
          end = endOfDay(now);
          break;
        case "yesterday":
          start = startOfDay(subDays(now, 1));
          end = endOfDay(subDays(now, 1));
          break;
        case "7days":
          start = startOfDay(subDays(now, 6));
          end = endOfDay(now);
          break;
        case "30days":
          start = startOfDay(subDays(now, 29));
          end = endOfDay(now);
          break;
        case "custom":
          if (!customStart || !customEnd) {
            setLoading(false);
            return;
          }
          start = startOfDay(new Date(customStart));
          end = endOfDay(new Date(customEnd));
          break;
        default:
          start = startOfDay(now);
          end = endOfDay(now);
      }

      const res = await getReportData(start.toISOString(), end.toISOString());
      setData(res);
    } catch (error: any) {
      toast({ title: "Failed to load reports", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [dateFilter, customStart, customEnd, toast]);

  useEffect(() => {
    if (dateFilter !== "custom" || (customStart && customEnd)) {
      fetchData();
    }
  }, [fetchData, dateFilter, customStart, customEnd]);

  const handleExportCSV = () => {
    if (!data) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Category,Metric,Value\n";
    
    // Summary
    csvContent += `Summary,Total Orders,${data.summary.totalOrders}\n`;
    csvContent += `Summary,Total Revenue,${data.summary.totalRevenue}\n`;
    csvContent += `Summary,UPI Revenue,${data.summary.upiRevenue}\n`;
    csvContent += `Summary,Cash Revenue,${data.summary.cashRevenue}\n`;
    csvContent += `Summary,Cancelled Orders,${data.summary.cancelledOrders}\n`;
    csvContent += `Summary,Average Order Value,${data.summary.averageOrderValue.toFixed(2)}\n`;

    csvContent += "\nProduct Performance,Quantity Sold,Revenue\n";
    data.productPerformance.forEach(p => {
      csvContent += `"${p.name}",${p.quantity},${p.revenue}\n`;
    });

    csvContent += "\nCategory Performance,Quantity Sold,Revenue\n";
    data.categoryPerformance.forEach(c => {
      csvContent += `"${c.name}",${c.quantity},${c.revenue}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `madrass_express_report_${dateFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-end justify-between bg-card p-4 rounded-lg border">
        <div className="flex gap-4 items-end flex-wrap">
          <div className="space-y-2">
            <label className="text-sm font-medium">Date Range</label>
            <Select value={dateFilter} onValueChange={(v) => v && setDateFilter(v as string)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {dateFilter === "custom" && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <Input 
                  type="date" 
                  value={customStart} 
                  onChange={(e) => setCustomStart(e.target.value)} 
                  className="w-auto"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <Input 
                  type="date" 
                  value={customEnd} 
                  onChange={(e) => setCustomEnd(e.target.value)} 
                  className="w-auto"
                />
              </div>
            </>
          )}
        </div>
        
        <Button variant="outline" onClick={handleExportCSV} disabled={!data || loading}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : data ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <IndianRupee className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{data.summary.totalRevenue.toFixed(2)}</div>
                <div className="flex flex-col text-xs text-muted-foreground mt-1">
                  <span>UPI: ₹{data.summary.upiRevenue.toFixed(2)}</span>
                  <span>Cash: ₹{data.summary.cashRevenue.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.summary.totalOrders}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Avg Order: ₹{data.summary.averageOrderValue.toFixed(2)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cancelled Orders</CardTitle>
                <XCircle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.summary.cancelledOrders}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-1 md:col-span-2">
              <CardHeader>
                <CardTitle>Orders by Hour</CardTitle>
                <CardDescription>Time analysis for the selected period.</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.timeAnalysis} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="hour" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      formatter={(value: any, name: any) => [
                        name === 'revenue' && typeof value === 'number' ? `₹${value.toFixed(2)}` : value, 
                        typeof name === 'string' ? name.charAt(0).toUpperCase() + name.slice(1) : name
                      ]}
                    />
                    <Legend />
                    <Bar dataKey="orders" name="Orders" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="revenue" name="Revenue (₹)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Performance</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                {data.categoryPerformance.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.categoryPerformance}
                        dataKey="revenue"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      >
                        {data.categoryPerformance.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => typeof value === 'number' ? `₹${value.toFixed(2)}` : value} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">No data available</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                {data.paymentStats.some(s => s.value > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.paymentStats}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                      >
                        <Cell fill="#3b82f6" />
                        <Cell fill="#f59e0b" />
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">No data available</div>
                )}
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Product Performance</CardTitle>
                <CardDescription>Top and lowest selling products</CardDescription>
              </CardHeader>
              <CardContent>
                {data.productPerformance.length > 0 ? (
                  <div className="rounded-md border overflow-x-auto w-full">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 border-b">
                        <tr>
                          <th className="text-left p-3 font-medium">Product</th>
                          <th className="text-right p-3 font-medium">Quantity Sold</th>
                          <th className="text-right p-3 font-medium">Revenue (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.productPerformance.map((product) => (
                          <tr key={product.id} className="border-b last:border-0 hover:bg-muted/20">
                            <td className="p-3">{product.name}</td>
                            <td className="p-3 text-right">{product.quantity}</td>
                            <td className="p-3 text-right font-medium">₹{product.revenue.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">No product data for this period</div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}
