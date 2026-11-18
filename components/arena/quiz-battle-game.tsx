"use client";

import { useState } from "react";
import { SanitizedMatchData, QuizBattleState } from "@/lib/arena/types";
import { Button } from "@/components/ui/button";
import { Trophy, RefreshCw, CheckCircle2, HelpCircle } from "lucide-react";

interface QuizBattleGameProps {
  match: SanitizedMatchData;
  onMove: (moveData: any) => Promise<void>;
  onForfeit: () => Promise<void>;
  onPlayAgain: () => void;
  isSubmittingMove: boolean;
}

export function QuizBattleGame({
  match,
  onMove,
  onForfeit,
  onPlayAgain,
  isSubmittingMove,
}: QuizBattleGameProps) {
  const gameState = match.gameState as QuizBattleState;
  const isPassAndPlay = match.mode === "PASS_AND_PLAY";
  const isGameOver = match.status === "COMPLETED";

  const currentQ = gameState.questions?.[gameState.currentQuestionIndex];
  const totalQ = gameState.totalQuestions || 5;

  // In Pass and Play: 1 = P1 turn, 2 = P2 turn
  const [passPlayerStep, setPassPlayerStep] = useState<1 | 2>(1);
  const [p1AnswerLocal, setP1AnswerLocal] = useState<number | null>(null);

  const myAnswer = match.isHost ? gameState.hostAnswer : gameState.guestAnswer;
  const hasMyAnswer = myAnswer !== null && myAnswer !== undefined;
  const hasOpponentAnswered = Boolean(
    match.isHost
      ? (gameState as any).hasGuestAnswered || gameState.guestAnswer !== null
      : (gameState as any).hasHostAnswered || gameState.hostAnswer !== null
  );

  const handleSelectAnswer = async (answerIndex: number) => {
    if (isGameOver || isSubmittingMove) return;

    if (isPassAndPlay) {
      if (passPlayerStep === 1) {
        setP1AnswerLocal(answerIndex);
        setPassPlayerStep(2);
      } else {
        await onMove({
          answerIndex,
          passPlayer: 2,
        });
        setP1AnswerLocal(null);
        setPassPlayerStep(1);
      }
      return;
    }

    if (hasMyAnswer) return;

    await onMove({ answerIndex });
  };

  const getWinnerAnnouncement = () => {
    if (!isGameOver) return null;
    if (match.isDraw) return "It's a Tie! Both players tied in Quiz Battle! 🤝";
    if (isPassAndPlay) {
      return match.winnerPlayerId === match.hostPlayerId
        ? "Player 1 Wins the Quiz! 🏆"
        : "Player 2 Wins the Quiz! 🏆";
    }
    const didIWin = match.winnerPlayerId === match.myPlayerId;
    return didIWin ? "Victory! You Won the Quiz Battle! 🎉🏆" : `${match.opponentPlayerName} Won the Quiz! 👏`;
  };

  // Latest round result
  const latestResult =
    gameState.roundResults && gameState.roundResults.length > 0
      ? gameState.roundResults[gameState.roundResults.length - 1]
      : null;

  return (
    <div className="flex flex-col items-center space-y-4 w-full max-w-sm mx-auto">
      {/* Score Header */}
      <div className="grid grid-cols-2 gap-2 w-full">
        {/* Host Score */}
        <div
          className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center space-y-0.5 ${
            match.isHost ? "bg-amber-50/70 border-amber-200" : "bg-zinc-50 border-zinc-200"
          }`}
        >
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider truncate">
            {isPassAndPlay ? "Player 1" : match.isHost ? "You" : match.hostPlayerName}
          </span>
          <span className="font-black text-xl text-amber-600">
            {gameState.hostScore} pts
          </span>
        </div>

        {/* Guest Score */}
        <div
          className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center space-y-0.5 ${
            !match.isHost ? "bg-indigo-50/70 border-indigo-200" : "bg-zinc-50 border-zinc-200"
          }`}
        >
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider truncate">
            {isPassAndPlay ? "Player 2" : !match.isHost ? "You" : match.guestPlayerName || "Guest"}
          </span>
          <span className="font-black text-xl text-indigo-600">
            {gameState.guestScore} pts
          </span>
        </div>
      </div>

      {/* Question Counter / Winner Banner */}
      <div className="w-full text-center">
        {!isGameOver ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 text-zinc-700 text-xs font-black">
            <HelpCircle className="w-3.5 h-3.5 text-violet-600" />
            <span>
              Question {gameState.currentQuestionIndex + 1} of {totalQ}
            </span>
          </div>
        ) : (
          <div className="py-2.5 px-4 rounded-xl bg-zinc-900 text-white text-sm font-black flex items-center justify-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>{getWinnerAnnouncement()}</span>
          </div>
        )}
      </div>

      {/* Active Question Box */}
      {!isGameOver && currentQ && (
        <div className="w-full space-y-3">
          <div className="bg-white border border-zinc-200/90 rounded-2xl p-4 shadow-xs text-center space-y-1">
            <h4 className="font-black text-xs text-zinc-900 leading-snug">
              {currentQ.question}
            </h4>
          </div>

          {/* Turn Prompt */}
          <div className="text-center text-[11px] font-bold">
            {isPassAndPlay ? (
              <span className="text-zinc-600">
                {passPlayerStep === 1
                  ? "Player 1: Select your answer"
                  : "Player 2: Select your answer"}
              </span>
            ) : hasMyAnswer ? (
              <span className="text-amber-700 animate-pulse">
                Answer submitted! Waiting for {match.opponentPlayerName}...
              </span>
            ) : hasOpponentAnswered ? (
              <span className="text-emerald-700 animate-pulse">
                {match.opponentPlayerName} answered! Make your pick!
              </span>
            ) : (
              <span className="text-zinc-500">Choose the correct answer:</span>
            )}
          </div>

          {/* 4 Options */}
          <div className="space-y-2">
            {currentQ.options.map((opt, idx) => {
              const isSelected =
                (!isPassAndPlay && myAnswer === idx) ||
                (isPassAndPlay && passPlayerStep === 2 && p1AnswerLocal === idx);

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectAnswer(idx)}
                  disabled={hasMyAnswer || isSubmittingMove}
                  className={`w-full p-3 rounded-xl border text-left text-xs font-bold transition-all active:scale-95 flex items-center justify-between ${
                    isSelected
                      ? "bg-violet-600 text-white border-violet-700 shadow-xs ring-2 ring-violet-400"
                      : hasMyAnswer
                      ? "bg-zinc-50 border-zinc-200 text-zinc-400 cursor-not-allowed"
                      : "bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-800 hover:border-violet-300"
                  }`}
                >
                  <span className="flex-1 pr-2">{opt}</span>
                  <span
                    className={`w-5 h-5 rounded-md text-[10px] font-black flex items-center justify-center shrink-0 ${
                      isSelected ? "bg-white text-violet-700" : "bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    {String.fromCharCode(65 + idx)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Previous Round Feedback Explanation */}
      {latestResult && !isGameOver && (
        <div className="w-full bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3 text-[11px] space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-emerald-900">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Last Question Result:</span>
          </div>
          <div className="text-emerald-800 text-[10px]">
            Correct: Option {String.fromCharCode(65 + latestResult.correctIndex)}.{" "}
            {isPassAndPlay
              ? `P1 ${latestResult.hostGotPoint ? "✓ (+100)" : "✗"} • P2 ${latestResult.guestGotPoint ? "✓ (+100)" : "✗"}`
              : `You ${match.isHost ? (latestResult.hostGotPoint ? "✓" : "✗") : (latestResult.guestGotPoint ? "✓" : "✗")} • Opponent ${match.isHost ? (latestResult.guestGotPoint ? "✓" : "✗") : (latestResult.hostGotPoint ? "✓" : "✗")}`}
          </div>
        </div>
      )}

      {/* Bottom Actions */}
      <div className="flex items-center justify-center gap-2 w-full pt-2">
        {isGameOver ? (
          <>
            <Button
              onClick={onPlayAgain}
              className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs h-10 px-5 rounded-xl shadow-xs gap-1.5"
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
