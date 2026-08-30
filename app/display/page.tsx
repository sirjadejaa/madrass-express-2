import { DisplayClient } from "./client";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DisplayPage() {
  const restaurant = await db.restaurant.findFirst({
    include: { displaySetting: true }
  });

  if (!restaurant) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-8 text-center bg-black text-white">
        <h2 className="text-3xl font-bold mb-4">No restaurant configured</h2>
        <a href="/admin/setup" className="inline-flex h-12 items-center justify-center rounded-md bg-white px-8 text-sm font-medium text-black shadow transition-colors hover:bg-gray-200">
          GO TO ADMIN SETUP
        </a>
      </div>
    );
  }

  return <DisplayClient initialSettings={restaurant.displaySetting} />;
}
