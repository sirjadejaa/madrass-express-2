"use client";

import { useState } from "react";
import { SanitizedMatchData, RpsState, RpsChoice } from "@/lib/arena/types";
import { Button } from "@/components/ui/button";
import { Trophy, RefreshCw, Flame } from "lucide-react";

interface RpsGameProps {
  match: SanitizedMatchData;
  onMove: (moveData: any) => Promise<void>;
  onForfeit: () => Promise<void>;
  onPlayAgain: () => void;
  isSubmittingMove: boolean;
}

const CHOICES: { id: RpsChoice; label: string; icon: string; beats: string }[] = [
  { id: "ROCK", label: "Rock", icon: "✊", beats: "Scissors" },
  { id: "PAPER", label: "Paper", icon: "✋", beats: "Rock" },
  { id: "SCISSORS", label: "Scissors", icon: "✌️", beats: "Paper" },
];

export function RpsGame({
  match,
  onMove,
  onForfeit,
  onPlayAgain,
  isSubmittingMove,
}: RpsGameProps) {
  const gameState = match.gameState as RpsState;
  const isPassAndPlay = match.mode === "PASS_AND_PLAY";
  const isGameOver = match.status === "COMPLETED";

  // In Pass and Play: 1 = P1 turn, 2 = P2 turn, 3 = reveal
  const [passPlayerStep, setPassPlayerStep] = useState<1 | 2>(1);
  const [p1ChoiceLocal, setP1ChoiceLocal] = useState<RpsChoice | null>(null);

  const myChoice = match.isHost ? gameState.hostChoice : gameState.guestChoice;
  const hasMyChoice = Boolean(myChoice);
  const hasOpponentChosen = Boolean(
    match.isHost ? (gameState as any).hasGuestChosen || gameState.guestChoice : (gameState as any).hasHostChosen || gameState.hostChoice
  );

  const handleSelectChoice = async (choice: RpsChoice) => {
    if (isGameOver || isSubmittingMove) return;

    if (isPassAndPlay) {
      if (passPlayerStep === 1) {
        setP1ChoiceLocal(choice);
        setPassPlayerStep(2);
      } else {
        // Both picked locally, submit both in one turn or sequential
        await onMove({
          choice,
          passPlayer: 2,
        });
        // reset local
        setP1ChoiceLocal(null);
        setPassPlayerStep(1);
      }
      return;
    }

    if (hasMyChoice) return;

    await onMove({ choice });
  };

  const getWinnerAnnouncement = () => {
    if (!isGameOver) return null;
    if (isPassAndPlay) {
      return match.winnerPlayerId === match.hostPlayerId
        ? "Player 1 Wins the Match! 🏆"
        : "Player 2 Wins the Match! 🏆";
    }
    const didIWin = match.winnerPlayerId === match.myPlayerId;
    return didIWin ? "Victory! You Won the Match! 🎉🏆" : `${match.opponentPlayerName} Won the Match! 👏`;
  };

  // Last completed round for display
  const latestRoundHistory =
    gameState.history && gameState.history.length > 0
      ? gameState.history[gameState.history.length - 1]
      : null;

  return (
    <div className="flex flex-col items-center space-y-4 w-full max-w-sm mx-auto">
      {/* Score Tracker Banner */}
      <div className="grid grid-cols-2 gap-2 w-full">
        {/* Host Card */}
        <div
          className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center space-y-1 ${
            match.isHost ? "bg-amber-50/60 border-amber-200" : "bg-zinc-50 border-zinc-200"
          }`}
        >
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
            {isPassAndPlay ? "Player 1" : match.isHost ? "You" : match.hostPlayerName}
          </span>
          <div className="flex items-center gap-1 font-black text-2xl text-amber-600">
            {gameState.hostScore}
          </div>
          <div className="flex gap-1">
            {Array.from({ length: gameState.targetWins || 2 }).map((_, i) => (
              <span
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i < gameState.hostScore ? "bg-amber-500" : "bg-zinc-200"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Guest Card */}
        <div
          className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center space-y-1 ${
            !match.isHost ? "bg-indigo-50/60 border-indigo-200" : "bg-zinc-50 border-zinc-200"
          }`}
        >
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
            {isPassAndPlay ? "Player 2" : !match.isHost ? "You" : match.guestPlayerName || "Guest"}
          </span>
          <div className="flex items-center gap-1 font-black text-2xl text-indigo-600">
            {gameState.guestScore}
          </div>
          <div className="flex gap-1">
            {Array.from({ length: gameState.targetWins || 2 }).map((_, i) => (
              <span
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i < gameState.guestScore ? "bg-indigo-500" : "bg-zinc-200"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Round & Target Banner */}
      <div className="w-full text-center">
        {!isGameOver ? (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-zinc-100 text-zinc-700 text-xs font-black">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>
              Round {gameState.round} &bull; First to {gameState.targetWins || 2} Wins
            </span>
          </div>
        ) : (
          <div className="py-2.5 px-4 rounded-xl bg-zinc-900 text-white text-sm font-black flex items-center justify-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>{getWinnerAnnouncement()}</span>
          </div>
        )}
      </div>

      {/* Latest Completed Round Reveal Card */}
      {latestRoundHistory && (
        <div className="w-full bg-zinc-50 border border-zinc-200/80 rounded-2xl p-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-xl">
              {latestRoundHistory.hostChoice === "ROCK" && "✊"}
              {latestRoundHistory.hostChoice === "PAPER" && "✋"}
              {latestRoundHistory.hostChoice === "SCISSORS" && "✌️"}
            </span>
            <span className="font-bold text-zinc-600">vs</span>
            <span className="text-xl">
              {latestRoundHistory.guestChoice === "ROCK" && "✊"}
              {latestRoundHistory.guestChoice === "PAPER" && "✋"}
              {latestRoundHistory.guestChoice === "SCISSORS" && "✌️"}
            </span>
          </div>

          <div className="text-[11px] font-black">
            {latestRoundHistory.winner === "draw" ? (
              <span className="text-zinc-500">Round {latestRoundHistory.round}: Draw</span>
            ) : (
              <span className="text-amber-700">
                Round {latestRoundHistory.round}: {latestRoundHistory.winner === "host" ? (isPassAndPlay ? "P1" : match.hostPlayerName) : (isPassAndPlay ? "P2" : match.guestPlayerName || "Guest")} Won!
              </span>
            )}
          </div>
        </div>
      )}

      {/* Interactive Selection Buttons */}
      {!isGameOver && (
        <div className="w-full space-y-2">
          {/* Status Message */}
          <div className="text-center">
            {isPassAndPlay ? (
              <p className="text-xs font-bold text-zinc-700">
                {passPlayerStep === 1
                  ? "Player 1: Secretly choose your throw"
                  : "Now hand to Player 2: Choose your throw"}
              </p>
            ) : hasMyChoice ? (
              <p className="text-xs font-bold text-amber-700 animate-pulse">
                Throw submitted! Waiting for {match.opponentPlayerName}...
              </p>
            ) : hasOpponentChosen ? (
              <p className="text-xs font-bold text-emerald-700 animate-pulse">
                {match.opponentPlayerName} has thrown! Make your move!
              </p>
            ) : (
              <p className="text-xs font-bold text-zinc-600">
                Choose your throw for Round {gameState.round}:
              </p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2.5 pt-1">
            {CHOICES.map((item) => {
              const isSelected =
                (!isPassAndPlay && myChoice === item.id) ||
                (isPassAndPlay && passPlayerStep === 2 && p1ChoiceLocal === item.id);

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectChoice(item.id)}
                  disabled={hasMyChoice || isSubmittingMove}
                  className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 shadow-xs ${
                    isSelected
                      ? "bg-amber-500 text-white border-amber-600 ring-4 ring-amber-500/20"
                      : hasMyChoice
                      ? "bg-zinc-50 border-zinc-200 text-zinc-300 cursor-not-allowed"
                      : "bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-800 cursor-pointer hover:border-amber-400"
                  }`}
                >
                  <span className="text-3xl">{item.icon}</span>
                  <span className="font-extrabold text-xs">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

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
