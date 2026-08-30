import { ReactNode } from "react";
import { InactivityTimer } from "./components/inactivity-timer";

export default function KioskLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] lg:h-screen lg:w-screen lg:overflow-hidden bg-background text-foreground flex flex-col antialiased selection:bg-primary selection:text-primary-foreground">
      <InactivityTimer />
      <div className="bg-red-500 text-white text-center font-bold p-2 z-50 fixed top-0 left-0 w-full">TEST VERSION 4</div>
      {children}
    </div>
  );
}
