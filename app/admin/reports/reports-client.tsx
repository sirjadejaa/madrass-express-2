"use client";

import { useState, useEffect, useCallback } from "react";
import { format, startOfDay, endOfDay, subDays } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Download, TrendingUp, ReceiptIndianRupee, ShoppingBag, XCircle, Calendar, CreditCard, Banknote, MapPin, Tag } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getReportData } from "./actions";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

type ReportData = Awaited<ReturnType<typeof getReportData>>;

const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#14b8a6', '#0ea5e9'];

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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-zinc-200/50">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-950">Reports & Analytics</h2>
          <p className="text-sm font-medium text-zinc-500 mt-1.5">View comprehensive business insights and export data.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-100 p-5 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 items-end justify-between">
          <div className="flex flex-col sm:flex-row gap-4 items-end flex-wrap w-full md:w-auto">
            <div className="space-y-2 w-full sm:w-auto">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-1.5" /> Date Range
              </label>
              <Select value={dateFilter} onValueChange={(v) => v && setDateFilter(v as string)}>
                <SelectTrigger className="w-full sm:w-[200px] h-11 bg-zinc-50 border-zinc-200 font-medium rounded-xl focus:ring-amber-500/20">
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-zinc-200 shadow-lg">
                  <SelectItem value="today" className="font-medium">Today</SelectItem>
                  <SelectItem value="yesterday" className="font-medium">Yesterday</SelectItem>
                  <SelectItem value="7days" className="font-medium">Last 7 Days</SelectItem>
                  <SelectItem value="30days" className="font-medium">Last 30 Days</SelectItem>
                  <SelectItem value="custom" className="font-medium">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {dateFilter === "custom" && (
              <div className="flex gap-3 w-full sm:w-auto animate-in fade-in zoom-in-95 duration-200">
                <div className="space-y-2 flex-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Start</label>
                  <Input 
                    type="date" 
                    value={customStart} 
                    onChange={(e) => setCustomStart(e.target.value)} 
                    className="w-full h-11 bg-zinc-50 border-zinc-200 rounded-xl focus-visible:ring-amber-500/20"
                  />
                </div>
                <div className="space-y-2 flex-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">End</label>
                  <Input 
                    type="date" 
                    value={customEnd} 
                    onChange={(e) => setCustomEnd(e.target.value)} 
                    className="w-full h-11 bg-zinc-50 border-zinc-200 rounded-xl focus-visible:ring-amber-500/20"
                  />
                </div>
              </div>
            )}
          </div>
          
          <Button 
            onClick={handleExportCSV} 
            disabled={!data || loading}
            className="w-full md:w-auto h-11 px-6 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-semibold shadow-sm transition-all"
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
          <p className="text-sm font-medium text-zinc-500">Generating report data...</p>
        </div>
      ) : data ? (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          {/* Top Metrics */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-gradient-to-br from-zinc-950 to-zinc-900 rounded-2xl border border-zinc-800 p-6 shadow-md text-white relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors"></div>
              <div className="flex items-center justify-between mb-6 relative z-10">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Total Revenue</h3>
                <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white backdrop-blur-sm border border-white/10">
                  <ReceiptIndianRupee className="h-5 w-5" />
                </div>
              </div>
              <div className="text-4xl font-black tracking-tight mb-2 relative z-10">
                ₹{data.summary.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div className="flex items-center gap-3 text-xs font-medium text-zinc-400 relative z-10 pt-4 border-t border-white/10">
                <span className="flex items-center bg-white/5 px-2 py-1 rounded border border-white/5">
                  <CreditCard className="w-3 h-3 mr-1.5" /> UPI: ₹{data.summary.upiRevenue.toLocaleString('en-IN')}
                </span>
                <span className="flex items-center bg-white/5 px-2 py-1 rounded border border-white/5">
                  <Banknote className="w-3 h-3 mr-1.5" /> Cash: ₹{data.summary.cashRevenue.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm flex flex-col justify-between group hover:border-amber-500/30 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Total Orders</h3>
                  <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                    <ShoppingBag className="h-5 w-5" />
                  </div>
                </div>
                <div className="text-4xl font-black tracking-tight text-zinc-950 mb-2">
                  {data.summary.totalOrders.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-500 uppercase">Avg Order Value</span>
                <span className="text-sm font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md">
                  ₹{data.summary.averageOrderValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm flex flex-col justify-between group hover:border-red-500/30 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Cancelled Orders</h3>
                  <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center text-red-500 group-hover:bg-red-500 group-hover:text-white transition-colors">
                    <XCircle className="h-5 w-5" />
                  </div>
                </div>
                <div className="text-4xl font-black tracking-tight text-zinc-950 mb-2">
                  {data.summary.cancelledOrders.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="pt-4 border-t border-zinc-100">
                <span className="text-xs font-medium text-zinc-500">
                  {data.summary.totalOrders > 0 ? ((data.summary.cancelledOrders / data.summary.totalOrders) * 100).toFixed(1) : 0}% cancellation rate
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Main Chart */}
            <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm md:col-span-2">
              <div className="mb-6 border-b border-zinc-100 pb-4">
                <h3 className="text-lg font-bold text-zinc-950 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-zinc-400" />
                  Orders by Hour
                </h3>
                <p className="text-sm font-medium text-zinc-500 mt-1">Activity distribution for the selected time period</p>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.timeAnalysis} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                    <XAxis 
                      dataKey="hour" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      tick={{fill: '#71717a'}}
                      dy={10}
                    />
                    <YAxis 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      tick={{fill: '#71717a'}}
                      tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(1)}k` : value}
                    />
                    <Tooltip 
                      cursor={{fill: '#f4f4f5'}}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e4e4e7', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: any, name: any) => [
                        name === 'revenue' && typeof value === 'number' ? `₹${value.toLocaleString('en-IN')}` : value, 
                        typeof name === 'string' ? name.charAt(0).toUpperCase() + name.slice(1) : name
                      ]}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Bar dataKey="orders" name="Orders" fill="#0f172a" radius={[6, 6, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="revenue" name="Revenue (₹)" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Performance */}
            <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm">
              <div className="mb-6 border-b border-zinc-100 pb-4">
                <h3 className="text-lg font-bold text-zinc-950 flex items-center">
                  <Tag className="w-5 h-5 mr-2 text-zinc-400" />
                  Sales by Category
                </h3>
              </div>
              <div className="h-[250px] w-full">
                {data.categoryPerformance.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.categoryPerformance}
                        dataKey="revenue"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        stroke="none"
                      >
                        {data.categoryPerformance.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: '1px solid #e4e4e7', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: any) => typeof value === 'number' ? `₹${value.toLocaleString('en-IN')}` : value} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-zinc-400 font-medium text-sm">No category data</div>
                )}
              </div>
              {/* Legend List */}
              <div className="mt-4 space-y-2 max-h-[100px] overflow-y-auto pr-2">
                {data.categoryPerformance.slice(0, 4).map((category, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                      <span className="font-medium text-zinc-700 truncate max-w-[100px]" title={category.name}>{category.name}</span>
                    </div>
                    <span className="font-bold text-zinc-950">₹{category.revenue.toLocaleString('en-IN', {maximumFractionDigits: 0})}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm">
              <div className="mb-6 border-b border-zinc-100 pb-4">
                <h3 className="text-lg font-bold text-zinc-950 flex items-center">
                  <CreditCard className="w-5 h-5 mr-2 text-zinc-400" />
                  Payment Distribution
                </h3>
              </div>
              <div className="h-[250px] w-full">
                {data.paymentStats.some(s => s.value > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.paymentStats.filter(s => s.value > 0)}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={90}
                        paddingAngle={5}
                        stroke="none"
                      >
                        {data.paymentStats.filter(s => s.value > 0).map((entry, index) => {
                          let color = '#3b82f6'; // blue for UPI
                          if (entry.name.toLowerCase().includes('cash')) color = '#10b981'; // green for cash
                          if (entry.name.toLowerCase().includes('card')) color = '#8b5cf6'; // purple for card
                          return <Cell key={`cell-${index}`} fill={color} />;
                        })}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: '1px solid #e4e4e7' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '14px', fontWeight: 500 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-zinc-400 font-medium text-sm">No payment data</div>
                )}
              </div>
            </div>

            {/* Top Products Table */}
            <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden md:col-span-2 flex flex-col">
              <div className="p-6 border-b border-zinc-100">
                <h3 className="text-lg font-bold text-zinc-950 flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-zinc-400" />
                  Product Performance
                </h3>
                <p className="text-sm font-medium text-zinc-500 mt-1">Top selling items by revenue and quantity</p>
              </div>
              
              <div className="flex-1 overflow-x-auto">
                {data.productPerformance.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead className="bg-zinc-50/80 border-b border-zinc-100">
                      <tr>
                        <th className="text-left p-4 font-bold text-zinc-500 uppercase tracking-widest text-[11px]">Product</th>
                        <th className="text-right p-4 font-bold text-zinc-500 uppercase tracking-widest text-[11px]">Qty Sold</th>
                        <th className="text-right p-4 font-bold text-zinc-500 uppercase tracking-widest text-[11px]">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {data.productPerformance.slice(0, 10).map((product, idx) => (
                        <tr key={product.id} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center">
                              <span className="w-5 text-zinc-400 font-mono text-xs">{idx + 1}.</span>
                              <span className="font-bold text-zinc-950">{product.name}</span>
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <span className="bg-zinc-100 text-zinc-700 font-bold px-2 py-1 rounded-md text-xs">
                              {product.quantity}
                            </span>
                          </td>
                          <td className="p-4 text-right font-black text-zinc-950">
                            ₹{product.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-12 text-zinc-400 font-medium">No product data for this period</div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
