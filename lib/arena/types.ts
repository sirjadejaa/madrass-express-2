import { GameType, GameMatchStatus, GameMode } from "@prisma/client";

export interface TicTacToeState {
  board: (string | null)[]; // 9 cells: 'X' | 'O' | null
  hostSymbol: "X";
  guestSymbol: "O";
  winningLine: number[] | null;
}

export type RpsChoice = "ROCK" | "PAPER" | "SCISSORS";

export interface RpsRoundHistory {
  round: number;
  hostChoice: RpsChoice;
  guestChoice: RpsChoice;
  winner: "host" | "guest" | "draw";
}

export interface RpsState {
  round: number;
  targetWins: number; // default 2 (Best of 3)
  hostScore: number;
  guestScore: number;
  hostChoice: RpsChoice | null;
  guestChoice: RpsChoice | null;
  roundWinner: "host" | "guest" | "draw" | null;
  history: RpsRoundHistory[];
}

export interface QuizBattleQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export interface QuizBattleRoundResult {
  questionIndex: number;
  hostAnswer: number | null;
  guestAnswer: number | null;
  correctIndex: number;
  hostGotPoint: boolean;
  guestGotPoint: boolean;
}

export interface QuizBattleState {
  currentQuestionIndex: number;
  totalQuestions: number;
  questions: QuizBattleQuestion[];
  hostAnswer: number | null;
  guestAnswer: number | null;
  hostScore: number;
  guestScore: number;
  questionRevealed: boolean;
  roundResults: QuizBattleRoundResult[];
}

export type ArenaGameState = TicTacToeState | RpsState | QuizBattleState;

export interface SanitizedMatchData {
  id: string;
  gameType: GameType;
  mode: GameMode;
  status: GameMatchStatus;
  hostPlayerId: string;
  guestPlayerId: string | null;
  hostTableNumber: string;
  hostPlayerName: string;
  guestTableNumber: string | null;
  guestPlayerName: string | null;
  isHost: boolean;
  isMyTurn: boolean;
  currentTurnPlayerId: string | null;
  winnerPlayerId: string | null;
  isDraw: boolean;
  version: number;
  inviteCode: string | null;
  expiresAt: string;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  gameState: any; // Sanitized for the requesting player
  myPlayerId: string;
  opponentPlayerName: string;
  opponentTableNumber: string | null;
}
