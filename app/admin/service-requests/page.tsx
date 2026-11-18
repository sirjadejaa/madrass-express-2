import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ServiceRequestsClient } from "./client";

export const dynamic = "force-dynamic";

export default async function ServiceRequestsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !["ADMIN", "MANAGER", "COUNTER"].includes(session.user.role)) {
    redirect("/login");
  }

  const restaurantId = session.user.restaurantId;
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const rawRequests = await db.serviceRequest.findMany({
    where: {
      restaurantId,
      createdAt: { gte: since },
    },
    include: {
      table: {
        select: {
          id: true,
          number: true,
        },
      },
      order: {
        select: {
          id: true,
          token: {
            select: { tokenNumber: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const initialRequests = rawRequests.map((r) => ({
    id: r.id,
    type: r.type,
    status: r.status,
    notes: r.notes,
    cancelReason: r.cancelReason,
    tableId: r.tableId,
    tableName: r.table?.number || "Unknown Table",
    orderTokenNumber: r.order?.token?.tokenNumber || null,
    createdAt: r.createdAt.toISOString(),
    acceptedAt: r.acceptedAt ? r.acceptedAt.toISOString() : null,
    completedAt: r.completedAt ? r.completedAt.toISOString() : null,
    cancelledAt: r.cancelledAt ? r.cancelledAt.toISOString() : null,
  }));

  return <ServiceRequestsClient initialRequests={initialRequests} />;
}
