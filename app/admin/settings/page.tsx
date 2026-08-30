import { db } from "@/lib/db";
import { DisplaySettingsForm } from "./display-settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const restaurant = await db.restaurant.findFirst({
    include: { displaySetting: true }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Display Settings</h1>
        <p className="text-muted-foreground">
          Manage the customer-facing Token Display screen.
        </p>
      </div>

      <div className="grid gap-6 border p-6 rounded-lg bg-card">
        <h2 className="text-xl font-semibold">TV Display Configuration</h2>
        <DisplaySettingsForm initialData={restaurant?.displaySetting || {}} />
      </div>
    </div>
  );
}
