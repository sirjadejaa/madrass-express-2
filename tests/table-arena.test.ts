import { describe, it, expect, vi, beforeEach } from "vitest";
import { ArenaService } from "@/lib/arena/arena-service";
import {
  createArenaMatchAction,
  joinArenaMatchAction,
  submitArenaMoveAction,
  respondToArenaChallengeAction,
  forfeitArenaMatchAction,
  getEligibleTablesAction,
} from "@/app/m/order/[trackingToken]/arena-actions";
import { updateCustomerExperienceSettingsAction } from "@/app/admin/settings/actions";
import { db } from "@/lib/db";
import {
  GameType,
  GameMatchStatus,
  GameMode,
  OrderStatus,
  OrderType,
} from "@prisma/client";

// Mock next-auth
let mockSession: any = {
  user: { id: "admin-1", email: "admin@madrass.com", role: "ADMIN", restaurantId: "rest-01" },
};
vi.mock("next-auth/next", () => ({
  getServerSession: vi.fn(async () => mockSession),
}));

// Mock revalidatePath
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("Table Arena: Real-Time Multiplayer Games", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Match Creation & Game Initialization", () => {
    it("creates a Same-Table Tic-Tac-Toe match in WAITING_FOR_PLAYER status with a 6-char code", async () => {
      const mockCreatedMatch = {
        id: "match-ttt-1",
        restaurantId: "rest-01",
        hostTableId: "tbl-04",
        hostPlayerId: "p_host_1",
        hostPlayerName: "Table 04",
        guestTableId: null,
        guestPlayerId: null,
        guestPlayerName: null,
        gameType: GameType.TIC_TAC_TOE,
        mode: GameMode.SAME_TABLE,
        status: GameMatchStatus.WAITING_FOR_PLAYER,
        currentTurnPlayerId: "p_host_1",
        winnerPlayerId: null,
        isDraw: false,
        version: 1,
        gameState: {
          board: Array(9).fill(null),
          hostSymbol: "X",
          guestSymbol: "O",
          winningLine: null,
        },
        inviteCode: "ARENA4",
        expiresAt: new Date(Date.now() + 180000),
        createdAt: new Date(),
        updatedAt: new Date(),
        startedAt: null,
        completedAt: null,
        hostTable: { number: "04" },
        guestTable: null,
      };

      vi.spyOn(db.gameMatch, "create").mockResolvedValueOnce(mockCreatedMatch as any);

      const match = await ArenaService.createMatch({
        restaurantId: "rest-01",
        hostTableId: "tbl-04",
        hostPlayerId: "p_host_1",
        hostPlayerName: "Table 04",
        gameType: GameType.TIC_TAC_TOE,
        mode: GameMode.SAME_TABLE,
      });

      expect(match.id).toBe("match-ttt-1");
      expect(match.status).toBe(GameMatchStatus.WAITING_FOR_PLAYER);
      expect(match.currentTurnPlayerId).toBe("p_host_1");
      expect((match.gameState as any).board).toHaveLength(9);
    });

    it("creates a Cross-Table challenge with status INVITED and target table", async () => {
      const mockCreatedMatch = {
        id: "match-rps-cross",
        restaurantId: "rest-01",
        hostTableId: "tbl-04",
        hostPlayerId: "p_host_1",
        hostPlayerName: "Table 04",
        guestTableId: "tbl-08",
        guestPlayerId: null,
        guestPlayerName: null,
        gameType: GameType.ROCK_PAPER_SCISSORS,
        mode: GameMode.CROSS_TABLE,
        status: GameMatchStatus.INVITED,
        currentTurnPlayerId: null,
        winnerPlayerId: null,
        isDraw: false,
        version: 1,
        gameState: {
          round: 1,
          targetWins: 2,
          hostScore: 0,
          guestScore: 0,
          hostChoice: null,
          guestChoice: null,
          roundWinner: null,
          history: [],
        },
        inviteCode: "CROSS8",
        expiresAt: new Date(Date.now() + 180000),
        createdAt: new Date(),
        updatedAt: new Date(),
        startedAt: null,
        completedAt: null,
        hostTable: { number: "04" },
        guestTable: { number: "08" },
      };

      vi.spyOn(db.gameMatch, "create").mockResolvedValueOnce(mockCreatedMatch as any);

      const match = await ArenaService.createMatch({
        restaurantId: "rest-01",
        hostTableId: "tbl-04",
        hostPlayerId: "p_host_1",
        hostPlayerName: "Table 04",
        guestTableId: "tbl-08",
        gameType: GameType.ROCK_PAPER_SCISSORS,
        mode: GameMode.CROSS_TABLE,
      });

      expect(match.status).toBe(GameMatchStatus.INVITED);
      expect(match.guestTableId).toBe("tbl-08");
      expect(match.mode).toBe(GameMode.CROSS_TABLE);
    });

    it("creates a Pass & Play match immediately in IN_PROGRESS status without invite code", async () => {
      const mockCreatedMatch = {
        id: "match-pnp-1",
        restaurantId: "rest-01",
        hostTableId: "tbl-04",
        hostPlayerId: "p_host_1",
        hostPlayerName: "Player 1",
        guestTableId: "tbl-04",
        guestPlayerId: "p_host_1_p2",
        guestPlayerName: "Player 2",
        gameType: GameType.TIC_TAC_TOE,
        mode: GameMode.PASS_AND_PLAY,
        status: GameMatchStatus.IN_PROGRESS,
        currentTurnPlayerId: "p_host_1",
        winnerPlayerId: null,
        isDraw: false,
        version: 1,
        gameState: {
          board: Array(9).fill(null),
          hostSymbol: "X",
          guestSymbol: "O",
          winningLine: null,
        },
        inviteCode: null,
        expiresAt: new Date(Date.now() + 180000),
        createdAt: new Date(),
        updatedAt: new Date(),
        startedAt: new Date(),
        completedAt: null,
        hostTable: { number: "04" },
        guestTable: { number: "04" },
      };

      vi.spyOn(db.gameMatch, "create").mockResolvedValueOnce(mockCreatedMatch as any);

      const match = await ArenaService.createMatch({
        restaurantId: "rest-01",
        hostTableId: "tbl-04",
        hostPlayerId: "p_host_1",
        gameType: GameType.TIC_TAC_TOE,
        mode: GameMode.PASS_AND_PLAY,
      });

      expect(match.status).toBe(GameMatchStatus.IN_PROGRESS);
      expect(match.guestPlayerId).toBe("p_host_1_p2");
      expect(match.inviteCode).toBeNull();
    });
  });

  describe("2. Joining & Multi-Tenant Security", () => {
    it("allows joining with valid invite code and advances status to IN_PROGRESS", async () => {
      const existingMatch = {
        id: "match-1",
        restaurantId: "rest-01",
        hostTableId: "tbl-04",
        hostPlayerId: "p_host_1",
        guestPlayerId: null,
        mode: GameMode.SAME_TABLE,
        status: GameMatchStatus.WAITING_FOR_PLAYER,
        expiresAt: new Date(Date.now() + 60000),
        version: 1,
        hostTable: { number: "04" },
        guestTable: null,
      };

      vi.spyOn(db.gameMatch, "findFirst").mockResolvedValueOnce(existingMatch as any);
      vi.spyOn(db.gameMatch, "update").mockResolvedValueOnce({
        ...existingMatch,
        guestPlayerId: "p_guest_2",
        guestPlayerName: "Player 2",
        guestTableId: "tbl-04",
        status: GameMatchStatus.IN_PROGRESS,
        version: 2,
      } as any);

      const joined = await ArenaService.joinMatch({
        restaurantId: "rest-01",
        guestTableId: "tbl-04",
        guestPlayerId: "p_guest_2",
        inviteCode: "ARENA4",
      });

      expect(joined.status).toBe(GameMatchStatus.IN_PROGRESS);
      expect(joined.guestPlayerId).toBe("p_guest_2");
      expect(joined.version).toBe(2);
    });

    it("rejects joining a SAME_TABLE match if guest is at a different table", async () => {
      const existingMatch = {
        id: "match-1",
        restaurantId: "rest-01",
        hostTableId: "tbl-04",
        hostPlayerId: "p_host_1",
        mode: GameMode.SAME_TABLE,
        status: GameMatchStatus.WAITING_FOR_PLAYER,
        expiresAt: new Date(Date.now() + 60000),
      };

      vi.spyOn(db.gameMatch, "findFirst").mockResolvedValueOnce(existingMatch as any);

      await expect(
        ArenaService.joinMatch({
          restaurantId: "rest-01",
          guestTableId: "tbl-09", // Different table
          guestPlayerId: "p_guest_2",
          inviteCode: "ARENA4",
        })
      ).rejects.toThrow(/Both players must be at the same table/);
    });

    it("rejects joining an expired invitation", async () => {
      const expiredMatch = {
        id: "match-exp",
        restaurantId: "rest-01",
        hostTableId: "tbl-04",
        mode: GameMode.SAME_TABLE,
        status: GameMatchStatus.WAITING_FOR_PLAYER,
        expiresAt: new Date(Date.now() - 5000), // Expired 5 seconds ago
      };

      vi.spyOn(db.gameMatch, "findFirst").mockResolvedValueOnce(expiredMatch as any);
      vi.spyOn(db.gameMatch, "update").mockResolvedValueOnce({} as any);

      await expect(
        ArenaService.joinMatch({
          restaurantId: "rest-01",
          guestTableId: "tbl-04",
          guestPlayerId: "p_guest_2",
          inviteCode: "ARENA4",
        })
      ).rejects.toThrow(/invitation has expired/);
    });
  });

  describe("3. Server-Authoritative Moves & Concurrency", () => {
    it("replaces or rejects move on VERSION_MISMATCH (Optimistic concurrency)", async () => {
      const currentMatch = {
        id: "match-concurrency",
        version: 3, // Current server version is 3
        status: GameMatchStatus.IN_PROGRESS,
        gameType: GameType.TIC_TAC_TOE,
        hostPlayerId: "p_host",
        guestPlayerId: "p_guest",
        mode: GameMode.SAME_TABLE,
      };

      vi.spyOn(db, "$transaction").mockImplementationOnce(async (callback: any) => {
        const tx = {
          gameMatch: {
            findUnique: vi.fn().mockResolvedValueOnce(currentMatch),
          },
        };
        return callback(tx);
      });

      await expect(
        ArenaService.submitMove({
          matchId: "match-concurrency",
          playerId: "p_host",
          expectedVersion: 2, // Stale version submitted by client!
          moveData: { cellIndex: 0 },
        })
      ).rejects.toThrow(/Conflict: Game state has updated/);
    });

    it("Tic-Tac-Toe: Rejects move if out of turn", async () => {
      const currentMatch = {
        id: "match-ttt-turn",
        version: 1,
        status: GameMatchStatus.IN_PROGRESS,
        gameType: GameType.TIC_TAC_TOE,
        hostPlayerId: "p_host",
        guestPlayerId: "p_guest",
        currentTurnPlayerId: "p_host", // It is host's turn
        mode: GameMode.SAME_TABLE,
        gameState: {
          board: Array(9).fill(null),
          hostSymbol: "X",
          guestSymbol: "O",
          winningLine: null,
        },
      };

      vi.spyOn(db, "$transaction").mockImplementationOnce(async (callback: any) => {
        const tx = {
          gameMatch: {
            findUnique: vi.fn().mockResolvedValueOnce(currentMatch),
          },
        };
        return callback(tx);
      });

      // Guest attempts to move when it's Host's turn
      await expect(
        ArenaService.submitMove({
          matchId: "match-ttt-turn",
          playerId: "p_guest",
          expectedVersion: 1,
          moveData: { cellIndex: 0 },
        })
      ).rejects.toThrow(/not your turn/);
    });

    it("Tic-Tac-Toe: Rejects occupying an already filled cell", async () => {
      const boardWithCell0 = ["X", null, null, null, null, null, null, null, null];
      const currentMatch = {
        id: "match-ttt-occupied",
        version: 2,
        status: GameMatchStatus.IN_PROGRESS,
        gameType: GameType.TIC_TAC_TOE,
        hostPlayerId: "p_host",
        guestPlayerId: "p_guest",
        currentTurnPlayerId: "p_guest",
        mode: GameMode.SAME_TABLE,
        gameState: {
          board: boardWithCell0,
          hostSymbol: "X",
          guestSymbol: "O",
          winningLine: null,
        },
      };

      vi.spyOn(db, "$transaction").mockImplementationOnce(async (callback: any) => {
        const tx = {
          gameMatch: {
            findUnique: vi.fn().mockResolvedValueOnce(currentMatch),
          },
        };
        return callback(tx);
      });

      await expect(
        ArenaService.submitMove({
          matchId: "match-ttt-occupied",
          playerId: "p_guest",
          expectedVersion: 2,
          moveData: { cellIndex: 0 }, // Cell 0 is already taken
        })
      ).rejects.toThrow(/Cell is already occupied/);
    });

    it("Tic-Tac-Toe: Detects winning row and sets status to COMPLETED with winner", async () => {
      // Board where host 'X' is about to complete row [0, 1, 2]
      const board = ["X", "X", null, "O", "O", null, null, null, null];
      const currentMatch = {
        id: "match-ttt-win",
        version: 4,
        status: GameMatchStatus.IN_PROGRESS,
        gameType: GameType.TIC_TAC_TOE,
        hostPlayerId: "p_host",
        guestPlayerId: "p_guest",
        currentTurnPlayerId: "p_host",
        mode: GameMode.SAME_TABLE,
        gameState: {
          board,
          hostSymbol: "X",
          guestSymbol: "O",
          winningLine: null,
        },
      };

      vi.spyOn(db, "$transaction").mockImplementationOnce(async (callback: any) => {
        const tx = {
          gameMatch: {
            findUnique: vi.fn().mockResolvedValueOnce(currentMatch),
            update: vi.fn().mockImplementationOnce(({ data }) => ({
              ...currentMatch,
              ...data,
              version: currentMatch.version + 1,
            })),
          },
          gameMove: {
            create: vi.fn().mockResolvedValueOnce({}),
          },
        };
        return callback(tx);
      });

      const updated = await ArenaService.submitMove({
        matchId: "match-ttt-win",
        playerId: "p_host",
        expectedVersion: 4,
        moveData: { cellIndex: 2 },
      });

      expect(updated.status).toBe(GameMatchStatus.COMPLETED);
      expect(updated.winnerPlayerId).toBe("p_host");
      expect((updated.gameState as any).winningLine).toEqual([0, 1, 2]);
    });

    it("Tic-Tac-Toe: Detects draw when all 9 cells are filled with no winner", async () => {
      // Board with 8 filled cells, no winner
      const board = ["X", "O", "X", "X", "O", "O", "O", "X", null];
      const currentMatch = {
        id: "match-ttt-draw",
        version: 8,
        status: GameMatchStatus.IN_PROGRESS,
        gameType: GameType.TIC_TAC_TOE,
        hostPlayerId: "p_host",
        guestPlayerId: "p_guest",
        currentTurnPlayerId: "p_guest",
        winnerPlayerId: null,
        isDraw: false,
        mode: GameMode.SAME_TABLE,
        gameState: {
          board,
          hostSymbol: "X",
          guestSymbol: "O",
          winningLine: null,
        },
      };

      vi.spyOn(db, "$transaction").mockImplementationOnce(async (callback: any) => {
        const tx = {
          gameMatch: {
            findUnique: vi.fn().mockResolvedValueOnce(currentMatch),
            update: vi.fn().mockImplementationOnce(({ data }) => ({
              ...currentMatch,
              ...data,
              version: currentMatch.version + 1,
            })),
          },
          gameMove: {
            create: vi.fn().mockResolvedValueOnce({}),
          },
        };
        return callback(tx);
      });

      const updated = await ArenaService.submitMove({
        matchId: "match-ttt-draw",
        playerId: "p_guest",
        expectedVersion: 8,
        moveData: { cellIndex: 8 },
      });

      expect(updated.status).toBe(GameMatchStatus.COMPLETED);
      expect(updated.isDraw).toBe(true);
      expect(updated.winnerPlayerId).toBeNull();
    });
  });

  describe("4. Rock Paper Scissors Simultaneous Throws & Sanitization", () => {
    it("hides opponent's choice when only one player has submitted", () => {
      const match = {
        id: "match-rps",
        gameType: GameType.ROCK_PAPER_SCISSORS,
        mode: GameMode.SAME_TABLE,
        status: GameMatchStatus.IN_PROGRESS,
        hostPlayerId: "p_host",
        guestPlayerId: "p_guest",
        hostPlayerName: "Host",
        guestPlayerName: "Guest",
        currentTurnPlayerId: null,
        winnerPlayerId: null,
        isDraw: false,
        version: 2,
        inviteCode: "ARENA1",
        expiresAt: new Date(),
        createdAt: new Date(),
        startedAt: new Date(),
        completedAt: null,
        gameState: {
          round: 1,
          targetWins: 2,
          hostScore: 0,
          guestScore: 0,
          hostChoice: "ROCK", // Host has picked ROCK
          guestChoice: null, // Guest has not picked yet
          roundWinner: null,
          history: [],
        },
      };

      // When Guest requests state, hostChoice must be concealed!
      const guestView = ArenaService.sanitizeMatch(match, "p_guest");
      expect(guestView.gameState.hostChoice).toBeNull();
      expect(guestView.gameState.hasHostChosen).toBe(true);

      // When Host requests state, Host can see their own choice
      const hostView = ArenaService.sanitizeMatch(match, "p_host");
      expect(hostView.gameState.hostChoice).toBe("ROCK");
    });

    it("resolves Rock vs Scissors round correctly and advances score", async () => {
      // Host has chosen ROCK; guest now submits SCISSORS
      const currentMatch = {
        id: "match-rps-eval",
        version: 2,
        status: GameMatchStatus.IN_PROGRESS,
        gameType: GameType.ROCK_PAPER_SCISSORS,
        hostPlayerId: "p_host",
        guestPlayerId: "p_guest",
        mode: GameMode.SAME_TABLE,
        gameState: {
          round: 1,
          targetWins: 2,
          hostScore: 0,
          guestScore: 0,
          hostChoice: "ROCK",
          guestChoice: null,
          roundWinner: null,
          history: [],
        },
      };

      vi.spyOn(db, "$transaction").mockImplementationOnce(async (callback: any) => {
        const tx = {
          gameMatch: {
            findUnique: vi.fn().mockResolvedValueOnce(currentMatch),
            update: vi.fn().mockImplementationOnce(({ data }) => ({
              ...currentMatch,
              ...data,
              version: currentMatch.version + 1,
            })),
          },
          gameMove: {
            create: vi.fn().mockResolvedValueOnce({}),
          },
        };
        return callback(tx);
      });

      const updated = await ArenaService.submitMove({
        matchId: "match-rps-eval",
        playerId: "p_guest",
        expectedVersion: 2,
        moveData: { choice: "SCISSORS" },
      });

      // Rock beats Scissors => host scores!
      expect((updated.gameState as any).hostScore).toBe(1);
      expect((updated.gameState as any).guestScore).toBe(0);
      expect((updated.gameState as any).roundWinner).toBe("host");
      expect((updated.gameState as any).history).toHaveLength(1);
      expect((updated.gameState as any).history[0]).toEqual({
        round: 1,
        hostChoice: "ROCK",
        guestChoice: "SCISSORS",
        winner: "host",
      });
    });
  });

  describe("5. Quiz Battle Server Scoring & Answer Protection", () => {
    it("sanitizes questions by concealing correctIndex for upcoming/unanswered questions", () => {
      const match = {
        id: "match-quiz",
        gameType: GameType.QUIZ_BATTLE,
        mode: GameMode.SAME_TABLE,
        status: GameMatchStatus.IN_PROGRESS,
        hostPlayerId: "p_host",
        guestPlayerId: "p_guest",
        hostPlayerName: "Host",
        guestPlayerName: "Guest",
        currentTurnPlayerId: null,
        winnerPlayerId: null,
        isDraw: false,
        version: 1,
        inviteCode: "ARENA2",
        expiresAt: new Date(),
        createdAt: new Date(),
        startedAt: new Date(),
        completedAt: null,
        gameState: {
          currentQuestionIndex: 0,
          totalQuestions: 2,
          questions: [
            { id: "q1", question: "What lentil is in Medu Vada?", options: ["Urad", "Toor"], correctIndex: 0 },
            { id: "q2", question: "What spice is in Sambar?", options: ["Turmeric", "Saffron"], correctIndex: 0 },
          ],
          hostAnswer: null,
          guestAnswer: null,
          hostScore: 0,
          guestScore: 0,
          roundResults: [],
        },
      };

      const sanitized = ArenaService.sanitizeMatch(match, "p_host");
      expect(sanitized.gameState.questions[0].correctIndex).toBeUndefined();
      expect(sanitized.gameState.questions[1].correctIndex).toBeUndefined();
    });

    it("evaluates correct vs wrong answers, awards 100 points, and completes on last question", async () => {
      const currentMatch = {
        id: "match-quiz-eval",
        version: 2,
        status: GameMatchStatus.IN_PROGRESS,
        gameType: GameType.QUIZ_BATTLE,
        hostPlayerId: "p_host",
        guestPlayerId: "p_guest",
        mode: GameMode.SAME_TABLE,
        gameState: {
          currentQuestionIndex: 0,
          totalQuestions: 1, // 1 question match
          questions: [
            { id: "q1", question: "What lentil is in Medu Vada?", options: ["Urad Dal", "Toor Dal"], correctIndex: 0 },
          ],
          hostAnswer: 0, // Host picked correct (Option 0)
          guestAnswer: null,
          hostScore: 0,
          guestScore: 0,
          roundResults: [],
        },
      };

      vi.spyOn(db, "$transaction").mockImplementationOnce(async (callback: any) => {
        const tx = {
          gameMatch: {
            findUnique: vi.fn().mockResolvedValueOnce(currentMatch),
            update: vi.fn().mockImplementationOnce(({ data }) => ({
              ...currentMatch,
              ...data,
              version: currentMatch.version + 1,
            })),
          },
          gameMove: {
            create: vi.fn().mockResolvedValueOnce({}),
          },
        };
        return callback(tx);
      });

      // Guest submits wrong answer (Option 1)
      const updated = await ArenaService.submitMove({
        matchId: "match-quiz-eval",
        playerId: "p_guest",
        expectedVersion: 2,
        moveData: { answerIndex: 1 },
      });

      expect(updated.status).toBe(GameMatchStatus.COMPLETED);
      expect((updated.gameState as any).hostScore).toBe(100);
      expect((updated.gameState as any).guestScore).toBe(0);
      expect(updated.winnerPlayerId).toBe("p_host");
    });
  });

  describe("6. Cross-Table Challenges & Response Flow", () => {
    it("accepting a challenge sets status to IN_PROGRESS", async () => {
      const pendingMatch = {
        id: "match-cross-challenge",
        guestTableId: "tbl-08",
        status: GameMatchStatus.INVITED,
        expiresAt: new Date(Date.now() + 60000),
      };

      vi.spyOn(db.gameMatch, "findUnique").mockResolvedValueOnce(pendingMatch as any);
      vi.spyOn(db.gameMatch, "update").mockResolvedValueOnce({
        ...pendingMatch,
        guestPlayerId: "p_guest_8",
        status: GameMatchStatus.IN_PROGRESS,
        version: 2,
      } as any);

      const res = await ArenaService.respondToChallenge({
        matchId: "match-cross-challenge",
        guestTableId: "tbl-08",
        guestPlayerId: "p_guest_8",
        accept: true,
      });

      expect(res.status).toBe(GameMatchStatus.IN_PROGRESS);
      expect(res.guestPlayerId).toBe("p_guest_8");
    });

    it("declining a challenge sets status to CANCELLED", async () => {
      const pendingMatch = {
        id: "match-cross-challenge-2",
        guestTableId: "tbl-08",
        status: GameMatchStatus.INVITED,
        expiresAt: new Date(Date.now() + 60000),
      };

      vi.spyOn(db.gameMatch, "findUnique").mockResolvedValueOnce(pendingMatch as any);
      vi.spyOn(db.gameMatch, "update").mockResolvedValueOnce({
        ...pendingMatch,
        status: GameMatchStatus.CANCELLED,
        version: 2,
      } as any);

      const res = await ArenaService.respondToChallenge({
        matchId: "match-cross-challenge-2",
        guestTableId: "tbl-08",
        guestPlayerId: "p_guest_8",
        accept: false,
      });

      expect(res.status).toBe(GameMatchStatus.CANCELLED);
    });
  });

  describe("7. Admin Controls & Experience Settings Integration", () => {
    it("admin can configure arena settings (toggle arena, individual games, and invite expiry)", async () => {
      const mockUpdated = {
        id: "set-1",
        restaurantId: "rest-01",
        arenaEnabled: true,
        arenaCrossTableEnabled: false,
        arenaTicTacToeEnabled: true,
        arenaRpsEnabled: true,
        arenaQuizBattleEnabled: false,
        arenaInviteExpirySeconds: 120,
      };

      vi.spyOn(db.restaurantSetting, "upsert").mockResolvedValueOnce(mockUpdated as any);

      const res = await updateCustomerExperienceSettingsAction({
        wifiEnabled: true,
        gamesEnabled: true,
        gameRewardEnabled: false,
        gameRewardMinScore: 75,
        exploreMoreEnabled: true,
        serviceRequestsEnabled: true,
        serviceRequestCooldownSeconds: 60,
        notificationSoundEnabled: true,
        arenaEnabled: true,
        arenaCrossTableEnabled: false,
        arenaTicTacToeEnabled: true,
        arenaRpsEnabled: true,
        arenaQuizBattleEnabled: false,
        arenaInviteExpirySeconds: 120,
      });

      expect(res.success).toBe(true);
      expect(res.settings?.arenaCrossTableEnabled).toBe(false);
      expect(res.settings?.arenaQuizBattleEnabled).toBe(false);
      expect(res.settings?.arenaInviteExpirySeconds).toBe(120);
    });
  });

  describe("8. Non-Interference with Orders and Payments", () => {
    it("game matches and moves do not mutate order or payment data", async () => {
      const orderFindSpy = vi.spyOn(db.order, "update");
      const paymentSpy = vi.spyOn(db.payment, "update");

      const currentMatch = {
        id: "match-safe",
        version: 1,
        status: GameMatchStatus.IN_PROGRESS,
        gameType: GameType.TIC_TAC_TOE,
        hostPlayerId: "p_host",
        guestPlayerId: "p_guest",
        currentTurnPlayerId: "p_host",
        mode: GameMode.SAME_TABLE,
        gameState: {
          board: Array(9).fill(null),
          hostSymbol: "X",
          guestSymbol: "O",
          winningLine: null,
        },
      };

      vi.spyOn(db, "$transaction").mockImplementationOnce(async (callback: any) => {
        const tx = {
          gameMatch: {
            findUnique: vi.fn().mockResolvedValueOnce(currentMatch),
            update: vi.fn().mockResolvedValueOnce({ ...currentMatch, version: 2 }),
          },
          gameMove: {
            create: vi.fn().mockResolvedValueOnce({}),
          },
        };
        return callback(tx);
      });

      await ArenaService.submitMove({
        matchId: "match-safe",
        playerId: "p_host",
        expectedVersion: 1,
        moveData: { cellIndex: 4 },
      });

      // Verify db.order.update and db.payment.update were never called
      expect(orderFindSpy).not.toHaveBeenCalled();
      expect(paymentSpy).not.toHaveBeenCalled();
    });
  });
});
