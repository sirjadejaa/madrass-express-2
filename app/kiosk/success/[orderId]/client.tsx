"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PaymentStatus } from "@prisma/client";
import { CheckCircle2, Ticket, ArrowRight, Printer } from "lucide-react";
import { useKioskStore } from "@/lib/store/kiosk-store";
import { PrinterConfig } from "@/lib/printer/provider";
import { browserPrinter } from "@/lib/printer/browser-provider";

interface SuccessClientProps {
  orderId: string;
  tokenNumber: number;
  paymentStatus: string;
  orderType: string;
  printerConfig?: PrinterConfig;
}

export function SuccessClient({ orderId, tokenNumber, paymentStatus, orderType, printerConfig }: SuccessClientProps) {
  const router = useRouter();
  const resetKiosk = useKioskStore(state => state.resetKiosk);
  const hasPrinted = useRef(false);

  useEffect(() => {
    // Auto-print logic
    if (printerConfig?.autoPrint && !hasPrinted.current) {
      hasPrinted.current = true;
      browserPrinter.printReceipt({ orderId }, printerConfig);
    }
  }, [printerConfig, orderId]);

  useEffect(() => {
    // Auto redirect back to welcome screen after 15 seconds
    const timer = setTimeout(() => {
      resetKiosk();
      router.push("/kiosk");
    }, 15000);

    return () => clearTimeout(timer);
  }, [router, resetKiosk]);

  const handleFinish = () => {
    resetKiosk();
    router.push("/kiosk");
  };

  const handleManualPrint = () => {
    // Default to an 80mm generic config if none configured
    const config = printerConfig || { name: "Default", type: "RECEIPT", paperWidth: 80, autoPrint: false };
    browserPrinter.printReceipt({ orderId }, config);
  };

  return (
    <div className="h-full flex items-center justify-center p-6">
      <div className="bg-background rounded-3xl p-10 max-w-2xl w-full text-center shadow-xl border-t-8 border-t-primary animate-in zoom-in-95 duration-500">
        
        <div className="flex justify-center mb-6">
          <div className="bg-primary/20 p-6 rounded-full">
            <CheckCircle2 className="w-20 h-20 text-primary" />
          </div>
        </div>

        <h2 className="text-4xl font-black mb-2">Order Confirmed!</h2>
        
        {paymentStatus === PaymentStatus.PAY_AT_COUNTER ? (
          <p className="text-xl text-muted-foreground mb-10">
            Please proceed to the counter to pay and complete your order.
          </p>
        ) : (
          <p className="text-xl text-muted-foreground mb-10">
            Payment successful. We are preparing your order.
          </p>
        )}

        <div className="bg-muted/30 border-2 border-dashed border-border rounded-2xl p-8 mb-10 max-w-sm mx-auto">
          <div className="flex items-center justify-center gap-3 text-muted-foreground mb-2">
            <Ticket className="w-6 h-6" />
            <span className="text-lg font-bold uppercase tracking-wider">Your Token Number</span>
          </div>
          <div className="text-8xl font-black text-foreground drop-shadow-sm">
            {tokenNumber}
          </div>
          <div className="mt-4 text-sm font-bold text-muted-foreground uppercase tracking-widest">
            {orderType.replace('_', ' ')}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button variant="outline" size="lg" className="h-16 text-xl rounded-2xl px-8 gap-2" onClick={handleManualPrint}>
            <Printer className="w-5 h-5" /> Print Receipt
          </Button>
          <Button size="lg" className="h-16 text-xl rounded-2xl px-12 gap-2 shadow-md" onClick={handleFinish}>
            Finish <ArrowRight className="w-5 h-5" />
          </Button>
        </div>

      </div>
    </div>
  );
}
