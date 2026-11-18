"use client";

import { SanitizedMatchData, TicTacToeState } from "@/lib/arena/types";
import { Button } from "@/components/ui/button";
import { Trophy, RefreshCw } from "lucide-react";

interface TicTacToeGameProps {
  match: SanitizedMatchData;
  onMove: (moveData: any) => Promise<void>;
  onForfeit: () => Promise<void>;
  onPlayAgain: () => void;
  isSubmittingMove: boolean;
}

export function TicTacToeGame({
  match,
  onMove,
  onForfeit,
  onPlayAgain,
  isSubmittingMove,
}: TicTacToeGameProps) {
  const gameState = match.gameState as TicTacToeState;
  const board = gameState.board || Array(9).fill(null);
  const isPassAndPlay = match.mode === "PASS_AND_PLAY";

  // For pass & play tracking
  const currentSymbol = isPassAndPlay
    ? match.currentTurnPlayerId === match.guestPlayerId
      ? "O"
      : "X"
    : match.isHost
    ? "X"
    : "O";

  const isMyTurn = isPassAndPlay ? true : match.isMyTurn;
  const isGameOver = match.status === "COMPLETED";

  const handleCellClick = async (cellIndex: number) => {
    if (board[cellIndex] !== null || isGameOver || isSubmittingMove || !isMyTurn) {
      return;
    }

    await onMove({
      cellIndex,
      passPlayerSymbol: isPassAndPlay ? currentSymbol : undefined,
    });
  };

  const getWinnerAnnouncement = () => {
    if (!isGameOver) return null;
    if (match.isDraw) return "It's a Draw! 🤝";
    if (isPassAndPlay) {
      return match.winnerPlayerId === match.hostPlayerId
        ? "Player 1 (X) Wins! 🏆"
        : "Player 2 (O) Wins! 🏆";
    }
    const didIWin = match.winnerPlayerId === match.myPlayerId;
    return didIWin ? "You Won! 🎉🏆" : `${match.opponentPlayerName} Won! 👏`;
  };

  return (
    <div className="flex flex-col items-center space-y-4 w-full max-w-sm mx-auto">
      {/* Player Headers */}
      <div className="grid grid-cols-2 gap-2 w-full">
        {/* Host (X) */}
        <div
          className={`p-3 rounded-2xl border transition-all text-center flex flex-col items-center justify-center space-y-1 ${
            (isPassAndPlay ? currentSymbol === "X" : match.isHost && match.isMyTurn) && !isGameOver
              ? "bg-amber-500/15 border-amber-500 ring-2 ring-amber-500/30"
              : "bg-zinc-50 border-zinc-200"
          }`}
        >
          <div className="flex items-center gap-1.5 font-bold text-xs text-zinc-900 truncate">
            <span className="w-5 h-5 rounded-lg bg-amber-600 text-white font-black flex items-center justify-center text-[10px] shrink-0">
              X
            </span>
            <span className="truncate">
              {isPassAndPlay ? "Player 1" : match.isHost ? "You" : match.hostPlayerName}
            </span>
          </div>
          <span className="text-[10px] text-zinc-400 font-medium">Table {match.hostTableNumber}</span>
        </div>

        {/* Guest (O) */}
        <div
          className={`p-3 rounded-2xl border transition-all text-center flex flex-col items-center justify-center space-y-1 ${
            (isPassAndPlay ? currentSymbol === "O" : !match.isHost && match.isMyTurn) && !isGameOver
              ? "bg-emerald-500/15 border-emerald-500 ring-2 ring-emerald-500/30"
              : "bg-zinc-50 border-zinc-200"
          }`}
        >
          <div className="flex items-center gap-1.5 font-bold text-xs text-zinc-900 truncate">
            <span className="w-5 h-5 rounded-lg bg-emerald-600 text-white font-black flex items-center justify-center text-[10px] shrink-0">
              O
            </span>
            <span className="truncate">
              {isPassAndPlay ? "Player 2" : !match.isHost ? "You" : match.guestPlayerName || "Guest"}
            </span>
          </div>
          <span className="text-[10px] text-zinc-400 font-medium">
            {match.guestTableNumber ? `Table ${match.guestTableNumber}` : "Same Table"}
          </span>
        </div>
      </div>

      {/* Turn or Status Banner */}
      <div className="w-full text-center">
        {!isGameOver ? (
          <div
            className={`py-2 px-4 rounded-xl text-xs font-black inline-flex items-center gap-2 ${
              isMyTurn
                ? "bg-amber-100 text-amber-900 animate-pulse"
                : "bg-zinc-100 text-zinc-600"
            }`}
          >
            {isPassAndPlay ? (
              <span>Pass phone to {currentSymbol === "X" ? "Player 1 (X)" : "Player 2 (O)"}</span>
            ) : isMyTurn ? (
              <span>Your Turn! Pick an empty square</span>
            ) : (
              <span>Waiting for {match.opponentPlayerName}...</span>
            )}
          </div>
        ) : (
          <div className="py-2.5 px-4 rounded-xl bg-zinc-900 text-white text-sm font-black flex items-center justify-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>{getWinnerAnnouncement()}</span>
          </div>
        )}
      </div>

      {/* 3x3 Grid Board */}
      <div className="grid grid-cols-3 gap-2 p-3 bg-zinc-100 rounded-3xl border border-zinc-200/80 shadow-inner w-full aspect-square max-w-[280px]">
        {board.map((cell, idx) => {
          const isWinningCell = gameState.winningLine?.includes(idx);
          return (
            <button
              key={idx}
              onClick={() => handleCellClick(idx)}
              disabled={cell !== null || isGameOver || isSubmittingMove || !isMyTurn}
              className={`rounded-2xl flex items-center justify-center text-3xl font-black transition-all active:scale-95 shadow-xs ${
                isWinningCell
                  ? "bg-amber-500 text-white animate-bounce"
                  : cell === "X"
                  ? "bg-white text-amber-600 border border-amber-200"
                  : cell === "O"
                  ? "bg-white text-emerald-600 border border-emerald-200"
                  : isMyTurn && !isGameOver
                  ? "bg-white hover:bg-zinc-50 border border-dashed border-zinc-300 cursor-pointer"
                  : "bg-zinc-50/50 border border-transparent cursor-not-allowed"
              }`}
            >
              {cell === "X" && "✕"}
              {cell === "O" && "◯"}
            </button>
          );
        })}
      </div>

      {/* Bottom Actions */}
      <div className="flex items-center justify-center gap-2 w-full pt-2">
        {isGameOver ? (
          <>
            <Button
              onClick={onPlayAgain}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-10 px-5 rounded-xl shadow-xs gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Play Again
            </Button>
            <Button
              variant="outline"
              onClick={onForfeit}
              className="text-zinc-600 font-bold text-xs h-10 px-4 rounded-xl border-zinc-200"
            >
              Exit Arena
            </Button>
          </>
        ) : (
          <Button
            variant="ghost"
            onClick={onForfeit}
            className="text-zinc-400 hover:text-red-600 hover:bg-red-50 text-xs font-semibold h-8 px-3 rounded-lg"
          >
            Leave Match
          </Button>
        )}
      </div>
    </div>
  );
}
