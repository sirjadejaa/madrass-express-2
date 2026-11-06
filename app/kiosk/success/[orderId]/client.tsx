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
  source?: string;
  trackingToken?: string | null;
  printerConfig?: PrinterConfig;
}

export function SuccessClient({ 
  orderId, 
  tokenNumber, 
  paymentStatus, 
  orderType, 
  source,
  trackingToken,
  printerConfig 
}: SuccessClientProps) {
  const router = useRouter();
  const resetKiosk = useKioskStore(state => state.resetKiosk);
  const isQRSession = useKioskStore(state => state.isQRSession);
  const isMobileQR = source === "QR_MOBILE" || isQRSession;
  const hasPrinted = useRef(false);

  useEffect(() => {
    // Auto-print logic
    if (printerConfig?.autoPrint && !hasPrinted.current) {
      hasPrinted.current = true;
      browserPrinter.printReceipt({ orderId }, printerConfig);
    }
  }, [printerConfig, orderId]);

  useEffect(() => {
    // Auto redirect logic:
    // Only auto-redirect to kiosk screen for physical kiosk; on mobile stay or redirect to menu
    if (isMobileQR) {
      return; // Do not boot mobile customers off their success screen
    }

    const timer = setTimeout(() => {
      resetKiosk();
      router.replace("/kiosk");
    }, 15000);

    return () => clearTimeout(timer);
  }, [router, resetKiosk, isMobileQR]);

  const handleFinish = () => {
    resetKiosk();
    if (isMobileQR) {
      router.replace("/kiosk/menu");
    } else {
      router.replace("/kiosk");
    }
  };

  const handleManualPrint = () => {
    // Default to an 80mm generic config if none configured
    const config = printerConfig || { name: "Default", type: "RECEIPT", paperWidth: 80, autoPrint: false };
    browserPrinter.printReceipt({ orderId }, config);
  };

  return (
    <div className="h-full flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-background rounded-3xl p-6 sm:p-10 max-w-2xl w-full text-center shadow-xl border-t-8 border-t-primary animate-in zoom-in-95 duration-500 my-auto">
        
        <div className="flex justify-center mb-6">
          <div className="bg-primary/20 p-5 sm:p-6 rounded-full">
            <CheckCircle2 className="w-16 h-16 sm:w-20 sm:h-20 text-primary" />
          </div>
        </div>

        <h2 className="text-3xl sm:text-4xl font-black mb-2">Order Confirmed!</h2>
        
        {paymentStatus === PaymentStatus.PAY_AT_COUNTER ? (
          <p className="text-base sm:text-xl text-muted-foreground mb-8">
            Please proceed to the counter to pay and complete your order.
          </p>
        ) : (
          <p className="text-base sm:text-xl text-muted-foreground mb-8">
            Payment successful. We are preparing your order.
          </p>
        )}

        <div className="bg-muted/30 border-2 border-dashed border-border rounded-2xl p-6 sm:p-8 mb-8 max-w-sm mx-auto">
          <div className="flex items-center justify-center gap-3 text-muted-foreground mb-2">
            <Ticket className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-sm sm:text-lg font-bold uppercase tracking-wider">Your Token Number</span>
          </div>
          <div className="text-6xl sm:text-8xl font-black text-foreground drop-shadow-sm">
            {tokenNumber}
          </div>
          <div className="mt-4 text-xs sm:text-sm font-bold text-muted-foreground uppercase tracking-widest">
            {orderType.replace('_', ' ')}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          {trackingToken && (
            <Button 
              variant="outline" 
              size="lg" 
              className="w-full sm:w-auto h-14 sm:h-16 text-lg sm:text-xl rounded-2xl px-6 gap-2 border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30"
              onClick={() => router.push(`/m/order/${trackingToken}`)}
            >
              Track Order Live
            </Button>
          )}

          {!isMobileQR && (
            <Button variant="outline" size="lg" className="w-full sm:w-auto h-14 sm:h-16 text-lg sm:text-xl rounded-2xl px-6 gap-2" onClick={handleManualPrint}>
              <Printer className="w-5 h-5" /> Print Receipt
            </Button>
          )}

          <Button size="lg" className="w-full sm:w-auto h-14 sm:h-16 text-lg sm:text-xl rounded-2xl px-8 sm:px-10 gap-2 shadow-md" onClick={handleFinish}>
            {isMobileQR ? "Order More Items" : "Finish"} <ArrowRight className="w-5 h-5" />
          </Button>
        </div>

      </div>
    </div>
  );
}
