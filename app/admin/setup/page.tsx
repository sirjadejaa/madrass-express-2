import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { SetupForm } from "./setup-form";
import { UtensilsCrossed } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminSetupPage() {
  const existingRestaurant = await db.restaurant.findFirst();
  
  if (existingRestaurant) {
    redirect("/admin");
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-amber-900/5 via-transparent to-transparent opacity-50 dark:opacity-20 pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.01] pointer-events-none" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l30 30-30 30L0 30z' fill='%23000' fill-rule='evenodd'/%3E%3C/svg%3E\")", backgroundSize: "30px 30px" }} />
      
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-xl shadow-zinc-200/50 dark:shadow-black/50 border border-zinc-200/60 dark:border-zinc-800 overflow-hidden relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="p-8 text-center relative overflow-hidden">
          <div className="flex justify-center mb-6 relative z-10">
            <div className="h-16 w-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
              <UtensilsCrossed className="text-white h-8 w-8" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 relative z-10">Welcome</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2 font-medium relative z-10">Let's set up your restaurant.</p>
        </div>
        <div className="p-8 pt-2">
          <SetupForm />
        </div>
      </div>
    </div>
  );
}
