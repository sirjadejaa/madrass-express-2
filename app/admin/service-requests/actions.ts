"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { ServiceRequestStatus } from "@prisma/client";

async function checkStaffAuth() {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "MANAGER", "COUNTER"].includes(session.user.role)) {
    throw new Error("Unauthorized. Insufficient staff permissions.");
  }
  return session;
}

export async function updateServiceRequestStatusAction({
  requestId,
  status,
  cancelReason,
}: {
  requestId: string;
  status: ServiceRequestStatus;
  cancelReason?: string;
}) {
  try {
    const session = await checkStaffAuth();
    const restaurantId = session.user.restaurantId;

    const request = await db.serviceRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return { error: "Service request not found." };
    }

    // Tenant isolation check
    if (request.restaurantId !== restaurantId) {
      return { error: "Access denied. Request belongs to another restaurant." };
    }

    const data: any = {
      status,
    };

    if (status === ServiceRequestStatus.ACCEPTED) {
      data.acceptedAt = new Date();
    } else if (status === ServiceRequestStatus.COMPLETED) {
      data.completedAt = new Date();
    } else if (status === ServiceRequestStatus.CANCELLED) {
      data.cancelledAt = new Date();
      data.cancelReason = cancelReason?.trim() || "Cancelled by staff";
    }

    const updated = await db.serviceRequest.update({
      where: { id: requestId },
      data,
      include: {
        table: true,
      },
    });

    revalidatePath("/admin/service-requests");
    return { success: true, request: updated };
  } catch (error: any) {
    console.error("Update service request status error:", error);
    return { error: error.message || "Failed to update service request." };
  }
}
