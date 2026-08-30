import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getProducts } from "./actions";
import { getCategories } from "../categories/actions";
import { MenuClient } from "./client";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function MenuPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.restaurantId) {
    redirect("/login");
  }

  const products = await getProducts(session.user.restaurantId);
  const categories = await getCategories(session.user.restaurantId);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 md:pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Menu Management</h2>
      </div>
      <MenuClient data={products} categories={categories} restaurantId={session.user.restaurantId} />
    </div>
  );
}
