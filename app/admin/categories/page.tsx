import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCategories } from "./actions";
import { CategoriesClient } from "./client";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.restaurantId) {
    redirect("/login");
  }

  const categories = await getCategories(session.user.restaurantId);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 md:pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Category Management</h2>
      </div>
      <CategoriesClient data={categories} restaurantId={session.user.restaurantId} />
    </div>
  );
}
