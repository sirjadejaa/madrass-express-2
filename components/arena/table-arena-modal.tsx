"use client";

import { useState, useEffect, useRef } from "react";
import {
  createArenaMatchAction,
  joinArenaMatchAction,
  submitArenaMoveAction,
  forfeitArenaMatchAction,
  getEligibleTablesAction,
} from "@/app/m/order/[trackingToken]/arena-actions";
import { SanitizedMatchData } from "@/lib/arena/types";
import { GameType, GameMode } from "@prisma/client";
import { TicTacToeGame } from "./tic-tac-toe-game";
import { RpsGame } from "./rps-game";
import { QuizBattleGame } from "./quiz-battle-game";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  X,
  Swords,
  Users,
  Smartphone,
  Flame,
  Copy,
  Check,
  RefreshCw,
  Clock,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface TableArenaModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackingToken: string;
  tableNumber: string;
  arenaSettings: {
    enabled: boolean;
    crossTableEnabled: boolean;
    ticTacToeEnabled: boolean;
    rpsEnabled: boolean;
    quizBattleEnabled: boolean;
    inviteExpirySeconds: number;
  };
  initialMatch?: SanitizedMatchData | null;
}

type ModalView = "LOBBY" | "WAITING" | "GAME";

export function TableArenaModal({
  isOpen,
  onClose,
  trackingToken,
  tableNumber,
  arenaSettings,
  initialMatch = null,
}: TableArenaModalProps) {
  const { toast } = useToast();

  // Stable client Player ID per device session
  const [playerId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      let stored = localStorage.getItem("madrass_arena_pid");
      if (!stored) {
        stored = `p_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
        localStorage.setItem("madrass_arena_pid", stored);
      }
      return stored;
    }
    return `p_${Date.now()}`;
  });

  const [view, setView] = useState<ModalView>(initialMatch ? (initialMatch.status === "IN_PROGRESS" ? "GAME" : "WAITING") : "LOBBY");
  const [activeMatch, setActiveMatch] = useState<SanitizedMatchData | null>(initialMatch);

  // Lobby Configuration states
  const [selectedGame, setSelectedGame] = useState<GameType>(
    arenaSettings.ticTacToeEnabled
      ? GameType.TIC_TAC_TOE
      : arenaSettings.rpsEnabled
      ? GameType.ROCK_PAPER_SCISSORS
      : GameType.QUIZ_BATTLE
  );
  const [selectedMode, setSelectedMode] = useState<GameMode>(GameMode.SAME_TABLE);
  const [selectedTargetTableId, setSelectedTargetTableId] = useState<string>("");
  const [eligibleTables, setEligibleTables] = useState<Array<{ id: string; number: string; label: string }>>([]);
  const [isLoadingTables, setIsLoadingTables] = useState(false);

  // Join by code state
  const [joinCode, setJoinCode] = useState("");
  const [isJoiningWithCode, setIsJoiningWithCode] = useState(false);

  // Action loading states
  const [isCreatingMatch, setIsCreatingMatch] = useState(false);
  const [isSubmittingMove, setIsSubmittingMove] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Keep a ref of activeMatch for polling comparisons
  const activeMatchRef = useRef(activeMatch);
  activeMatchRef.current = activeMatch;

  // Initialize with initialMatch if provided
  useEffect(() => {
    if (initialMatch) {
      setActiveMatch(initialMatch);
      setView(initialMatch.status === "IN_PROGRESS" ? "GAME" : "WAITING");
    }
  }, [initialMatch]);

  // Fetch eligible active tables when switching to CROSS_TABLE mode
  useEffect(() => {
    if (selectedMode === GameMode.CROSS_TABLE && isOpen) {
      setIsLoadingTables(true);
      getEligibleTablesAction(trackingToken)
        .then((res) => {
          if (res.success && res.tables) {
            setEligibleTables(res.tables);
            if (res.tables.length > 0 && !selectedTargetTableId) {
              setSelectedTargetTableId(res.tables[0].id);
            }
          }
        })
        .finally(() => setIsLoadingTables(false));
    }
  }, [selectedMode, isOpen, trackingToken, selectedTargetTableId]);

  // Real-Time Polling Hook for active match synchronization
  useEffect(() => {
    if (!isOpen || !activeMatch?.id) return;

    // Do not poll if match is completed or cancelled
    if (activeMatch.status === "COMPLETED" || activeMatch.status === "CANCELLED" || activeMatch.status === "EXPIRED") {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const currentM = activeMatchRef.current;
        if (!currentM) return;

        const res = await fetch(
          `/api/arena/match/${currentM.id}?playerId=${playerId}&version=${currentM.version}`
        );
        if (!res.ok) return;

        const data = await res.json();
        if (data.success && !data.unchanged && data.match) {
          setActiveMatch(data.match);
          if (data.match.status === "IN_PROGRESS" && view === "WAITING") {
            setView("GAME");
            toast({
              title: "Opponent Joined! ⚔️",
              description: "Both players ready. The game has begun!",
            });
          } else if (data.match.status === "CANCELLED") {
            toast({
              title: "Match Cancelled",
              description: "The other table declined or left the match.",
              variant: "destructive",
            });
            setView("LOBBY");
          } else if (data.match.status === "EXPIRED") {
            toast({
              title: "Challenge Expired",
              description: "The invitation was not accepted in time.",
              variant: "destructive",
            });
            setView("LOBBY");
          }
        }
      } catch {
        // Silent catch for background poll
      }
    }, 850);

    return () => clearInterval(interval);
  }, [isOpen, activeMatch?.id, activeMatch?.status, playerId, view, toast]);

  // Create Match Handler
  const handleCreateMatch = async () => {
    setIsCreatingMatch(true);
    try {
      const res = await createArenaMatchAction({
        trackingToken,
        gameType: selectedGame,
        mode: selectedMode,
        playerId,
        playerName: `Table ${tableNumber}`,
        targetTableId: selectedMode === GameMode.CROSS_TABLE ? selectedTargetTableId : undefined,
      });

      if (res.error || !res.match) {
        toast({
          title: "Could not create match",
          description: res.error || "Please check your selection and try again.",
          variant: "destructive",
        });
        return;
      }

      setActiveMatch(res.match);
      if (res.match.mode === GameMode.PASS_AND_PLAY || res.match.status === "IN_PROGRESS") {
        setView("GAME");
      } else {
        setView("WAITING");
      }
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Failed to start game.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingMatch(false);
    }
  };

  // Join with 6-char Code Handler
  const handleJoinWithCode = async () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length < 4) {
      toast({
        title: "Invalid Code",
        description: "Please enter a valid 6-character game code.",
        variant: "destructive",
      });
      return;
    }

    setIsJoiningWithCode(true);
    try {
      const res = await joinArenaMatchAction({
        trackingToken,
        inviteCode: code,
        playerId,
        playerName: `Table ${tableNumber}`,
      });

      if (res.error || !res.match) {
        toast({
          title: "Cannot Join Match",
          description: res.error || "Match not found or already in progress.",
          variant: "destructive",
        });
        return;
      }

      setActiveMatch(res.match);
      setView("GAME");
      toast({
        title: "Joined Match! ⚔️",
        description: `Connected to game at Table ${res.match.hostTableNumber}.`,
      });
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Failed to join game.",
        variant: "destructive",
      });
    } finally {
      setIsJoiningWithCode(false);
    }
  };

  // Move Submission Handler
  const handleMove = async (moveData: any) => {
    if (!activeMatch) return;
    setIsSubmittingMove(true);

    try {
      const res = await submitArenaMoveAction({
        matchId: activeMatch.id,
        playerId,
        expectedVersion: activeMatch.version,
        moveData,
      });

      if (res.error) {
        if (res.code === "VERSION_MISMATCH") {
          toast({
            title: "Re-syncing move...",
            description: "The game state was updated. Please repeat your move.",
          });
          // Immediate re-fetch latest state
          const syncRes = await fetch(
            `/api/arena/match/${activeMatch.id}?playerId=${playerId}`
          );
          if (syncRes.ok) {
            const data = await syncRes.json();
            if (data.success && data.match) {
              setActiveMatch(data.match);
            }
          }
        } else {
          toast({
            title: "Invalid Move",
            description: res.error,
            variant: "destructive",
          });
        }
        return;
      }

      if (res.match) {
        setActiveMatch(res.match);
      }
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Failed to submit move.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingMove(false);
    }
  };

  // Forfeit / Cancel Handler
  const handleForfeit = async () => {
    if (!activeMatch) {
      setView("LOBBY");
      return;
    }

    try {
      await forfeitArenaMatchAction({
        matchId: activeMatch.id,
        playerId,
      });
    } catch {
      // Ignore
    }

    setActiveMatch(null);
    setView("LOBBY");
  };

  // Play Again Handler
  const handlePlayAgain = () => {
    setActiveMatch(null);
    setView("LOBBY");
  };

  // Copy Invite Code / Link
  const handleCopyCode = () => {
    if (!activeMatch?.inviteCode) return;
    navigator.clipboard.writeText(activeMatch.inviteCode);
    setCopiedCode(true);
    toast({
      title: "Code Copied!",
      description: `Share code ${activeMatch.inviteCode} with your opponent.`,
    });
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold">
              <Swords className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm text-zinc-950 flex items-center gap-1.5">
                Table Arena ⚔️
              </h3>
              <span className="text-[10px] text-zinc-400 font-bold">
                Table {tableNumber} &bull; Real-Time Games
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* VIEW 1: LOBBY & SETUP */}
        {/* ------------------------------------------------------------- */}
        {view === "LOBBY" && (
          <div className="space-y-4">
            {/* Step 1: Select Game */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-zinc-800 uppercase tracking-wider block">
                1. Select Game
              </label>
              <div className="grid grid-cols-3 gap-2">
                {/* Tic-Tac-Toe */}
                {arenaSettings.ticTacToeEnabled && (
                  <button
                    onClick={() => setSelectedGame(GameType.TIC_TAC_TOE)}
                    className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center gap-1 transition-all ${
                      selectedGame === GameType.TIC_TAC_TOE
                        ? "bg-amber-500/10 border-amber-500 text-amber-900 ring-2 ring-amber-500/20"
                        : "bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100/70"
                    }`}
                  >
                    <span className="text-2xl">❌⭕</span>
                    <span className="font-extrabold text-[11px]">Tic-Tac-Toe</span>
                  </button>
                )}

                {/* Rock Paper Scissors */}
                {arenaSettings.rpsEnabled && (
                  <button
                    onClick={() => setSelectedGame(GameType.ROCK_PAPER_SCISSORS)}
                    className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center gap-1 transition-all ${
                      selectedGame === GameType.ROCK_PAPER_SCISSORS
                        ? "bg-amber-500/10 border-amber-500 text-amber-900 ring-2 ring-amber-500/20"
                        : "bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100/70"
                    }`}
                  >
                    <span className="text-2xl">✊✋✌️</span>
                    <span className="font-extrabold text-[11px]">RPS Clash</span>
                  </button>
                )}

                {/* Quiz Battle */}
                {arenaSettings.quizBattleEnabled && (
                  <button
                    onClick={() => setSelectedGame(GameType.QUIZ_BATTLE)}
                    className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center gap-1 transition-all ${
                      selectedGame === GameType.QUIZ_BATTLE
                        ? "bg-amber-500/10 border-amber-500 text-amber-900 ring-2 ring-amber-500/20"
                        : "bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100/70"
                    }`}
                  >
                    <span className="text-2xl">🎯🍛</span>
                    <span className="font-extrabold text-[11px]">Quiz Battle</span>
                  </button>
                )}
              </div>
            </div>

            {/* Step 2: Select Mode */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-zinc-800 uppercase tracking-wider block">
                2. Choose How to Play
              </label>
              <div className="grid grid-cols-1 gap-2">
                {/* Same Table (2 Phones) */}
                <button
                  onClick={() => setSelectedMode(GameMode.SAME_TABLE)}
                  className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    selectedMode === GameMode.SAME_TABLE
                      ? "bg-amber-50 border-amber-400 text-amber-950 ring-2 ring-amber-400/20"
                      : "bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-amber-600">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-zinc-900">
                        Same Table (Two Phones)
                      </h5>
                      <p className="text-[10px] text-zinc-500">
                        Play against a friend sitting with you via quick code.
                      </p>
                    </div>
                  </div>
                  <span
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      selectedMode === GameMode.SAME_TABLE
                        ? "border-amber-600 bg-amber-600"
                        : "border-zinc-300"
                    }`}
                  >
                    {selectedMode === GameMode.SAME_TABLE && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </span>
                </button>

                {/* Pass and Play (1 Phone) */}
                <button
                  onClick={() => setSelectedMode(GameMode.PASS_AND_PLAY)}
                  className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    selectedMode === GameMode.PASS_AND_PLAY
                      ? "bg-amber-50 border-amber-400 text-amber-950 ring-2 ring-amber-400/20"
                      : "bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-amber-600">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-zinc-900">
                        Pass & Play (One Phone)
                      </h5>
                      <p className="text-[10px] text-zinc-500">
                        Take turns passing this phone back and forth.
                      </p>
                    </div>
                  </div>
                  <span
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      selectedMode === GameMode.PASS_AND_PLAY
                        ? "border-amber-600 bg-amber-600"
                        : "border-zinc-300"
                    }`}
                  >
                    {selectedMode === GameMode.PASS_AND_PLAY && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </span>
                </button>

                {/* Cross-Table Multiplayer */}
                {arenaSettings.crossTableEnabled && (
                  <button
                    onClick={() => setSelectedMode(GameMode.CROSS_TABLE)}
                    className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      selectedMode === GameMode.CROSS_TABLE
                        ? "bg-amber-50 border-amber-400 text-amber-950 ring-2 ring-amber-400/20"
                        : "bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-rose-600">
                        <Flame className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="font-bold text-xs text-zinc-900">
                          Challenge Another Table ⚔️
                        </h5>
                        <p className="text-[10px] text-zinc-500">
                          Invite another table in the restaurant to a battle!
                        </p>
                      </div>
                    </div>
                    <span
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        selectedMode === GameMode.CROSS_TABLE
                          ? "border-amber-600 bg-amber-600"
                          : "border-zinc-300"
                      }`}
                    >
                      {selectedMode === GameMode.CROSS_TABLE && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Target Table Selector for Cross-Table Mode */}
            {selectedMode === GameMode.CROSS_TABLE && (
              <div className="p-3 bg-rose-50/70 border border-rose-200/80 rounded-2xl space-y-2">
                <span className="text-xs font-black text-rose-900 block">
                  Select Opponent Table:
                </span>
                {isLoadingTables ? (
                  <div className="text-xs text-rose-700 font-medium py-2 flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Looking for active tables...
                  </div>
                ) : eligibleTables.length === 0 ? (
                  <p className="text-xs text-rose-800 font-medium">
                    No other active tables found in the restaurant right now. Try Same Table or Pass & Play!
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {eligibleTables.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTargetTableId(t.id)}
                        className={`p-2 rounded-xl text-xs font-black border transition-all ${
                          selectedTargetTableId === t.id
                            ? "bg-rose-600 text-white border-rose-700 shadow-xs"
                            : "bg-white text-zinc-800 border-zinc-200 hover:bg-rose-100/50"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Start / Create Match Button */}
            <Button
              onClick={handleCreateMatch}
              disabled={isCreatingMatch || (selectedMode === GameMode.CROSS_TABLE && !selectedTargetTableId)}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-black text-xs h-11 rounded-xl shadow-xs gap-1.5"
            >
              {isCreatingMatch ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Setting up Arena...
                </>
              ) : selectedMode === GameMode.CROSS_TABLE ? (
                <>
                  <Flame className="w-4 h-4" /> Send Table Challenge
                </>
              ) : (
                <>
                  <Swords className="w-4 h-4" /> Start Game
                </>
              )}
            </Button>

            {/* Join by Code Divider & Form */}
            <div className="pt-2 border-t border-zinc-100 space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 block text-center">
                Or Join With Code
              </span>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter 6-digit code (e.g. ARENA4)"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="font-mono text-center tracking-widest uppercase font-black text-xs h-10 rounded-xl"
                />
                <Button
                  onClick={handleJoinWithCode}
                  disabled={isJoiningWithCode || joinCode.trim().length < 4}
                  className="bg-zinc-900 text-white hover:bg-zinc-800 font-bold text-xs h-10 px-4 rounded-xl shrink-0"
                >
                  {isJoiningWithCode ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    "Join"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 2: WAITING FOR OPPONENT */}
        {/* ------------------------------------------------------------- */}
        {view === "WAITING" && activeMatch && (
          <div className="flex flex-col items-center justify-center p-4 text-center space-y-5">
            <div className="w-14 h-14 rounded-3xl bg-amber-500/15 text-amber-600 flex items-center justify-center animate-pulse">
              <Clock className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h4 className="font-black text-base text-zinc-950">
                {activeMatch.mode === GameMode.CROSS_TABLE
                  ? `Challenging Table ${activeMatch.guestTableNumber || "Opponent"}...`
                  : "Waiting for Opponent to Join"}
              </h4>
              <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                {activeMatch.mode === GameMode.CROSS_TABLE
                  ? "We sent an invitation to their phone. Waiting for them to accept."
                  : "Ask your dining partner to open Table Arena and enter this game code:"}
              </p>
            </div>

            {/* Invite Code Display */}
            {activeMatch.inviteCode && (
              <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-4 w-full max-w-xs space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                  Game Pairing Code
                </span>
                <div className="font-mono text-2xl font-black text-zinc-900 tracking-widest">
                  {activeMatch.inviteCode}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyCode}
                  className="h-8 text-xs font-bold gap-1 rounded-lg w-full"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" /> Copy Code
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Cancel Button */}
            <Button
              variant="ghost"
              onClick={handleForfeit}
              className="text-zinc-400 hover:text-red-600 hover:bg-red-50 text-xs font-semibold h-9 rounded-xl"
            >
              Cancel Match
            </Button>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 3: ACTIVE GAME BOARD */}
        {/* ------------------------------------------------------------- */}
        {view === "GAME" && activeMatch && (
          <div className="space-y-4">
            {activeMatch.gameType === GameType.TIC_TAC_TOE && (
              <TicTacToeGame
                match={activeMatch}
                onMove={handleMove}
                onForfeit={handleForfeit}
                onPlayAgain={handlePlayAgain}
                isSubmittingMove={isSubmittingMove}
              />
            )}

            {activeMatch.gameType === GameType.ROCK_PAPER_SCISSORS && (
              <RpsGame
                match={activeMatch}
                onMove={handleMove}
                onForfeit={handleForfeit}
                onPlayAgain={handlePlayAgain}
                isSubmittingMove={isSubmittingMove}
              />
            )}

            {activeMatch.gameType === GameType.QUIZ_BATTLE && (
              <QuizBattleGame
                match={activeMatch}
                onMove={handleMove}
                onForfeit={handleForfeit}
                onPlayAgain={handlePlayAgain}
                isSubmittingMove={isSubmittingMove}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
