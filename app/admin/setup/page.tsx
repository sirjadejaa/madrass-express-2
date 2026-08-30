import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { SetupForm } from "./setup-form";

export const dynamic = "force-dynamic";

export default async function AdminSetupPage() {
  const existingRestaurant = await db.restaurant.findFirst();
  
  if (existingRestaurant) {
    redirect("/admin");
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl border overflow-hidden">
        <div className="p-6 bg-stone-900 text-stone-50 text-center">
          <h1 className="text-2xl font-bold">Welcome</h1>
          <p className="text-stone-300 mt-2">Let's set up your restaurant.</p>
        </div>
        <div className="p-6">
          <SetupForm />
        </div>
      </div>
    </div>
  );
}
