import React from "react";
import { Toaster } from "@/components/ui/toaster";

export const metadata = {
  title: "Madrass Express — Order at Table",
  description: "Browse menu, customize dishes, and order directly from your table.",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0",
};

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-stone-100/60 text-zinc-950 font-sans antialiased flex justify-center selection:bg-amber-200 selection:text-amber-900">
      <main className="w-full max-w-md bg-white min-h-screen shadow-xl relative flex flex-col pb-safe">
        {children}
        <Toaster />
      </main>
    </div>
  );
}
