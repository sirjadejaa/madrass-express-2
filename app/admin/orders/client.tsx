"use client";

import { useState } from "react";
import { format } from "date-fns";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Eye, Utensils, ShoppingBag, Receipt, CheckCircle2, Clock, MapPin, Phone, CreditCard, ReceiptIndianRupee, User } from "lucide-react";

export function OrdersClient({ initialOrders }: { initialOrders: any[] }) {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "NEW": return <Badge variant="outline" className="bg-blue-50/50 text-blue-600 border-blue-200 font-bold px-2 py-0.5"><Clock className="w-3 h-3 mr-1" /> New</Badge>;
      case "ACCEPTED": return <Badge variant="outline" className="bg-indigo-50/50 text-indigo-600 border-indigo-200 font-bold px-2 py-0.5">Accepted</Badge>;
      case "PREPARING": return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold px-2 py-0.5"><Utensils className="w-3 h-3 mr-1" /> Preparing</Badge>;
      case "READY": return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold px-2 py-0.5">Ready</Badge>;
      case "COMPLETED": return <Badge variant="outline" className="bg-zinc-100 text-zinc-600 border-zinc-200/50 font-bold px-2 py-0.5"><CheckCircle2 className="w-3 h-3 mr-1" /> Completed</Badge>;
      case "CANCELLED": return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 font-bold px-2 py-0.5">Cancelled</Badge>;
      default: return <Badge variant="outline" className="font-bold px-2 py-0.5">{status}</Badge>;
    }
  };

  const getPaymentBadge = (status: PaymentStatus) => {
    switch (status) {
      case "PAID": return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold px-2 py-0.5">Paid</Badge>;
      case "PENDING": return <Badge variant="outline" className="bg-zinc-100 text-zinc-600 border-zinc-200/50 font-bold px-2 py-0.5">Pending</Badge>;
      case "PAY_AT_COUNTER": return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold px-2 py-0.5">Pay at Counter</Badge>;
      case "FAILED": return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 font-bold px-2 py-0.5">Failed</Badge>;
      default: return <Badge variant="outline" className="font-bold px-2 py-0.5">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case "DINE_IN": return <MapPin className="w-4 h-4 text-zinc-500 mr-1.5" />;
      case "TAKEAWAY": return <ShoppingBag className="w-4 h-4 text-zinc-500 mr-1.5" />;
      default: return null;
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-zinc-200/50">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-950">Orders</h2>
          <p className="text-sm font-medium text-zinc-500 mt-1.5">View and manage all restaurant orders.</p>
        </div>
      </div>

      {/* Desktop view: Table */}
      <div className="rounded-2xl border border-zinc-100 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-zinc-50/80 border-b border-zinc-100">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-bold text-zinc-500 uppercase tracking-widest text-[11px] h-12">Token</TableHead>
                <TableHead className="font-bold text-zinc-500 uppercase tracking-widest text-[11px] h-12">Customer</TableHead>
                <TableHead className="font-bold text-zinc-500 uppercase tracking-widest text-[11px] h-12">Type</TableHead>
                <TableHead className="font-bold text-zinc-500 uppercase tracking-widest text-[11px] h-12">Total</TableHead>
                <TableHead className="font-bold text-zinc-500 uppercase tracking-widest text-[11px] h-12">Payment</TableHead>
                <TableHead className="font-bold text-zinc-500 uppercase tracking-widest text-[11px] h-12">Status</TableHead>
                <TableHead className="font-bold text-zinc-500 uppercase tracking-widest text-[11px] h-12">Time</TableHead>
                <TableHead className="text-right font-bold text-zinc-500 uppercase tracking-widest text-[11px] h-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-zinc-100">
              {initialOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center h-40 text-zinc-400 font-medium">
                    No orders found.
                  </TableCell>
                </TableRow>
              ) : (
                initialOrders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-zinc-50/50 transition-colors group border-none">
                    <TableCell className="py-4">
                      <span className="font-bold text-zinc-950 bg-zinc-100 px-2 py-1 rounded-md text-sm">
                        #{order.token?.tokenNumber || "—"}
                      </span>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="font-bold text-zinc-950">{order.customer?.name || "Guest"}</div>
                      {order.table && <div className="text-xs font-medium text-amber-600 mt-0.5">Table {order.table.number}</div>}
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center text-sm font-semibold text-zinc-700">
                        {getTypeIcon(order.type)}
                        {order.type.replace("_", " ")}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 font-bold text-zinc-950">₹{Number(order.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="py-4">{getPaymentBadge(order.payment?.status)}</TableCell>
                    <TableCell className="py-4">{getStatusBadge(order.status)}</TableCell>
                    <TableCell className="py-4 text-xs font-medium text-zinc-500">
                      {format(new Date(order.createdAt), "h:mm a")}
                    </TableCell>
                    <TableCell className="py-4 text-right">
                      <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setSelectedOrder(order)}
                          className="text-zinc-600 hover:text-amber-600 hover:bg-amber-50 font-semibold h-8 px-3 rounded-lg"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1.5" /> View
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Sheet open={!!selectedOrder} onOpenChange={(open: boolean) => !open && setSelectedOrder(null)}>
        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto border-l-0 shadow-2xl sm:rounded-l-2xl">
          <SheetHeader className="mb-8 border-b border-zinc-100 pb-6">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-2xl font-bold flex items-center">
                Order <span className="ml-2 text-amber-500">#{selectedOrder?.token?.tokenNumber}</span>
              </SheetTitle>
              {selectedOrder && getStatusBadge(selectedOrder.status)}
            </div>
            <SheetDescription className="font-medium text-zinc-500 mt-1">
              {selectedOrder && format(new Date(selectedOrder.createdAt), "MMMM d, yyyy 'at' h:mm a")}
            </SheetDescription>
          </SheetHeader>
          
          {selectedOrder && (
            <div className="space-y-8">
              {/* Order Info Grid */}
              <div className="bg-zinc-50/50 border border-zinc-100 rounded-xl p-5">
                <div className="grid grid-cols-2 gap-y-6 gap-x-4 text-sm">
                  <div>
                    <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">Order ID</div>
                    <div className="font-mono text-xs text-zinc-900 bg-white border border-zinc-200 px-2 py-1 rounded truncate">{selectedOrder.id}</div>
                  </div>
                  <div>
                    <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">Type</div>
                    <div className="font-semibold text-zinc-950 flex items-center">
                      {getTypeIcon(selectedOrder.type)}
                      {selectedOrder.type.replace("_", " ")} 
                      {selectedOrder.table && <span className="ml-1 text-amber-600">- T{selectedOrder.table.number}</span>}
                    </div>
                  </div>
                  <div>
                    <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">Customer</div>
                    <div className="font-semibold text-zinc-950 flex items-center">
                      <User className="w-3.5 h-3.5 mr-1.5 text-zinc-400" />
                      {selectedOrder.customer?.name || "Guest"}
                    </div>
                  </div>
                  <div>
                    <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">Mobile</div>
                    <div className="font-semibold text-zinc-950 flex items-center">
                      <Phone className="w-3.5 h-3.5 mr-1.5 text-zinc-400" />
                      {selectedOrder.customer?.phone || "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">Payment Method</div>
                    <div className="font-semibold text-zinc-950 flex items-center">
                      <CreditCard className="w-3.5 h-3.5 mr-1.5 text-zinc-400" />
                      {selectedOrder.payment?.method || "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">Payment Status</div>
                    <div className="mt-0.5">{getPaymentBadge(selectedOrder.payment?.status)}</div>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div>
                <h3 className="font-bold text-lg mb-4 flex items-center text-zinc-950">
                  <Receipt className="w-5 h-5 mr-2 text-zinc-400" />
                  Order Items
                </h3>
                <div className="space-y-4 bg-white border border-zinc-100 rounded-xl p-5">
                  {selectedOrder.items.map((item: any, index: number) => (
                    <div key={item.id} className={`flex justify-between text-sm ${index !== 0 ? 'pt-4 border-t border-zinc-100' : ''}`}>
                      <div className="flex-1 pr-4">
                        <div className="font-semibold text-zinc-950 flex items-start">
                          <span className="inline-flex items-center justify-center bg-zinc-100 text-zinc-700 w-6 h-6 rounded-md mr-3 text-xs">
                            {item.quantity}
                          </span>
                          <span className="mt-0.5">{item.product.name}</span>
                        </div>
                        {item.options?.length > 0 && (
                          <div className="pl-9 mt-1.5 space-y-1">
                            {item.options.map((opt: any) => (
                              <div key={opt.id} className="text-xs font-medium text-zinc-500 flex justify-between">
                                <span>+ {opt.option.name}</span>
                                <span>₹{Number(opt.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {item.notes && (
                          <div className="pl-9 mt-2">
                            <div className="bg-amber-50/50 border border-amber-100 rounded-md p-2 text-xs italic text-amber-800 font-medium">
                              "{item.notes}"
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="font-bold text-zinc-950 mt-0.5">
                        ₹{(Number(item.price) * item.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Summary */}
              <div className="bg-zinc-950 text-white rounded-xl p-5 shadow-sm">
                <div className="space-y-3">
                  {selectedOrder.discountAmount && Number(selectedOrder.discountAmount) > 0 && (
                    <div className="flex justify-between text-sm font-medium border-b border-zinc-800 pb-3">
                      <span className="text-zinc-400">Discount</span>
                      <span className="text-emerald-400">-₹{Number(selectedOrder.discountAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-1">
                    <span className="font-bold text-lg text-zinc-300">Total Amount</span>
                    <span className="font-bold text-2xl tracking-tight flex items-center">
                      <ReceiptIndianRupee className="w-5 h-5 mr-1 opacity-80" />
                      {Number(selectedOrder.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <Button className="w-full h-12 text-base font-semibold rounded-xl bg-zinc-100 text-zinc-900 hover:bg-zinc-200 border-none shadow-sm" variant="outline" onClick={() => setSelectedOrder(null)}>Close Details</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
