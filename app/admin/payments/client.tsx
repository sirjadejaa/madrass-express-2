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
import { useToast } from "@/components/ui/use-toast";
import { Loader2, ReceiptIndianRupee, Clock, CreditCard, Banknote, AlertCircle, CheckCircle2 } from "lucide-react";
import { markOrderPaidAtCounter } from "../orders/actions";

export function PaymentsClient({ initialPayments }: { initialPayments: any[] }) {
  const { toast } = useToast();
  const [payments, setPayments] = useState(initialPayments);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const getPaymentBadge = (status: PaymentStatus) => {
    switch (status) {
      case "PAID": return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold px-2 py-0.5"><CheckCircle2 className="w-3 h-3 mr-1" /> Paid</Badge>;
      case "PENDING": return <Badge variant="outline" className="bg-zinc-100 text-zinc-600 border-zinc-200/50 font-bold px-2 py-0.5"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case "PAY_AT_COUNTER": return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold px-2 py-0.5"><Banknote className="w-3 h-3 mr-1" /> Pay at Counter</Badge>;
      case "FAILED": return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 font-bold px-2 py-0.5"><AlertCircle className="w-3 h-3 mr-1" /> Failed</Badge>;
      default: return <Badge variant="outline" className="font-bold px-2 py-0.5">{status}</Badge>;
    }
  };

  const getMethodIcon = (method: string) => {
    switch(method) {
      case "CASH": return <Banknote className="w-4 h-4 text-zinc-500 mr-1.5" />;
      case "CARD": return <CreditCard className="w-4 h-4 text-zinc-500 mr-1.5" />;
      case "UPI": return <ReceiptIndianRupee className="w-4 h-4 text-zinc-500 mr-1.5" />;
      default: return <CreditCard className="w-4 h-4 text-zinc-500 mr-1.5" />;
    }
  }

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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-zinc-200/50">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-950">Payments</h2>
          <p className="text-sm font-medium text-zinc-500 mt-1.5">Manage and track all transactions.</p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-2xl border border-zinc-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Total Paid Revenue</h3>
            <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <ReceiptIndianRupee className="h-5 w-5" />
            </div>
          </div>
          <div className="text-3xl font-bold tracking-tight text-zinc-950">₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          <p className="text-sm font-medium text-zinc-500 mt-1">{paidCount} successful payments</p>
        </div>
        
        <div className="bg-white rounded-2xl border border-zinc-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Pending at Counter</h3>
            <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="text-3xl font-bold tracking-tight text-amber-600">{payAtCounterCount}</div>
          <p className="text-sm font-medium text-zinc-500 mt-1">Requires manual confirmation</p>
        </div>
      </div>

      {/* Mobile view: Cards */}
      <div className="grid gap-4 md:hidden">
        {payments.map((payment) => (
          <div key={payment.id} className="bg-white rounded-xl border border-zinc-100 p-5 shadow-sm flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg text-zinc-950 flex items-center">
                  #{payment.order?.token?.tokenNumber || "—"}
                </h3>
                <p className="text-sm font-medium text-zinc-500 mt-0.5">{payment.order?.customer?.name || "Guest"}</p>
                <div className="text-[10px] text-zinc-400 font-mono mt-2 bg-zinc-50 px-1.5 py-0.5 rounded border border-zinc-100 inline-block">
                  ID: {payment.id}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="font-bold text-lg text-zinc-950">₹{Number(payment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                {getPaymentBadge(payment.status)}
              </div>
            </div>
            
            <div className="flex justify-between items-center pt-4 border-t border-zinc-100 text-sm">
              <div className="text-zinc-500 font-medium flex items-center flex-wrap gap-2">
                <span className="flex items-center bg-zinc-50 px-2 py-1 rounded-md border border-zinc-100">
                  {getMethodIcon(payment.method)}
                  {payment.method}
                </span>
                <span>{format(new Date(payment.createdAt), "MMM d, h:mm a")}</span>
              </div>
              {payment.status === "PAY_AT_COUNTER" && (
                <Button 
                  size="sm" 
                  onClick={() => handleMarkPaid(payment.orderId, payment.id)}
                  disabled={processingId === payment.id}
                  className="min-h-[40px] bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg ml-2"
                >
                  {processingId === payment.id ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="mr-2 h-3.5 w-3.5" />}
                  Mark Paid
                </Button>
              )}
            </div>
          </div>
        ))}
        {payments.length === 0 && (
          <div className="text-center py-16 text-zinc-400 bg-white rounded-2xl border border-zinc-100 shadow-sm">
            <p className="font-medium text-sm">No payments yet.</p>
          </div>
        )}
      </div>

      {/* Desktop view: Table */}
      <div className="hidden md:block rounded-2xl border border-zinc-100 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-zinc-50/80 border-b border-zinc-100">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-bold text-zinc-500 uppercase tracking-widest text-[11px] h-12 w-[100px]">Payment ID</TableHead>
                <TableHead className="font-bold text-zinc-500 uppercase tracking-widest text-[11px] h-12">Token / Order</TableHead>
                <TableHead className="font-bold text-zinc-500 uppercase tracking-widest text-[11px] h-12">Customer</TableHead>
                <TableHead className="font-bold text-zinc-500 uppercase tracking-widest text-[11px] h-12">Amount</TableHead>
                <TableHead className="font-bold text-zinc-500 uppercase tracking-widest text-[11px] h-12">Method</TableHead>
                <TableHead className="font-bold text-zinc-500 uppercase tracking-widest text-[11px] h-12">Status</TableHead>
                <TableHead className="font-bold text-zinc-500 uppercase tracking-widest text-[11px] h-12">Date</TableHead>
                <TableHead className="text-right font-bold text-zinc-500 uppercase tracking-widest text-[11px] h-12">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-zinc-100">
              {payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center h-40 text-zinc-400 font-medium">
                    No payments yet.
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => (
                  <TableRow key={payment.id} className="hover:bg-zinc-50/50 transition-colors group border-none">
                    <TableCell className="py-4 font-mono text-[10px] text-zinc-400">
                      <span className="bg-zinc-50 px-1.5 py-0.5 rounded border border-zinc-100 truncate block max-w-[80px]" title={payment.id}>
                        {payment.id.substring(0, 8)}...
                      </span>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="font-bold text-zinc-950 flex items-center">
                        <span className="bg-zinc-100 px-2 py-0.5 rounded-md text-sm mr-2">
                          #{payment.order?.token?.tokenNumber || "—"}
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-400 font-mono mt-1 px-1" title={payment.orderId}>{payment.orderId.substring(0, 8)}...</div>
                    </TableCell>
                    <TableCell className="py-4 font-medium text-zinc-950">{payment.order?.customer?.name || "Guest"}</TableCell>
                    <TableCell className="py-4 font-bold text-zinc-950">₹{Number(payment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center text-sm font-semibold text-zinc-700">
                        {getMethodIcon(payment.method)}
                        {payment.method}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">{getPaymentBadge(payment.status)}</TableCell>
                    <TableCell className="py-4 text-xs font-medium text-zinc-500">
                      {format(new Date(payment.createdAt), "MMM d, yyyy h:mm a")}
                    </TableCell>
                    <TableCell className="py-4 text-right">
                      {payment.status === "PAY_AT_COUNTER" ? (
                        <Button 
                          size="sm" 
                          onClick={() => handleMarkPaid(payment.orderId, payment.id)}
                          disabled={processingId === payment.id}
                          className="bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg shadow-sm"
                        >
                          {processingId === payment.id ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />}
                          Mark Paid
                        </Button>
                      ) : (
                        <div className="w-24"></div> // Placeholder to keep column width stable
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
