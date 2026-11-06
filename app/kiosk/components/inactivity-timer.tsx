"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useKioskStore } from "@/lib/store/kiosk-store";

export function InactivityTimer({ timeoutMs = 120000 }: { timeoutMs?: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const resetKiosk = useKioskStore((state) => state.resetKiosk);
  const isQRSession = useKioskStore((state) => state.isQRSession);
  const tableId = useKioskStore((state) => state.tableId);

  useEffect(() => {
    // Never run inactivity reset on mobile QR ordering sessions or when table is active
    if (isQRSession || tableId) return;

    // Don't run timer if we are already on the welcome screen
    if (pathname === "/kiosk") return;

    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        resetKiosk();
        router.replace("/kiosk");
      }, timeoutMs);
    };

    // Listen to user interactions
    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];
    events.forEach(event => document.addEventListener(event, resetTimer));

    // Start timer initially
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => document.removeEventListener(event, resetTimer));
    };
  }, [router, resetKiosk, pathname, timeoutMs]);

  return null; // This component doesn't render anything
}
