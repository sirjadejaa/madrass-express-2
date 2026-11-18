"use server";

import { db } from "@/lib/db";
import { 
  PaymentStatus, 
  OrderType, 
  ServiceRequestType, 
  ServiceRequestStatus 
} from "@prisma/client";

export async function getOrderTrackingStatus(trackingToken: string) {
  if (!trackingToken || typeof trackingToken !== "string") {
    return { error: "Invalid tracking token" };
  }

  const order = await db.order.findUnique({
    where: { trackingToken },
    select: {
      id: true,
      type: true,
      source: true,
      status: true,
      totalAmount: true,
      discountAmount: true,
      couponCode: true,
      createdAt: true,
      restaurantId: true,
      tableId: true,
      token: {
        select: {
          tokenNumber: true,
        },
      },
      table: {
        select: {
          id: true,
          number: true,
        },
      },
      payment: {
        select: {
          status: true,
          method: true,
          amount: true,
        },
      },
      items: {
        select: {
          id: true,
          quantity: true,
          price: true,
          notes: true,
          product: {
            select: {
              name: true,
              isVegetarian: true,
            },
          },
          options: {
            select: {
              id: true,
              quantity: true,
              price: true,
              option: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
      restaurant: {
        select: {
          id: true,
          name: true,
          settings: true,
        },
      },
    },
  });

  if (!order) {
    return { error: "Order not found" };
  }

  const settings = order.restaurant.settings;

  // Fetch active / recent service requests for this table
  let activeServiceRequests: any[] = [];
  if (order.tableId && db.serviceRequest?.findMany) {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const requests = await db.serviceRequest.findMany({
      where: {
        tableId: order.tableId,
        createdAt: { gte: twoHoursAgo },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    activeServiceRequests = requests.map((r) => ({
      id: r.id,
      type: r.type,
      status: r.status,
      notes: r.notes,
      cancelReason: r.cancelReason,
      createdAt: r.createdAt.toISOString(),
      acceptedAt: r.acceptedAt ? r.acceptedAt.toISOString() : null,
      completedAt: r.completedAt ? r.completedAt.toISOString() : null,
    }));
  }

  // Fetch popular/recommended items for "Explore More"
  let exploreMoreProducts: any[] = [];
  if ((settings?.exploreMoreEnabled ?? true) && db.product?.findMany) {
    const products = await db.product.findMany({
      where: {
        restaurantId: order.restaurantId,
        isAvailable: true,
        OR: [{ isPopular: true }, { isRecommended: true }],
      },
      take: 6,
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        isVegetarian: true,
        image: {
          select: { url: true },
        },
      },
    });

    exploreMoreProducts = products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: Number(p.price),
      isVegetarian: p.isVegetarian,
      imageUrl: p.image?.url || null,
    }));
  }

  // Check for any pending incoming Table Arena challenges for this table
  let incomingChallenge: any = null;
  if (order.tableId && db.gameMatch?.findFirst) {
    try {
      const pendingMatch = await db.gameMatch.findFirst({
        where: {
          guestTableId: order.tableId,
          status: "INVITED",
          expiresAt: { gt: new Date() },
        },
        include: {
          hostTable: { select: { number: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      if (pendingMatch) {
        incomingChallenge = {
          matchId: pendingMatch.id,
          gameType: pendingMatch.gameType,
          hostTableNumber: pendingMatch.hostTable?.number || "Unknown",
          hostPlayerName: pendingMatch.hostPlayerName,
          expiresAt: pendingMatch.expiresAt.toISOString(),
        };
      }
    } catch {
      // Non-fatal if table match query fails
    }
  }

  return {
    success: true,
    order: {
      displayId: order.id,
      tokenNumber: order.token?.tokenNumber || null,
      status: order.status,
      orderType: order.type,
      tableNumber: order.table?.number || null,
      tableId: order.tableId,
      restaurantId: order.restaurantId,
      totalAmount: Number(order.totalAmount),
      discountAmount: order.discountAmount ? Number(order.discountAmount) : 0,
      couponCode: order.couponCode,
      createdAt: order.createdAt,
      paymentStatus: order.payment?.status || PaymentStatus.PENDING,
      paymentMethod: order.payment?.method || null,
      restaurantName: order.restaurant.name,
      items: order.items.map((item) => ({
        id: item.id,
        name: item.product.name,
        isVegetarian: item.product.isVegetarian,
        quantity: item.quantity,
        price: Number(item.price),
        notes: item.notes,
        options: item.options.map((opt) => ({
          id: opt.id,
          name: opt.option.name,
          price: Number(opt.price),
          quantity: opt.quantity,
        })),
      })),
      // Module 2: Free Restaurant Wi-Fi
      wifi: settings?.wifiEnabled
        ? {
            enabled: true,
            ssid: settings.wifiSSID || "MadrassExpress-Guest",
            password: settings.wifiPassword || "",
            instructions: settings.wifiInstructions || "Connect to Wi-Fi network and enter password.",
          }
        : { enabled: false },
      // Module 3: Play & Win Configuration
      games: {
        enabled: settings?.gamesEnabled ?? true,
        rewardEnabled: settings?.gameRewardEnabled ?? false,
        rewardMinScore: settings?.gameRewardMinScore ?? 75,
      },
      // Table Arena Real-Time Multiplayer Games
      arena: {
        enabled: settings?.arenaEnabled ?? true,
        crossTableEnabled: settings?.arenaCrossTableEnabled ?? true,
        ticTacToeEnabled: settings?.arenaTicTacToeEnabled ?? true,
        rpsEnabled: settings?.arenaRpsEnabled ?? true,
        quizBattleEnabled: settings?.arenaQuizBattleEnabled ?? true,
        inviteExpirySeconds: settings?.arenaInviteExpirySeconds ?? 180,
      },
      incomingChallenge,
      // Module 5: Call Waiter System
      serviceRequests: {
        enabled: settings?.serviceRequestsEnabled ?? true,
        cooldownSeconds: settings?.serviceRequestCooldownSeconds ?? 60,
      },
      activeServiceRequests,
      exploreMoreProducts,
    },
  };
}

/**
 * Creates a validated Service Request for a dine-in table.
 * Enforces server-side table lookup via trackingToken, duplicate prevention, and cooldown.
 */
export async function createServiceRequestAction({
  trackingToken,
  type,
  notes,
}: {
  trackingToken: string;
  type: ServiceRequestType;
  notes?: string;
}) {
  if (!trackingToken || typeof trackingToken !== "string") {
    return { error: "Invalid tracking token." };
  }

  // Authoritative server-side lookup of order and table
  const order = await db.order.findUnique({
    where: { trackingToken },
    include: {
      table: true,
      restaurant: {
        include: { settings: true },
      },
    },
  });

  if (!order) {
    return { error: "Order not found." };
  }

  if (order.type !== OrderType.DINE_IN || !order.tableId || !order.table) {
    return { error: "Service requests are only available for dine-in tables." };
  }

  const settings = order.restaurant.settings;
  if (settings && settings.serviceRequestsEnabled === false) {
    return { error: "Service requests are currently disabled by the restaurant." };
  }

  const validTypes = Object.values(ServiceRequestType);
  if (!validTypes.includes(type)) {
    return { error: "Invalid service request type." };
  }

  // Sanitize notes if provided (max 200 chars)
  let cleanNotes: string | null = null;
  if (notes && typeof notes === "string") {
    cleanNotes = notes.trim().slice(0, 200).replace(/[<>]/g, ""); // strip script-like tags
  }

  if (type === ServiceRequestType.OTHER && (!cleanNotes || cleanNotes.length === 0)) {
    return { error: "Please enter a brief note describing your request." };
  }

  // 1. Duplicate check: check if a request of this exact type is already PENDING for this table
  const existingPending = await db.serviceRequest.findFirst({
    where: {
      tableId: order.tableId,
      type,
      status: ServiceRequestStatus.PENDING,
    },
  });

  if (existingPending) {
    return {
      error: "A request for this is already pending. Our staff has been notified and is attending to it!",
    };
  }

  // 2. Cooldown check: prevent rapid repeated submissions from the same table
  const cooldownSeconds = settings?.serviceRequestCooldownSeconds ?? 60;
  const lastRequest = await db.serviceRequest.findFirst({
    where: { tableId: order.tableId },
    orderBy: { createdAt: "desc" },
  });

  if (lastRequest) {
    const elapsedSeconds = (Date.now() - new Date(lastRequest.createdAt).getTime()) / 1000;
    if (elapsedSeconds < cooldownSeconds) {
      const remaining = Math.ceil(cooldownSeconds - elapsedSeconds);
      return {
        error: `Please wait ${remaining} seconds before submitting another service request.`,
      };
    }
  }

  // Create the service request
  const serviceRequest = await db.serviceRequest.create({
    data: {
      type,
      status: ServiceRequestStatus.PENDING,
      notes: cleanNotes,
      tableId: order.tableId,
      restaurantId: order.restaurantId,
      orderId: order.id,
    },
  });

  return {
    success: true,
    serviceRequest: {
      id: serviceRequest.id,
      type: serviceRequest.type,
      status: serviceRequest.status,
      notes: serviceRequest.notes,
      createdAt: serviceRequest.createdAt.toISOString(),
    },
  };
}

/**
 * Allows a customer to cancel their own pending service request.
 */
export async function cancelServiceRequestAction({
  trackingToken,
  requestId,
}: {
  trackingToken: string;
  requestId: string;
}) {
  if (!trackingToken || !requestId) {
    return { error: "Invalid parameters." };
  }

  const order = await db.order.findUnique({
    where: { trackingToken },
  });

  if (!order || !order.tableId) {
    return { error: "Order or table not found." };
  }

  const request = await db.serviceRequest.findUnique({
    where: { id: requestId },
  });

  if (!request || request.tableId !== order.tableId) {
    return { error: "Service request not found or not authorized." };
  }

  if (request.status !== ServiceRequestStatus.PENDING) {
    return { error: `Request is already ${request.status.toLowerCase()} and cannot be cancelled.` };
  }

  await db.serviceRequest.update({
    where: { id: requestId },
    data: {
      status: ServiceRequestStatus.CANCELLED,
      cancelReason: "Cancelled by customer",
      cancelledAt: new Date(),
    },
  });

  return { success: true };
}

/**
 * Retrieves quiz questions for the waiting customer.
 * SECURITY: Omits correctIndex and explanation so customers cannot cheat via DevTools.
 */
export async function getQuizQuestionsAction(trackingToken: string) {
  if (!trackingToken) {
    return { error: "Invalid tracking token." };
  }

  const order = await db.order.findUnique({
    where: { trackingToken },
    select: { restaurantId: true },
  });

  if (!order) {
    return { error: "Order not found." };
  }

  const questions = await db.quizQuestion.findMany({
    where: {
      restaurantId: order.restaurantId,
      isActive: true,
    },
    orderBy: { order: "asc" },
    take: 5,
    select: {
      id: true,
      question: true,
      options: true,
      order: true,
    },
  });

  return {
    success: true,
    questions,
  };
}

/**
 * Submits quiz answers and scores them on the server.
 * Evaluates reward eligibility and prevents duplicate claims.
 */
export async function submitQuizAction({
  trackingToken,
  answers,
}: {
  trackingToken: string;
  answers: Array<{ questionId: string; selectedIndex: number }>;
}) {
  if (!trackingToken || !Array.isArray(answers) || answers.length === 0) {
    return { error: "Invalid quiz submission." };
  }

  const order = await db.order.findUnique({
    where: { trackingToken },
    include: {
      restaurant: {
        include: { settings: true },
      },
    },
  });

  if (!order) {
    return { error: "Order not found." };
  }

  const settings = order.restaurant.settings;
  const questionIds = answers.map((a) => a.questionId);

  const realQuestions = await db.quizQuestion.findMany({
    where: {
      id: { in: questionIds },
      restaurantId: order.restaurantId,
    },
  });

  const questionMap = new Map(realQuestions.map((q) => [q.id, q]));

  let score = 0;
  const total = answers.length;
  const feedback: Array<{ questionId: string; isCorrect: boolean; explanation: string | null }> = [];

  for (const ans of answers) {
    const q = questionMap.get(ans.questionId);
    if (!q) continue;

    const isCorrect = q.correctIndex === ans.selectedIndex;
    if (isCorrect) {
      score++;
    }
    feedback.push({
      questionId: q.id,
      isCorrect,
      explanation: q.explanation,
    });
  }

  const percentage = Math.round((score / Math.max(1, total)) * 100);
  const minScore = settings?.gameRewardMinScore ?? 75;
  const passed = percentage >= minScore;

  let reward: { code: string; details: string } | null = null;
  let alreadyClaimed = false;

  if (passed && settings?.gameRewardEnabled) {
    // Check if a reward was already claimed for this order
    const existingClaim = await db.gameRewardClaim.findFirst({
      where: {
        restaurantId: order.restaurantId,
        orderId: order.id,
      },
    });

    if (existingClaim) {
      alreadyClaimed = true;
      reward = {
        code: existingClaim.rewardCode,
        details: existingClaim.rewardDetails || "You previously unlocked this reward!",
      };
    } else {
      // Issue new reward
      const couponCode = settings.gameRewardCouponCode || "WINNER10";
      const details = "Special waiting bonus! Use on your next order.";

      await db.gameRewardClaim.create({
        data: {
          restaurantId: order.restaurantId,
          orderId: order.id,
          tableId: order.tableId,
          score,
          total,
          rewardCode: couponCode,
          rewardDetails: details,
        },
      });

      reward = {
        code: couponCode,
        details,
      };
    }
  }

  return {
    success: true,
    score,
    total,
    percentage,
    passed,
    minScore,
    reward,
    alreadyClaimed,
    feedback,
  };
}
