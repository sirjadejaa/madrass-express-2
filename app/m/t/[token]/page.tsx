import { resolveTableByToken } from "@/lib/tables/table-service";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AlertCircle, QrCode } from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  params: {
    token: string;
  };
}

export default async function TableQRWelcomePage({ params }: PageProps) {
  const result = await resolveTableByToken(params.token);

  if (!result.valid || !result.table || !result.restaurant) {
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
            {result.error || "This table QR code is inactive or has been rotated."}
          </p>
        </div>
        <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs text-zinc-500 max-w-xs">
          <p className="font-semibold text-zinc-700 mb-1 flex items-center justify-center gap-1.5">
            <QrCode className="w-4 h-4 text-amber-600" /> Need Help?
          </p>
          Please re-scan the QR code placed on your table, or ask any member of our service team for assistance.
        </div>
      </div>
    );
  }

  // Set secure table session cookie for server validation during checkout
  const cookieStore = cookies();
  const sessionData = JSON.stringify({
    tableId: result.table.id,
    tableName: result.table.number,
    restaurantId: result.restaurant.id,
    qrToken: params.token,
  });

  cookieStore.set("madrass_table_session", sessionData, {
    path: "/",
    httpOnly: false, // Accessible to client store verification
    sameSite: "lax",
    maxAge: 60 * 60 * 6, // 6 hours
  });

  // Take customer directly to the menu homepage with locked table session
  redirect("/kiosk/menu");
}
