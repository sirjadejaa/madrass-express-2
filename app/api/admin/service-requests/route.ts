import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !["ADMIN", "MANAGER", "COUNTER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const restaurantId = session.user.restaurantId;
    if (!restaurantId) {
      return NextResponse.json({ error: "No restaurant associated with this session." }, { status: 400 });
    }

    // Fetch requests from the last 24 hours
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const requests = await db.serviceRequest.findMany({
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

    const pendingCount = requests.filter((r) => r.status === "PENDING").length;

    return NextResponse.json({
      success: true,
      pendingCount,
      requests: requests.map((r) => ({
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
      })),
    });
  } catch (error: any) {
    console.error("API service requests error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch service requests." }, { status: 500 });
  }
}
