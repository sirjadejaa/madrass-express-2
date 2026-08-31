import { db } from "@/lib/db";
import { DisplaySettingsForm } from "./display-settings-form";
import { Monitor, Settings as SettingsIcon } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const restaurant = await db.restaurant.findFirst({
    include: { displaySetting: true }
  });

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-950 flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <SettingsIcon className="h-6 w-6" />
            </div>
            Display Settings
          </h1>
          <p className="text-zinc-500 mt-2 font-medium ml-1">
            Configure how token numbers and announcements are presented on the customer display screen.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-zinc-100 bg-zinc-50/50 flex items-center gap-3">
          <Monitor className="h-5 w-5 text-zinc-400" />
          <h2 className="text-lg font-semibold text-zinc-800">TV Display Configuration</h2>
        </div>
        <div className="p-6 md:p-8 bg-zinc-50/30">
          <DisplaySettingsForm initialData={restaurant?.displaySetting || {}} />
        </div>
      </div>
    </div>
  );
}
