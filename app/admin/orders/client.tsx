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

export function OrdersClient({ initialOrders }: { initialOrders: any[] }) {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "NEW": return <Badge variant="default">New</Badge>;
      case "ACCEPTED": return <Badge variant="secondary">Accepted</Badge>;
      case "PREPARING": return <Badge variant="default" className="bg-amber-500 hover:bg-amber-600 text-white">Preparing</Badge>;
      case "READY": return <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white">Ready</Badge>;
      case "COMPLETED": return <Badge variant="outline">Completed</Badge>;
      case "CANCELLED": return <Badge variant="destructive">Cancelled</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentBadge = (status: PaymentStatus) => {
    switch (status) {
      case "PAID": return <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white">Paid</Badge>;
      case "PENDING": return <Badge variant="secondary">Pending</Badge>;
      case "PAY_AT_COUNTER": return <Badge variant="default" className="bg-amber-500 hover:bg-amber-600 text-white">Pay at Counter</Badge>;
      case "FAILED": return <Badge variant="destructive">Failed</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Orders</h2>
        <p className="text-muted-foreground">Manage your restaurant orders.</p>
      </div>

      <div className="border rounded-md bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Token</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Time</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center h-32 text-muted-foreground">
                  No orders yet
                </TableCell>
              </TableRow>
            ) : (
              initialOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-bold">
                    #{order.token?.tokenNumber || "—"}
                  </TableCell>
                  <TableCell>
                    {order.customer?.name || "Guest"}
                    {order.table && <div className="text-xs text-muted-foreground">Table {order.table.number}</div>}
                  </TableCell>
                  <TableCell>{order.type.replace("_", " ")}</TableCell>
                  <TableCell>₹{Number(order.totalAmount).toFixed(2)}</TableCell>
                  <TableCell>{getPaymentBadge(order.payment?.status)}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(order.createdAt), "h:mm a")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={!!selectedOrder} onOpenChange={(open: boolean) => !open && setSelectedOrder(null)}>
        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>Order #{selectedOrder?.token?.tokenNumber}</SheetTitle>
            <SheetDescription>
              {selectedOrder && format(new Date(selectedOrder.createdAt), "PPP p")}
            </SheetDescription>
          </SheetHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Order ID</div>
                  <div className="font-mono text-xs">{selectedOrder.id}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Type</div>
                  <div className="font-medium">{selectedOrder.type.replace("_", " ")} {selectedOrder.table && `- Table ${selectedOrder.table.number}`}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Customer</div>
                  <div className="font-medium">{selectedOrder.customer?.name || "Guest"}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Mobile</div>
                  <div className="font-medium">{selectedOrder.customer?.phone || "—"}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Payment Method</div>
                  <div className="font-medium">{selectedOrder.payment?.method || "—"}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Payment Status</div>
                  <div className="mt-1">{getPaymentBadge(selectedOrder.payment?.status)}</div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3 border-b pb-2">Items</h3>
                <div className="space-y-3">
                  {selectedOrder.items.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <div>
                        <span className="font-medium">{item.quantity}x</span> {item.product.name}
                        {item.options?.length > 0 && (
                          <ul className="text-xs text-muted-foreground ml-4 mt-1 list-disc">
                            {item.options.map((opt: any) => (
                              <li key={opt.id}>{opt.option.name} (₹{Number(opt.price).toFixed(2)})</li>
                            ))}
                          </ul>
                        )}
                        {item.notes && <div className="text-xs italic text-muted-foreground mt-1">Note: {item.notes}</div>}
                      </div>
                      <div className="font-medium">₹{(Number(item.price) * item.quantity).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                {selectedOrder.discountAmount && Number(selectedOrder.discountAmount) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="text-green-600">-₹{Number(selectedOrder.discountAmount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>₹{Number(selectedOrder.totalAmount).toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-4 flex gap-2">
                <Button className="flex-1" variant="outline" onClick={() => setSelectedOrder(null)}>Close</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
