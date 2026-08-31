import { ReactNode } from "react";
import { InactivityTimer } from "./components/inactivity-timer";

export default function KioskLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] lg:h-screen lg:w-screen lg:overflow-hidden bg-background text-foreground flex flex-col antialiased selection:bg-primary selection:text-primary-foreground">
      <InactivityTimer />
      {children}
    </div>
  );
}
