import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getStaff } from "./actions";
import { StaffClient } from "./client";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.restaurantId) {
    redirect("/login");
  }

  const staff = await getStaff(session.user.restaurantId);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 md:pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Staff Management</h2>
      </div>
      <StaffClient data={staff} restaurantId={session.user.restaurantId} />
    </div>
  );
}
