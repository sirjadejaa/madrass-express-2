import { db } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DisplaySettingsForm } from "./display-settings-form";
import { ExperienceSettingsForm } from "./experience-settings-form";
import { Monitor, Settings as SettingsIcon } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !["ADMIN", "MANAGER"].includes(session.user.role)) {
    redirect("/login");
  }

  const restaurantId = session.user.restaurantId;

  const restaurant = await db.restaurant.findUnique({
    where: { id: restaurantId },
    include: {
      settings: true,
      displaySetting: true,
      quizQuestions: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!restaurant) {
    return <div className="p-8">Restaurant not found.</div>;
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-zinc-100 shadow-xs">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-950 flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <SettingsIcon className="h-6 w-6" />
            </div>
            Restaurant Settings
          </h1>
          <p className="text-zinc-500 mt-2 font-medium ml-1">
            Configure customer waiting experience, guest Wi-Fi, call waiter system, trivia games, and display settings.
          </p>
        </div>
      </div>

      {/* Module 2, 3, 5, 7: Customer Experience, Wi-Fi, Call Waiter & Trivia Games */}
      <ExperienceSettingsForm
        initialSettings={restaurant.settings || {}}
        initialQuestions={restaurant.quizQuestions || []}
      />

      {/* TV Display Configuration */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-xs overflow-hidden">
        <div className="px-6 py-5 border-b border-zinc-100 bg-zinc-50/50 flex items-center gap-3">
          <Monitor className="h-5 w-5 text-zinc-400" />
          <h2 className="text-lg font-semibold text-zinc-800">TV Display Configuration</h2>
        </div>
        <div className="p-6 md:p-8 bg-zinc-50/30">
          <DisplaySettingsForm initialData={restaurant.displaySetting || {}} />
        </div>
      </div>
    </div>
  );
}
