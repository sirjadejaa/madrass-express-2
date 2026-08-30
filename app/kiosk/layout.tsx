import { ReactNode } from "react";
import { InactivityTimer } from "./components/inactivity-timer";

export default function KioskLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-background text-foreground flex flex-col antialiased selection:bg-primary selection:text-primary-foreground">
      <InactivityTimer />
      {children}
    </div>
  );
}
