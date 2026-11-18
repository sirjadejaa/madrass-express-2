"use server";

import { db } from "@/lib/db";
import { ArenaService } from "@/lib/arena/arena-service";
import { GameType, GameMode, OrderType } from "@prisma/client";

/**
 * Validates the tracking token and returns the associated order, table, and restaurant settings.
 */
async function resolveTrackingContext(trackingToken: string) {
  if (!trackingToken || typeof trackingToken !== "string") {
    throw new Error("Invalid tracking token.");
  }

  const order = await db.order.findUnique({
    where: { trackingToken },
    include: {
      table: true,
      restaurant: {
        include: {
          settings: true,
        },
      },
    },
  });

  if (!order) {
    throw new Error("Order not found for this tracking token.");
  }

  if (order.type !== OrderType.DINE_IN || !order.tableId || !order.table) {
    throw new Error("Table Arena is available exclusively for dine-in orders at a restaurant table.");
  }

  const settings = order.restaurant.settings;

  if (settings && !settings.arenaEnabled) {
    throw new Error("Table Arena games are currently disabled by the restaurant.");
  }

  return { order, table: order.table, restaurant: order.restaurant, settings };
}

/**
 * Action to create a new Arena match.
 */
export async function createArenaMatchAction({
  trackingToken,
  gameType,
  mode,
  playerId,
  playerName,
  targetTableId,
}: {
  trackingToken: string;
  gameType: GameType;
  mode: GameMode;
  playerId: string;
  playerName?: string;
  targetTableId?: string;
}) {
  try {
    const { table, restaurant, settings } = await resolveTrackingContext(trackingToken);

    // Validate individual game setting
    if (gameType === GameType.TIC_TAC_TOE && settings && !settings.arenaTicTacToeEnabled) {
      return { error: "Tic-Tac-Toe is currently disabled by the restaurant." };
    }
    if (gameType === GameType.ROCK_PAPER_SCISSORS && settings && !settings.arenaRpsEnabled) {
      return { error: "Rock Paper Scissors is currently disabled by the restaurant." };
    }
    if (gameType === GameType.QUIZ_BATTLE && settings && !settings.arenaQuizBattleEnabled) {
      return { error: "Quiz Battle is currently disabled by the restaurant." };
    }

    if (mode === GameMode.CROSS_TABLE) {
      if (settings && !settings.arenaCrossTableEnabled) {
        return { error: "Cross-table challenges are currently disabled by the restaurant." };
      }
      if (!targetTableId) {
        return { error: "Target table must be selected for cross-table challenge." };
      }
      if (targetTableId === table.id) {
        return { error: "Cannot challenge your own table in cross-table mode." };
      }
    }

    const hostPlayerName = playerName?.trim() || `Table ${table.number}`;

    const match = await ArenaService.createMatch({
      restaurantId: restaurant.id,
      hostTableId: table.id,
      hostPlayerId: playerId,
      hostPlayerName,
      gameType,
      mode,
      guestTableId: targetTableId,
      expirySeconds: settings?.arenaInviteExpirySeconds || 180,
    });

    const sanitized = ArenaService.sanitizeMatch(match, playerId);
    return { success: true, match: sanitized };
  } catch (error: any) {
    console.error("createArenaMatchAction error:", error);
    return { error: error.message || "Failed to create game match." };
  }
}

/**
 * Action to join an existing match (via invite code or match ID).
 */
export async function joinArenaMatchAction({
  trackingToken,
  inviteCode,
  matchId,
  playerId,
  playerName,
}: {
  trackingToken: string;
  inviteCode?: string;
  matchId?: string;
  playerId: string;
  playerName?: string;
}) {
  try {
    const { table, restaurant } = await resolveTrackingContext(trackingToken);

    const guestPlayerName = playerName?.trim() || `Table ${table.number}`;

    const match = await ArenaService.joinMatch({
      restaurantId: restaurant.id,
      guestTableId: table.id,
      guestPlayerId: playerId,
      guestPlayerName,
      inviteCode,
      matchId,
    });

    const sanitized = ArenaService.sanitizeMatch(match, playerId);
    return { success: true, match: sanitized };
  } catch (error: any) {
    console.error("joinArenaMatchAction error:", error);
    return { error: error.message || "Failed to join game match." };
  }
}

/**
 * Action to submit a player move with optimistic concurrency control.
 */
export async function submitArenaMoveAction({
  matchId,
  playerId,
  expectedVersion,
  moveData,
}: {
  matchId: string;
  playerId: string;
  expectedVersion: number;
  moveData: any;
}) {
  try {
    const updated = await ArenaService.submitMove({
      matchId,
      playerId,
      expectedVersion,
      moveData,
    });

    const sanitized = ArenaService.sanitizeMatch(updated, playerId);
    return { success: true, match: sanitized };
  } catch (error: any) {
    if (error.code === "VERSION_MISMATCH") {
      return {
        error: error.message,
        code: "VERSION_MISMATCH",
        currentVersion: error.currentVersion,
      };
    }
    console.error("submitArenaMoveAction error:", error);
    return { error: error.message || "Failed to submit move." };
  }
}

/**
 * Action to accept or decline an incoming cross-table challenge.
 */
export async function respondToArenaChallengeAction({
  trackingToken,
  matchId,
  playerId,
  accept,
}: {
  trackingToken: string;
  matchId: string;
  playerId: string;
  accept: boolean;
}) {
  try {
    const { table } = await resolveTrackingContext(trackingToken);

    const updated = await ArenaService.respondToChallenge({
      matchId,
      guestTableId: table.id,
      guestPlayerId: playerId,
      guestPlayerName: `Table ${table.number}`,
      accept,
    });

    const sanitized = ArenaService.sanitizeMatch(updated, playerId);
    return { success: true, match: sanitized };
  } catch (error: any) {
    console.error("respondToArenaChallengeAction error:", error);
    return { error: error.message || "Failed to respond to challenge." };
  }
}

/**
 * Action to forfeit or cancel a match.
 */
export async function forfeitArenaMatchAction({
  matchId,
  playerId,
}: {
  matchId: string;
  playerId: string;
}) {
  try {
    await ArenaService.forfeitOrCancelMatch({ matchId, playerId });
    return { success: true };
  } catch (error: any) {
    console.error("forfeitArenaMatchAction error:", error);
    return { error: error.message || "Failed to cancel match." };
  }
}

/**
 * Action to list other active tables in the restaurant eligible for challenges.
 */
export async function getEligibleTablesAction(trackingToken: string) {
  try {
    const { table, restaurant } = await resolveTrackingContext(trackingToken);

    const tables = await ArenaService.listEligibleTables({
      restaurantId: restaurant.id,
      currentTableId: table.id,
    });

    return { success: true, tables };
  } catch (error: any) {
    console.error("getEligibleTablesAction error:", error);
    return { error: error.message || "Failed to fetch tables." };
  }
}
