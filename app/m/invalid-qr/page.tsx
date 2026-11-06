import { AlertCircle, QrCode } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface InvalidQRPageProps {
  searchParams?: {
    error?: string;
  };
}

export default function InvalidQRPage({ searchParams }: InvalidQRPageProps) {
  const errorMessage =
    searchParams?.error || "This table QR code is inactive or has been rotated.";

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[80vh] space-y-5">
      <div className="w-16 h-16 rounded-3xl bg-red-50 text-red-600 flex items-center justify-center shadow-inner">
        <AlertCircle className="w-8 h-8" />
      </div>
      <div className="space-y-2 max-w-xs">
        <h2 className="text-2xl font-black text-zinc-950 tracking-tight">
          Invalid or Expired QR Code
        </h2>
        <p className="text-sm font-medium text-zinc-600 leading-relaxed">
          {errorMessage}
        </p>
      </div>
      <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs text-zinc-500 max-w-xs">
        <p className="font-semibold text-zinc-700 mb-1 flex items-center justify-center gap-1.5">
          <QrCode className="w-4 h-4 text-amber-600" /> Need Help?
        </p>
        Please re-scan the QR code placed on your table, or ask any member of our service team for assistance.
      </div>
      <Link
        href="/kiosk/menu"
        className="inline-flex items-center justify-center rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-amber-700"
      >
        View General Menu
      </Link>
    </div>
  );
}
