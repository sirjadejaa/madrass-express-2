import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function MobileMenuPage() {
  // Direct landing page for QR and menu ordering is the unified /kiosk/menu
  redirect("/kiosk/menu");
}
