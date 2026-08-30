import { ReportsClient } from "./reports-client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reports & Analytics | Madrass Express",
  description: "Restaurant sales and performance reports",
};

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
        <p className="text-muted-foreground">
          View sales performance, product trends, and revenue insights.
        </p>
      </div>

      <ReportsClient />
    </div>
  );
}
