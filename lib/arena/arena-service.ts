import { db } from "@/lib/db";
import { GameType, GameMatchStatus, GameMode, OrderStatus } from "@prisma/client";
import {
  TicTacToeState,
  RpsState,
  RpsChoice,
  QuizBattleState,
  QuizBattleQuestion,
  SanitizedMatchData,
} from "./types";
import { DEFAULT_QUIZ_BATTLE_QUESTIONS } from "./default-questions";

// Generate a clean 6-character code avoiding ambiguous characters (I, O, 0, 1)
function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

const TTT_WINNING_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export class ArenaService {
  /**
   * Creates a new multiplayer game match.
   */
  static async createMatch(params: {
    restaurantId: string;
    hostTableId: string;
    hostPlayerId: string;
    hostPlayerName?: string;
    gameType: GameType;
    mode: GameMode;
    guestTableId?: string;
    expirySeconds?: number;
  }) {
    const expirySeconds = params.expirySeconds || 180;
    const expiresAt = new Date(Date.now() + expirySeconds * 1000);

    let initialGameState: any;

    if (params.gameType === GameType.TIC_TAC_TOE) {
      const state: TicTacToeState = {
        board: Array(9).fill(null),
        hostSymbol: "X",
        guestSymbol: "O",
        winningLine: null,
      };
      initialGameState = state;
    } else if (params.gameType === GameType.ROCK_PAPER_SCISSORS) {
      const state: RpsState = {
        round: 1,
        targetWins: 2, // Best of 3
        hostScore: 0,
        guestScore: 0,
        hostChoice: null,
        guestChoice: null,
        roundWinner: null,
        history: [],
      };
      initialGameState = state;
    } else if (params.gameType === GameType.QUIZ_BATTLE) {
      // Pick 5 questions from DB or fallback
      let questions: QuizBattleQuestion[] = [];
      if (db.quizQuestion?.findMany) {
        try {
          const dbQuestions = await db.quizQuestion.findMany({
            where: { restaurantId: params.restaurantId, isActive: true },
            take: 10,
          });
          if (dbQuestions && dbQuestions.length >= 3) {
            questions = dbQuestions
              .sort(() => 0.5 - Math.random())
              .slice(0, 5)
              .map((q) => ({
                id: q.id,
                question: q.question,
                options: q.options as string[],
                correctIndex: q.correctIndex,
                explanation: q.explanation || undefined,
              }));
          }
        } catch {
          // Fallback to default questions
        }
      }

      if (questions.length === 0) {
        questions = [...DEFAULT_QUIZ_BATTLE_QUESTIONS]
          .sort(() => 0.5 - Math.random())
          .slice(0, 5);
      }

      const state: QuizBattleState = {
        currentQuestionIndex: 0,
        totalQuestions: questions.length,
        questions,
        hostAnswer: null,
        guestAnswer: null,
        hostScore: 0,
        guestScore: 0,
        questionRevealed: false,
        roundResults: [],
      };
      initialGameState = state;
    }

    // For PASS_AND_PLAY mode, match is immediately ready/in-progress on the same device
    const isPassAndPlay = params.mode === GameMode.PASS_AND_PLAY;
    const initialStatus = isPassAndPlay
      ? GameMatchStatus.IN_PROGRESS
      : params.mode === GameMode.CROSS_TABLE
      ? GameMatchStatus.INVITED
      : GameMatchStatus.WAITING_FOR_PLAYER;

    const guestPlayerId = isPassAndPlay ? `${params.hostPlayerId}_p2` : null;
    const guestPlayerName = isPassAndPlay ? "Player 2" : null;

    const match = await db.gameMatch.create({
      data: {
        restaurantId: params.restaurantId,
        hostTableId: params.hostTableId,
        hostPlayerId: params.hostPlayerId,
        hostPlayerName: params.hostPlayerName || "Player 1",
        guestTableId: params.guestTableId || (isPassAndPlay ? params.hostTableId : null),
        guestPlayerId,
        guestPlayerName,
        gameType: params.gameType,
        mode: params.mode,
        status: initialStatus,
        currentTurnPlayerId: params.gameType === GameType.TIC_TAC_TOE ? params.hostPlayerId : null,
        version: 1,
        gameState: initialGameState,
        inviteCode: isPassAndPlay ? null : generateInviteCode(),
        expiresAt,
        startedAt: isPassAndPlay ? new Date() : null,
      },
      include: {
        hostTable: { select: { number: true } },
        guestTable: { select: { number: true } },
      },
    });

    return match;
  }

  /**
   * Joins an existing game match via invite code or match ID.
   */
  static async joinMatch(params: {
    restaurantId: string;
    guestTableId: string;
    guestPlayerId: string;
    guestPlayerName?: string;
    inviteCode?: string;
    matchId?: string;
  }) {
    const whereClause: any = { restaurantId: params.restaurantId };
    if (params.matchId) {
      whereClause.id = params.matchId;
    } else if (params.inviteCode) {
      whereClause.inviteCode = params.inviteCode.toUpperCase().trim();
    } else {
      throw new Error("Match ID or invite code is required to join a match.");
    }

    const match = await db.gameMatch.findFirst({
      where: whereClause,
      include: {
        hostTable: { select: { number: true } },
        guestTable: { select: { number: true } },
      },
    });

    if (!match) {
      throw new Error("Match not found or invalid invite code.");
    }

    // Check expiry
    if (new Date() > match.expiresAt && match.status !== GameMatchStatus.IN_PROGRESS && match.status !== GameMatchStatus.COMPLETED) {
      await db.gameMatch.update({
        where: { id: match.id },
        data: { status: GameMatchStatus.EXPIRED },
      });
      throw new Error("This game invitation has expired.");
    }

    // Validate mode constraints
    if (match.mode === GameMode.SAME_TABLE && match.hostTableId !== params.guestTableId) {
      throw new Error("This game is set for same-table multiplayer. Both players must be at the same table.");
    }

    if (match.mode === GameMode.CROSS_TABLE && match.guestTableId && match.guestTableId !== params.guestTableId) {
      throw new Error("This challenge was sent to a different table.");
    }

    // Ensure match is open to join
    if (match.status !== GameMatchStatus.WAITING_FOR_PLAYER && match.status !== GameMatchStatus.INVITED) {
      if (match.guestPlayerId === params.guestPlayerId) {
        // Player is rejoining their own match
        return match;
      }
      throw new Error("This match is no longer open for new players.");
    }

    // Prevent host from joining as guest (unless rejoining)
    if (match.hostPlayerId === params.guestPlayerId) {
      return match;
    }

    const updated = await db.gameMatch.update({
      where: { id: match.id },
      data: {
        guestPlayerId: params.guestPlayerId,
        guestPlayerName: params.guestPlayerName || "Player 2",
        guestTableId: params.guestTableId,
        status: GameMatchStatus.IN_PROGRESS,
        startedAt: new Date(),
        version: { increment: 1 },
      },
      include: {
        hostTable: { select: { number: true } },
        guestTable: { select: { number: true } },
      },
    });

    return updated;
  }

  /**
   * Submits a move with optimistic concurrency control.
   */
  static async submitMove(params: {
    matchId: string;
    playerId: string;
    expectedVersion: number;
    moveData: any;
  }) {
    return await db.$transaction(async (tx) => {
      const match = await tx.gameMatch.findUnique({
        where: { id: params.matchId },
        include: {
          hostTable: { select: { number: true } },
          guestTable: { select: { number: true } },
        },
      });

      if (!match) {
        throw new Error("Game match not found.");
      }

      if (match.status !== GameMatchStatus.IN_PROGRESS) {
        throw new Error(`Match is not in progress (Current status: ${match.status}).`);
      }

      // Optimistic Concurrency Check
      if (match.version !== params.expectedVersion) {
        const error: any = new Error("Conflict: Game state has updated. Please refresh your move.");
        error.code = "VERSION_MISMATCH";
        error.currentVersion = match.version;
        throw error;
      }

      const isHost = match.hostPlayerId === params.playerId;
      const isGuest = match.guestPlayerId === params.playerId;
      const isPassAndPlay = match.mode === GameMode.PASS_AND_PLAY;

      if (!isHost && !isGuest && !isPassAndPlay) {
        throw new Error("Unauthorized: You are not a participant in this match.");
      }

      const updatedGameState: any = { ...(match.gameState as object) };
      let newStatus: GameMatchStatus = match.status;
      let newCurrentTurnPlayerId: string | null = match.currentTurnPlayerId;
      let winnerPlayerId: string | null = match.winnerPlayerId;
      let isDraw: boolean = match.isDraw;

      // -------------------------------------------------------------
      // 1. TIC-TAC-TOE MOVE PROCESSING
      // -------------------------------------------------------------
      if (match.gameType === GameType.TIC_TAC_TOE) {
        const tttState = updatedGameState as TicTacToeState;
        const cellIndex = Number(params.moveData.cellIndex);

        if (isNaN(cellIndex) || cellIndex < 0 || cellIndex > 8) {
          throw new Error("Invalid cell index. Must be between 0 and 8.");
        }

        if (tttState.board[cellIndex] !== null) {
          throw new Error("Cell is already occupied.");
        }

        // Validate turn
        if (!isPassAndPlay && match.currentTurnPlayerId !== params.playerId) {
          throw new Error("It is not your turn!");
        }

        // Determine who moved
        const movingPlayerSymbol = isPassAndPlay
          ? params.moveData.passPlayerSymbol || (match.currentTurnPlayerId === match.guestPlayerId ? "O" : "X")
          : isHost
          ? "X"
          : "O";

        tttState.board[cellIndex] = movingPlayerSymbol;

        // Check for win
        let hasWon = false;
        let winLine: number[] | null = null;

        for (const line of TTT_WINNING_LINES) {
          const [a, b, c] = line;
          if (
            tttState.board[a] &&
            tttState.board[a] === tttState.board[b] &&
            tttState.board[a] === tttState.board[c]
          ) {
            hasWon = true;
            winLine = line;
            break;
          }
        }

        if (hasWon) {
          tttState.winningLine = winLine;
          newStatus = GameMatchStatus.COMPLETED;
          winnerPlayerId = movingPlayerSymbol === "X" ? match.hostPlayerId : (match.guestPlayerId || match.hostPlayerId);
          newCurrentTurnPlayerId = null;
        } else if (tttState.board.every((cell) => cell !== null)) {
          // Draw
          newStatus = GameMatchStatus.COMPLETED;
          isDraw = true;
          newCurrentTurnPlayerId = null;
        } else {
          // Switch turn
          newCurrentTurnPlayerId =
            match.currentTurnPlayerId === match.hostPlayerId
              ? match.guestPlayerId || `${match.hostPlayerId}_p2`
              : match.hostPlayerId;
        }
      }

      // -------------------------------------------------------------
      // 2. ROCK PAPER SCISSORS MOVE PROCESSING
      // -------------------------------------------------------------
      else if (match.gameType === GameType.ROCK_PAPER_SCISSORS) {
        const rpsState = updatedGameState as RpsState;
        const choice = params.moveData.choice as RpsChoice;

        if (!["ROCK", "PAPER", "SCISSORS"].includes(choice)) {
          throw new Error("Invalid choice. Must be ROCK, PAPER, or SCISSORS.");
        }

        const isPlayer1 = isHost || (isPassAndPlay && params.moveData.passPlayer === 1);
        const isPlayer2 = isGuest || (isPassAndPlay && params.moveData.passPlayer === 2);

        if (isPlayer1) {
          if (rpsState.hostChoice !== null) {
            throw new Error("You have already made your choice for this round.");
          }
          rpsState.hostChoice = choice;
        } else if (isPlayer2) {
          if (rpsState.guestChoice !== null) {
            throw new Error("You have already made your choice for this round.");
          }
          rpsState.guestChoice = choice;
        }

        // When both players have picked, resolve the round!
        if (rpsState.hostChoice !== null && rpsState.guestChoice !== null) {
          const p1 = rpsState.hostChoice;
          const p2 = rpsState.guestChoice;
          let roundWin: "host" | "guest" | "draw" = "draw";

          if (p1 === p2) {
            roundWin = "draw";
          } else if (
            (p1 === "ROCK" && p2 === "SCISSORS") ||
            (p1 === "SCISSORS" && p2 === "PAPER") ||
            (p1 === "PAPER" && p2 === "ROCK")
          ) {
            roundWin = "host";
            rpsState.hostScore += 1;
          } else {
            roundWin = "guest";
            rpsState.guestScore += 1;
          }

          rpsState.roundWinner = roundWin;
          rpsState.history.push({
            round: rpsState.round,
            hostChoice: p1,
            guestChoice: p2,
            winner: roundWin,
          });

          // Check if game won
          const target = rpsState.targetWins || 2;
          if (rpsState.hostScore >= target) {
            newStatus = GameMatchStatus.COMPLETED;
            winnerPlayerId = match.hostPlayerId;
          } else if (rpsState.guestScore >= target) {
            newStatus = GameMatchStatus.COMPLETED;
            winnerPlayerId = match.guestPlayerId || match.hostPlayerId;
          } else {
            // Prepare next round
            rpsState.round += 1;
            rpsState.hostChoice = null;
            rpsState.guestChoice = null;
          }
        }
      }

      // -------------------------------------------------------------
      // 3. QUIZ BATTLE MOVE PROCESSING
      // -------------------------------------------------------------
      else if (match.gameType === GameType.QUIZ_BATTLE) {
        const quizState = updatedGameState as QuizBattleState;
        const answerIndex = Number(params.moveData.answerIndex);

        if (isNaN(answerIndex) || answerIndex < 0 || answerIndex > 3) {
          throw new Error("Invalid answer index. Must be between 0 and 3.");
        }

        const currentQ = quizState.questions[quizState.currentQuestionIndex];
        if (!currentQ) {
          throw new Error("No active question.");
        }

        const isPlayer1 = isHost || (isPassAndPlay && params.moveData.passPlayer === 1);
        const isPlayer2 = isGuest || (isPassAndPlay && params.moveData.passPlayer === 2);

        if (isPlayer1) {
          if (quizState.hostAnswer !== null) {
            throw new Error("You already submitted an answer for this question.");
          }
          quizState.hostAnswer = answerIndex;
        } else if (isPlayer2) {
          if (quizState.guestAnswer !== null) {
            throw new Error("You already submitted an answer for this question.");
          }
          quizState.guestAnswer = answerIndex;
        }

        // When both answered, evaluate the round
        if (quizState.hostAnswer !== null && quizState.guestAnswer !== null) {
          const hostCorrect = quizState.hostAnswer === currentQ.correctIndex;
          const guestCorrect = quizState.guestAnswer === currentQ.correctIndex;

          if (hostCorrect) quizState.hostScore += 100;
          if (guestCorrect) quizState.guestScore += 100;

          quizState.roundResults.push({
            questionIndex: quizState.currentQuestionIndex,
            hostAnswer: quizState.hostAnswer,
            guestAnswer: quizState.guestAnswer,
            correctIndex: currentQ.correctIndex,
            hostGotPoint: hostCorrect,
            guestGotPoint: guestCorrect,
          });

          // Check if all questions completed
          if (quizState.currentQuestionIndex + 1 >= quizState.totalQuestions) {
            newStatus = GameMatchStatus.COMPLETED;
            if (quizState.hostScore > quizState.guestScore) {
              winnerPlayerId = match.hostPlayerId;
            } else if (quizState.guestScore > quizState.hostScore) {
              winnerPlayerId = match.guestPlayerId || match.hostPlayerId;
            } else {
              isDraw = true;
            }
          } else {
            // Next question
            quizState.currentQuestionIndex += 1;
            quizState.hostAnswer = null;
            quizState.guestAnswer = null;
          }
        }
      }

      // Record Move History
      await tx.gameMove.create({
        data: {
          matchId: match.id,
          playerId: params.playerId,
          moveNumber: match.version,
          moveData: params.moveData,
        },
      });

      // Update Game Match
      const updatedMatch = await tx.gameMatch.update({
        where: { id: match.id },
        data: {
          gameState: updatedGameState,
          status: newStatus,
          currentTurnPlayerId: newCurrentTurnPlayerId,
          winnerPlayerId,
          isDraw,
          completedAt: newStatus === GameMatchStatus.COMPLETED ? new Date() : null,
          version: { increment: 1 },
        },
        include: {
          hostTable: { select: { number: true } },
          guestTable: { select: { number: true } },
        },
      });

      return updatedMatch;
    });
  }

  /**
   * Retrieves sanitized match data safe to display to the requesting player.
   */
  static sanitizeMatch(match: any, requestingPlayerId: string): SanitizedMatchData {
    const isHost = match.hostPlayerId === requestingPlayerId;
    const isGuest = match.guestPlayerId === requestingPlayerId;
    const isPassAndPlay = match.mode === GameMode.PASS_AND_PLAY;

    const rawState = match.gameState as any;
    const sanitizedState = { ...rawState };

    // Sanitize Rock Paper Scissors: Hide opponent's choice until both have picked!
    if (match.gameType === GameType.ROCK_PAPER_SCISSORS && !isPassAndPlay) {
      if (isHost && rawState.guestChoice !== null && rawState.hostChoice === null) {
        sanitizedState.hasGuestChosen = true;
        sanitizedState.guestChoice = null; // Hide secret throw
      }
      if (isGuest && rawState.hostChoice !== null && rawState.guestChoice === null) {
        sanitizedState.hasHostChosen = true;
        sanitizedState.hostChoice = null; // Hide secret throw
      }
    }

    // Sanitize Quiz Battle: Hide correctIndex of upcoming questions!
    if (match.gameType === GameType.QUIZ_BATTLE) {
      if (Array.isArray(rawState.questions)) {
        sanitizedState.questions = rawState.questions.map((q: any, idx: number) => {
          // Only show correctIndex if this question is in roundResults (i.e., already answered)
          const isAnswered = rawState.roundResults?.some((r: any) => r.questionIndex === idx);
          if (isAnswered || match.status === GameMatchStatus.COMPLETED) {
            return q;
          }
          const { correctIndex: _c, explanation: _e, ...safeQ } = q;
          return safeQ;
        });
      }
      // In two-player mode, hide opponent's pending answer for current question
      if (!isPassAndPlay) {
        if (isHost && rawState.guestAnswer !== null && rawState.hostAnswer === null) {
          sanitizedState.hasGuestAnswered = true;
          sanitizedState.guestAnswer = null;
        }
        if (isGuest && rawState.hostAnswer !== null && rawState.guestAnswer === null) {
          sanitizedState.hasHostAnswered = true;
          sanitizedState.hostAnswer = null;
        }
      }
    }

    const opponentPlayerName = isHost
      ? match.guestPlayerName || "Waiting for opponent..."
      : match.hostPlayerName || "Host";

    const opponentTableNumber = isHost
      ? match.guestTable?.number || null
      : match.hostTable?.number || null;

    const isMyTurn =
      match.gameType === GameType.TIC_TAC_TOE
        ? match.currentTurnPlayerId === requestingPlayerId || isPassAndPlay
        : true;

    return {
      id: match.id,
      gameType: match.gameType,
      mode: match.mode,
      status: match.status,
      hostPlayerId: match.hostPlayerId,
      guestPlayerId: match.guestPlayerId,
      hostTableNumber: match.hostTable?.number || "00",
      hostPlayerName: match.hostPlayerName,
      guestTableNumber: match.guestTable?.number || null,
      guestPlayerName: match.guestPlayerName,
      isHost,
      isMyTurn,
      currentTurnPlayerId: match.currentTurnPlayerId,
      winnerPlayerId: match.winnerPlayerId,
      isDraw: match.isDraw,
      version: match.version,
      inviteCode: match.inviteCode,
      expiresAt: match.expiresAt.toISOString(),
      createdAt: match.createdAt.toISOString(),
      startedAt: match.startedAt ? match.startedAt.toISOString() : null,
      completedAt: match.completedAt ? match.completedAt.toISOString() : null,
      gameState: sanitizedState,
      myPlayerId: requestingPlayerId,
      opponentPlayerName,
      opponentTableNumber,
    };
  }

  /**
   * Responds to an incoming table challenge (Accept or Decline).
   */
  static async respondToChallenge(params: {
    matchId: string;
    guestTableId: string;
    guestPlayerId: string;
    guestPlayerName?: string;
    accept: boolean;
  }) {
    const match = await db.gameMatch.findUnique({
      where: { id: params.matchId },
    });

    if (!match) {
      throw new Error("Challenge not found.");
    }

    if (match.guestTableId !== params.guestTableId) {
      throw new Error("This challenge was sent to another table.");
    }

    if (match.status !== GameMatchStatus.INVITED) {
      throw new Error(`Challenge is no longer pending (Status: ${match.status}).`);
    }

    if (new Date() > match.expiresAt) {
      await db.gameMatch.update({
        where: { id: match.id },
        data: { status: GameMatchStatus.EXPIRED },
      });
      throw new Error("Challenge has expired.");
    }

    if (params.accept) {
      return await db.gameMatch.update({
        where: { id: match.id },
        data: {
          guestPlayerId: params.guestPlayerId,
          guestPlayerName: params.guestPlayerName || "Challenger Table",
          status: GameMatchStatus.IN_PROGRESS,
          startedAt: new Date(),
          version: { increment: 1 },
        },
        include: {
          hostTable: { select: { number: true } },
          guestTable: { select: { number: true } },
        },
      });
    } else {
      return await db.gameMatch.update({
        where: { id: match.id },
        data: {
          status: GameMatchStatus.CANCELLED,
          version: { increment: 1 },
        },
        include: {
          hostTable: { select: { number: true } },
          guestTable: { select: { number: true } },
        },
      });
    }
  }

  /**
   * Cancels or forfeits a match.
   */
  static async forfeitOrCancelMatch(params: {
    matchId: string;
    playerId: string;
  }) {
    const match = await db.gameMatch.findUnique({
      where: { id: params.matchId },
    });

    if (!match) {
      throw new Error("Match not found.");
    }

    const isHost = match.hostPlayerId === params.playerId;
    const isGuest = match.guestPlayerId === params.playerId;

    if (!isHost && !isGuest && match.mode !== GameMode.PASS_AND_PLAY) {
      throw new Error("Unauthorized to forfeit this match.");
    }

    if (match.status === GameMatchStatus.WAITING_FOR_PLAYER || match.status === GameMatchStatus.INVITED) {
      return await db.gameMatch.update({
        where: { id: match.id },
        data: {
          status: GameMatchStatus.CANCELLED,
          version: { increment: 1 },
        },
      });
    }

    if (match.status === GameMatchStatus.IN_PROGRESS) {
      // Forfeiting awards win to opponent
      const winnerPlayerId = isHost ? match.guestPlayerId : match.hostPlayerId;
      return await db.gameMatch.update({
        where: { id: match.id },
        data: {
          status: GameMatchStatus.COMPLETED,
          winnerPlayerId,
          completedAt: new Date(),
          version: { increment: 1 },
        },
      });
    }

    return match;
  }

  /**
   * Lists eligible active dine-in tables for cross-table challenges.
   * Only returns tables with active orders in the same restaurant.
   */
  static async listEligibleTables(params: {
    restaurantId: string;
    currentTableId: string;
  }) {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    // Find tables that have active orders created recently
    const tables = await db.table.findMany({
      where: {
        restaurantId: params.restaurantId,
        isActive: true,
        id: { not: params.currentTableId },
        orders: {
          some: {
            createdAt: { gte: twoHoursAgo },
            status: {
              in: [
                OrderStatus.NEW,
                OrderStatus.ACCEPTED,
                OrderStatus.PREPARING,
                OrderStatus.READY,
              ],
            },
          },
        },
      },
      select: {
        id: true,
        number: true,
      },
      orderBy: { number: "asc" },
    });

    return tables.map((t) => ({
      id: t.id,
      number: t.number,
      label: `Table ${t.number}`,
    }));
  }
}
