"use client";

import { useState } from "react";
import { format } from "date-fns";
import { PaymentStatus, PaymentMethod } from "@prisma/client";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { markOrderPaidAtCounter } from "../orders/actions";

export function PaymentsClient({ initialPayments }: { initialPayments: any[] }) {
  const { toast } = useToast();
  const [payments, setPayments] = useState(initialPayments);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const getPaymentBadge = (status: PaymentStatus) => {
    switch (status) {
      case "PAID": return <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white">Paid</Badge>;
      case "PENDING": return <Badge variant="secondary">Pending</Badge>;
      case "PAY_AT_COUNTER": return <Badge variant="default" className="bg-amber-500 hover:bg-amber-600 text-white">Pay at Counter</Badge>;
      case "FAILED": return <Badge variant="destructive">Failed</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleMarkPaid = async (orderId: string, paymentId: string) => {
    setProcessingId(paymentId);
    try {
      const res = await markOrderPaidAtCounter(orderId);
      if (res.error) {
        toast({ title: "Error", description: res.error, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Payment marked as paid." });
        setPayments(payments.map(p => p.id === paymentId ? { ...p, status: "PAID" } : p));
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setProcessingId(null);
    }
  };

  const totalPayments = payments.length;
  const paidCount = payments.filter(p => p.status === "PAID").length;
  const payAtCounterCount = payments.filter(p => p.status === "PAY_AT_COUNTER").length;
  const totalRevenue = payments.reduce((acc, p) => p.status === "PAID" ? acc + Number(p.amount) : acc, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Payments</h2>
        <p className="text-muted-foreground">Manage and track all transactions.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{paidCount} successful payments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending at Counter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{payAtCounterCount}</div>
            <p className="text-xs text-muted-foreground">Requires manual confirmation</p>
          </CardContent>
        </Card>
      </div>

      <div className="border rounded-md bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Payment ID</TableHead>
              <TableHead>Token / Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center h-32 text-muted-foreground">
                  No payments yet
                </TableCell>
              </TableRow>
            ) : (
              payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-mono text-xs">{payment.id}</TableCell>
                  <TableCell>
                    <div className="font-bold">#{payment.order?.token?.tokenNumber || "—"}</div>
                    <div className="text-xs text-muted-foreground">{payment.orderId}</div>
                  </TableCell>
                  <TableCell>{payment.order?.customer?.name || "Guest"}</TableCell>
                  <TableCell className="font-medium">₹{Number(payment.amount).toFixed(2)}</TableCell>
                  <TableCell>{payment.method}</TableCell>
                  <TableCell>{getPaymentBadge(payment.status)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(payment.createdAt), "PP p")}
                  </TableCell>
                  <TableCell className="text-right">
                    {payment.status === "PAY_AT_COUNTER" && (
                      <Button 
                        size="sm" 
                        onClick={() => handleMarkPaid(payment.orderId, payment.id)}
                        disabled={processingId === payment.id}
                      >
                        {processingId === payment.id && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                        Mark Paid
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
