import { getOrderTrackingStatus } from "./actions";
import { OrderTrackingClient } from "./client";
import { AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface PageProps {
  params: {
    trackingToken: string;
  };
}

export default async function OrderTrackingPage({ params }: PageProps) {
  const result = await getOrderTrackingStatus(params.trackingToken);

  if (!result.success || !result.order) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[70vh] space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-black text-zinc-900 tracking-tight">
            Order Not Found
          </h2>
          <p className="text-xs text-zinc-500 max-w-xs mx-auto">
            We couldn't locate this order tracking token. Please verify the URL or ask our restaurant team for assistance.
          </p>
        </div>
        <Link
          href="/kiosk/menu"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-500/10 px-4 py-2.5 rounded-xl hover:bg-amber-500/20 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Go to Restaurant Menu
        </Link>
      </div>
    );
  }

  return (
    <OrderTrackingClient
      initialOrder={result.order}
      trackingToken={params.trackingToken}
    />
  );
}
