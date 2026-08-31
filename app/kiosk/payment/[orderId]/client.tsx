"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PaymentStatus } from "@prisma/client";
import { QRCodeSVG } from "qrcode.react";
import { Loader2, Smartphone, Banknote, CheckCircle2, AlertCircle } from "lucide-react";
import { updatePaymentToCounterAction, mockWebhookAction } from "./actions";
import { useToast } from "@/components/ui/use-toast";
import { useKioskStore } from "@/lib/store/kiosk-store";

interface PaymentClientProps {
  orderId: string;
  amount: number;
}

type PaymentScreenState = "SELECT" | "UPI_QR" | "PROCESSING";

export function PaymentClient({ orderId, amount }: PaymentClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const clearCart = useKioskStore(state => state.clearCart);

  const [screenState, setScreenState] = useState<PaymentScreenState>("SELECT");
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  
  // Polling logic for UPI
  useEffect(() => {
    if (screenState !== "UPI_QR") return;

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/payment/status?orderId=${orderId}`);
        const data = await res.json();
        
        if (data.status === PaymentStatus.PAID) {
          clearCart();
          router.replace(`/kiosk/success/${orderId}`);
        } else if (data.status === PaymentStatus.FAILED) {
          setQrError("Payment failed. Please try again or pay at the counter.");
          setScreenState("SELECT");
        }
      } catch (err) {
        console.error("Failed to check status", err);
      }
    };

    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, [screenState, orderId, router, clearCart]);

  const handlePayAtCounter = async () => {
    setScreenState("PROCESSING");
    const result = await updatePaymentToCounterAction(orderId);
    if (result.success) {
      clearCart();
      router.replace(`/kiosk/success/${orderId}`);
    } else {
      toast({ title: "Error", description: result.error || "Failed to update payment.", variant: "destructive" });
      setScreenState("SELECT");
    }
  };

  const handleUPI = async () => {
    setScreenState("PROCESSING");
    try {
      const res = await fetch('/api/payment/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, amount })
      });
      const data = await res.json();
      
      if (data.success && data.qrCodeData) {
        setQrCodeData(data.qrCodeData);
        setScreenState("UPI_QR");
      } else {
        throw new Error(data.error || "Failed to generate QR code");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      setScreenState("SELECT");
    }
  };

  const handleMockWebhook = async () => {
    await mockWebhookAction(orderId);
    toast({ title: "Mock Webhook Fired", description: "Payment should update shortly." });
  };

  return (
    <div className="h-full flex items-center justify-center p-6">
      <div className="bg-background rounded-3xl p-10 max-w-2xl w-full text-center shadow-xl">
        
        {screenState === "PROCESSING" && (
          <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in-95">
            <Loader2 className="h-16 w-16 animate-spin text-primary mb-6" />
            <h2 className="text-2xl font-bold">Setting up secure payment...</h2>
            <p className="text-muted-foreground mt-2">Please wait a moment.</p>
          </div>
        )}

        {screenState === "SELECT" && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-4xl font-black mb-4">Choose Payment Method</h2>
            <p className="text-muted-foreground text-lg mb-12">Select how you would like to pay for your order.</p>

            {qrError && (
              <div className="bg-destructive/10 text-destructive p-4 rounded-xl mb-8 flex items-center justify-center gap-2">
                <AlertCircle className="w-5 h-5" /> {qrError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div 
                className="border-2 border-border hover:border-primary hover:bg-primary/5 p-8 rounded-2xl cursor-pointer transition-all flex flex-col items-center gap-4 group"
                onClick={handleUPI}
              >
                <div className="bg-primary/10 p-4 rounded-full group-hover:scale-110 transition-transform">
                  <Smartphone className="w-12 h-12 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">UPI QR Code</h3>
                <p className="text-muted-foreground text-sm">GPay, PhonePe, Paytm</p>
              </div>

              <div 
                className="border-2 border-border hover:border-primary hover:bg-primary/5 p-8 rounded-2xl cursor-pointer transition-all flex flex-col items-center gap-4 group"
                onClick={handlePayAtCounter}
              >
                <div className="bg-primary/10 p-4 rounded-full group-hover:scale-110 transition-transform">
                  <Banknote className="w-12 h-12 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">Pay at Counter</h3>
                <p className="text-muted-foreground text-sm">Cash or Card</p>
              </div>
            </div>
          </div>
        )}

        {screenState === "UPI_QR" && qrCodeData && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-3xl font-black mb-2">Scan to Pay</h2>
            <p className="text-muted-foreground mb-8 text-lg">Use any UPI app to scan and pay ₹{amount.toFixed(2)}</p>
            
            <div className="bg-white p-6 rounded-2xl inline-block shadow-lg border">
              <QRCodeSVG value={qrCodeData} size={280} level="H" />
            </div>

            <div className="mt-8 flex items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Awaiting payment confirmation...</span>
            </div>

            <div className="mt-12 flex justify-center gap-4">
              <Button variant="outline" size="lg" onClick={() => setScreenState("SELECT")}>
                Cancel
              </Button>
              <Button size="lg" onClick={handlePayAtCounter}>
                Pay at Counter Instead
              </Button>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <div className="mt-12 p-4 bg-red-50 rounded-xl border border-red-200">
                <p className="text-xs text-red-500 font-bold mb-2 uppercase">Developer Tools (Hidden in Prod)</p>
                <Button size="sm" variant="destructive" onClick={handleMockWebhook}>
                  Simulate Successful Webhook
                </Button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
