"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function checkAdminAuth() {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "MANAGER"].includes(session.user.role)) {
    throw new Error("Unauthorized. Insufficient admin permissions.");
  }
  return session;
}

export async function updateCustomerExperienceSettingsAction(data: {
  wifiEnabled: boolean;
  wifiSSID?: string;
  wifiPassword?: string;
  wifiInstructions?: string;
  gamesEnabled: boolean;
  gameRewardEnabled: boolean;
  gameRewardCouponCode?: string;
  gameRewardMinScore: number;
  exploreMoreEnabled: boolean;
  serviceRequestsEnabled: boolean;
  serviceRequestCooldownSeconds: number;
  notificationSoundEnabled: boolean;
}) {
  try {
    const session = await checkAdminAuth();
    const restaurantId = session.user.restaurantId;

    const updated = await db.restaurantSetting.upsert({
      where: { restaurantId },
      create: {
        restaurantId,
        wifiEnabled: data.wifiEnabled,
        wifiSSID: data.wifiSSID?.trim() || null,
        wifiPassword: data.wifiPassword?.trim() || null,
        wifiInstructions: data.wifiInstructions?.trim() || null,
        gamesEnabled: data.gamesEnabled,
        gameRewardEnabled: data.gameRewardEnabled,
        gameRewardCouponCode: data.gameRewardCouponCode?.trim() || null,
        gameRewardMinScore: Math.min(100, Math.max(0, Number(data.gameRewardMinScore) || 75)),
        exploreMoreEnabled: data.exploreMoreEnabled,
        serviceRequestsEnabled: data.serviceRequestsEnabled,
        serviceRequestCooldownSeconds: Math.max(10, Number(data.serviceRequestCooldownSeconds) || 60),
        notificationSoundEnabled: data.notificationSoundEnabled,
      },
      update: {
        wifiEnabled: data.wifiEnabled,
        wifiSSID: data.wifiSSID?.trim() || null,
        wifiPassword: data.wifiPassword?.trim() || null,
        wifiInstructions: data.wifiInstructions?.trim() || null,
        gamesEnabled: data.gamesEnabled,
        gameRewardEnabled: data.gameRewardEnabled,
        gameRewardCouponCode: data.gameRewardCouponCode?.trim() || null,
        gameRewardMinScore: Math.min(100, Math.max(0, Number(data.gameRewardMinScore) || 75)),
        exploreMoreEnabled: data.exploreMoreEnabled,
        serviceRequestsEnabled: data.serviceRequestsEnabled,
        serviceRequestCooldownSeconds: Math.max(10, Number(data.serviceRequestCooldownSeconds) || 60),
        notificationSoundEnabled: data.notificationSoundEnabled,
      },
    });

    revalidatePath("/admin/settings");
    return { success: true, settings: updated };
  } catch (error: any) {
    console.error("Update settings error:", error);
    return { error: error.message || "Failed to update restaurant settings." };
  }
}

export async function createQuizQuestionAction(data: {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}) {
  try {
    const session = await checkAdminAuth();
    const restaurantId = session.user.restaurantId;

    const cleanQuestion = data.question?.trim();
    if (!cleanQuestion) {
      return { error: "Question text is required." };
    }

    const cleanOptions = (data.options || [])
      .map((o) => o.trim())
      .filter((o) => o.length > 0);

    if (cleanOptions.length < 2) {
      return { error: "At least 2 options are required." };
    }

    const correctIndex = Number(data.correctIndex);
    if (isNaN(correctIndex) || correctIndex < 0 || correctIndex >= cleanOptions.length) {
      return { error: "Please choose a valid correct answer option." };
    }

    const existingCount = await db.quizQuestion.count({ where: { restaurantId } });

    const newQuestion = await db.quizQuestion.create({
      data: {
        restaurantId,
        question: cleanQuestion,
        options: cleanOptions,
        correctIndex,
        explanation: data.explanation?.trim() || null,
        order: existingCount + 1,
        isActive: true,
      },
    });

    revalidatePath("/admin/settings");
    return { success: true, question: newQuestion };
  } catch (error: any) {
    console.error("Create quiz question error:", error);
    return { error: error.message || "Failed to create quiz question." };
  }
}

export async function deleteQuizQuestionAction(id: string) {
  try {
    const session = await checkAdminAuth();
    const restaurantId = session.user.restaurantId;

    const question = await db.quizQuestion.findUnique({ where: { id } });
    if (!question || question.restaurantId !== restaurantId) {
      return { error: "Question not found or unauthorized." };
    }

    await db.quizQuestion.delete({ where: { id } });
    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error: any) {
    console.error("Delete quiz question error:", error);
    return { error: error.message || "Failed to delete question." };
  }
}

export async function toggleQuizQuestionAction(id: string, isActive: boolean) {
  try {
    const session = await checkAdminAuth();
    const restaurantId = session.user.restaurantId;

    const question = await db.quizQuestion.findUnique({ where: { id } });
    if (!question || question.restaurantId !== restaurantId) {
      return { error: "Question not found or unauthorized." };
    }

    await db.quizQuestion.update({
      where: { id },
      data: { isActive },
    });

    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error: any) {
    console.error("Toggle quiz question error:", error);
    return { error: error.message || "Failed to toggle question." };
  }
}
