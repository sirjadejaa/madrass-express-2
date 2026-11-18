"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getOrderTrackingStatus,
  createServiceRequestAction,
  cancelServiceRequestAction,
  getQuizQuestionsAction,
  submitQuizAction,
} from "./actions";
import { respondToArenaChallengeAction } from "./arena-actions";
import { TableArenaModal } from "@/components/arena/table-arena-modal";
import { OrderStatus, PaymentStatus, OrderType, ServiceRequestType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  UtensilsCrossed,
  MapPin,
  CheckCircle2,
  Banknote,
  Receipt,
  RefreshCw,
  ShoppingBag,
  ChefHat,
  BellRing,
  Wifi,
  Copy,
  Check,
  Gamepad2,
  Sparkles,
  Trophy,
  ArrowRight,
  HelpCircle,
  GlassWater,
  Utensils,
  X,
  Plus,
  Swords,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface OrderTrackingClientProps {
  initialOrder: any;
  trackingToken: string;
}

export function OrderTrackingClient({
  initialOrder,
  trackingToken,
}: OrderTrackingClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [order, setOrder] = useState(initialOrder);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Call Waiter Modal state
  const [isWaiterModalOpen, setIsWaiterModalOpen] = useState(false);
  const [selectedRequestType, setSelectedRequestType] = useState<ServiceRequestType>(ServiceRequestType.CALL_WAITER);
  const [otherNote, setOtherNote] = useState("");
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);

  // Wi-Fi modal / card state
  const [copiedField, setCopiedField] = useState<"ssid" | "password" | null>(null);

  // Play & Win Quiz state
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState<any | null>(null);

  // Table Arena Multiplayer state
  const [isArenaModalOpen, setIsArenaModalOpen] = useState(false);
  const [arenaInitialMatch, setArenaInitialMatch] = useState<any | null>(null);
  const [isRespondingToChallenge, setIsRespondingToChallenge] = useState(false);

  // Stable client Player ID
  const [arenaPlayerId] = useState<string>(() => {
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

  const arenaSettings = order.arena || {
    enabled: true,
    crossTableEnabled: true,
    ticTacToeEnabled: true,
    rpsEnabled: true,
    quizBattleEnabled: true,
    inviteExpirySeconds: 180,
  };

  const handleRespondToChallenge = async (accept: boolean) => {
    if (!order.incomingChallenge) return;
    setIsRespondingToChallenge(true);
    try {
      const res = await respondToArenaChallengeAction({
        trackingToken,
        matchId: order.incomingChallenge.matchId,
        playerId: arenaPlayerId,
        accept,
      });

      if (res.error) {
        toast({
          title: "Challenge Update",
          description: res.error,
          variant: "destructive",
        });
      } else if (accept && res.match) {
        setArenaInitialMatch(res.match);
        setIsArenaModalOpen(true);
        toast({
          title: "Challenge Accepted! ⚔️",
          description: `Connected to battle with Table ${order.incomingChallenge.hostTableNumber}.`,
        });
      } else {
        toast({
          title: "Challenge Declined",
          description: "You declined the table battle invitation.",
        });
      }

      const updated = await getOrderTrackingStatus(trackingToken);
      if (updated.success && updated.order) {
        setOrder(updated.order);
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to respond to challenge.",
        variant: "destructive",
      });
    } finally {
      setIsRespondingToChallenge(false);
    }
  };

  // Polling for live status updates every 4 seconds
  useEffect(() => {
    if (order.status === OrderStatus.COMPLETED || order.status === OrderStatus.CANCELLED) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await getOrderTrackingStatus(trackingToken);
        if (res.success && res.order) {
          setOrder(res.order);
        }
      } catch {
        // Silent catch for background poll
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [trackingToken, order.status]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const timer = setInterval(() => {
      setCooldownRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownRemaining]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await getOrderTrackingStatus(trackingToken);
      if (res.success && res.order) {
        setOrder(res.order);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // Status mapping
  const getStatusStep = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.NEW:
        return 1;
      case OrderStatus.ACCEPTED:
      case OrderStatus.PREPARING:
        return 2;
      case OrderStatus.READY:
        return 3;
      case OrderStatus.COMPLETED:
        return 4;
      default:
        return 1;
    }
  };

  const currentStep = getStatusStep(order.status);

  // Copy helper
  const handleCopy = (text: string, field: "ssid" | "password") => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2500);
  };

  // Submit Call Waiter
  const handleSubmitServiceRequest = async () => {
    if (cooldownRemaining > 0) {
      toast({
        title: "Please Wait",
        description: `You can submit another request in ${cooldownRemaining}s.`,
      });
      return;
    }

    setIsSubmittingRequest(true);
    try {
      const res = await createServiceRequestAction({
        trackingToken,
        type: selectedRequestType,
        notes: selectedRequestType === ServiceRequestType.OTHER ? otherNote : undefined,
      });

      if (res.error) {
        toast({
          title: "Service Request",
          description: res.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Request Sent",
          description: "Our restaurant team has been notified and is on the way!",
        });
        setIsWaiterModalOpen(false);
        setOtherNote("");
        setCooldownRemaining(order.serviceRequests?.cooldownSeconds || 60);

        // Refresh orders & active requests immediately
        const updated = await getOrderTrackingStatus(trackingToken);
        if (updated.success && updated.order) {
          setOrder(updated.order);
        }
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to send request. Please alert our service team directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  // Cancel Request
  const handleCancelServiceRequest = async (requestId: string) => {
    try {
      const res = await cancelServiceRequestAction({ trackingToken, requestId });
      if (res.success) {
        toast({ title: "Request Cancelled", description: "Your service request has been cancelled." });
        const updated = await getOrderTrackingStatus(trackingToken);
        if (updated.success && updated.order) {
          setOrder(updated.order);
        }
      } else {
        toast({ title: "Notice", description: res.error || "Could not cancel request.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Network error", variant: "destructive" });
    }
  };

  // Start Quiz
  const handleOpenQuiz = async () => {
    setIsQuizModalOpen(true);
    if (quizQuestions.length === 0) {
      setIsLoadingQuiz(true);
      try {
        const res = await getQuizQuestionsAction(trackingToken);
        if (res.success && res.questions) {
          setQuizQuestions(res.questions);
          setCurrentQuestionIndex(0);
          setSelectedAnswers({});
          setQuizResult(null);
        }
      } catch {
        toast({ title: "Quiz unavailable", description: "Could not load quiz questions at this moment." });
      } finally {
        setIsLoadingQuiz(false);
      }
    }
  };

  // Submit Quiz
  const handleAnswerSelect = (questionId: string, optionIndex: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleNextQuizQuestion = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handleSubmitQuiz = async () => {
    setIsSubmittingQuiz(true);
    try {
      const answersPayload = Object.entries(selectedAnswers).map(([questionId, selectedIndex]) => ({
        questionId,
        selectedIndex,
      }));

      const res = await submitQuizAction({
        trackingToken,
        answers: answersPayload,
      });

      if (res.success) {
        setQuizResult(res);
      } else {
        toast({ title: "Quiz Submission Failed", description: res.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to submit quiz.", variant: "destructive" });
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  const handleResetQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setQuizResult(null);
  };

  const getServiceRequestLabel = (type: ServiceRequestType) => {
    switch (type) {
      case ServiceRequestType.CALL_WAITER:
        return { label: "Call Waiter / Assistance", icon: BellRing };
      case ServiceRequestType.WATER:
        return { label: "Request Water", icon: GlassWater };
      case ServiceRequestType.EXTRA_PLATES:
        return { label: "Request Extra Plates", icon: UtensilsCrossed };
      case ServiceRequestType.CUTLERY:
        return { label: "Request Cutlery", icon: Utensils };
      case ServiceRequestType.BILL:
        return { label: "Request Bill", icon: Receipt };
      case ServiceRequestType.OTHER:
        return { label: "Other Request", icon: HelpCircle };
      default:
        return { label: "Service Request", icon: BellRing };
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-stone-50 pb-24 selection:bg-amber-100">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-zinc-100 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
            <UtensilsCrossed className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-black text-sm tracking-tight text-zinc-950 uppercase leading-none">
              {order.restaurantName}
            </h1>
            <p className="text-[10px] font-semibold text-zinc-400 mt-0.5">
              Live Order Tracker
            </p>
          </div>
        </div>

        <button
          onClick={handleManualRefresh}
          className="text-xs font-bold text-zinc-600 hover:text-zinc-900 bg-zinc-100 px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition-colors active:scale-95"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-amber-600" : ""}`}
          />
          <span>Refresh</span>
        </button>
      </header>

      {/* Main Order Card */}
      <main className="p-4 space-y-4 max-w-lg mx-auto w-full">
        {/* ============================================================== */}
        {/* INCOMING TABLE ARENA CHALLENGE BANNER */}
        {/* ============================================================== */}
        {order.incomingChallenge && (
          <div className="bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 text-white rounded-3xl p-5 shadow-lg border border-white/20 animate-in fade-in slide-in-from-top-3 duration-300 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center font-bold text-white shrink-0">
                  <Swords className="w-5 h-5 text-white" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-200">
                    Incoming Table Battle!
                  </span>
                  <h4 className="font-black text-sm text-white leading-tight">
                    Table {order.incomingChallenge.hostTableNumber} challenged you to a game! ⚔️
                  </h4>
                  <p className="text-[11px] text-white/80">
                    {order.incomingChallenge.gameType === "TIC_TAC_TOE"
                      ? "Tic-Tac-Toe Match"
                      : order.incomingChallenge.gameType === "ROCK_PAPER_SCISSORS"
                      ? "Rock Paper Scissors Clash"
                      : "Food Quiz Battle"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                onClick={() => handleRespondToChallenge(true)}
                disabled={isRespondingToChallenge}
                className="flex-1 bg-white hover:bg-amber-50 text-rose-950 font-black text-xs h-10 rounded-xl shadow-xs"
              >
                {isRespondingToChallenge ? "Joining..." : "Accept & Play ⚔️"}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleRespondToChallenge(false)}
                disabled={isRespondingToChallenge}
                className="bg-black/20 hover:bg-black/30 text-white border-white/20 font-bold text-xs h-10 px-4 rounded-xl"
              >
                Decline
              </Button>
            </div>
          </div>
        )}

        {/* Token Banner Card */}
        <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm text-center space-y-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600" />

          {/* Token Number */}
          <div className="space-y-1">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-400">
              Your Daily Token
            </span>
            <div className="text-5xl font-black tracking-tight text-zinc-950 drop-shadow-xs">
              #{order.tokenNumber || "—"}
            </div>
          </div>

          {/* Table / Type Badge */}
          <div className="flex items-center justify-center gap-2">
            {order.orderType === OrderType.DINE_IN && order.tableNumber ? (
              <span className="inline-flex items-center gap-1.5 bg-zinc-950 text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-xs">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                Table {order.tableNumber}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-zinc-950 text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-xs">
                <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                Takeaway Order
              </span>
            )}

            {/* Payment Badge */}
            {order.paymentStatus === PaymentStatus.PAID ? (
              <Badge
                variant="outline"
                className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold px-2.5 py-1 text-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Paid
              </Badge>
            ) : order.paymentStatus === PaymentStatus.PAY_AT_COUNTER ? (
              <Badge
                variant="outline"
                className="bg-amber-50 text-amber-800 border-amber-300 font-bold px-2.5 py-1 text-xs"
              >
                <Banknote className="w-3.5 h-3.5 mr-1" /> Pay at Counter
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="bg-zinc-100 text-zinc-700 font-bold px-2.5 py-1 text-xs"
              >
                Payment Pending
              </Badge>
            )}
          </div>

          {/* Live Progress Stepper */}
          <div className="pt-4 border-t border-zinc-100">
            <div className="grid grid-cols-4 gap-2 text-center">
              {/* Step 1: Received */}
              <div className="space-y-1.5">
                <div
                  className={`w-9 h-9 rounded-2xl mx-auto flex items-center justify-center font-bold text-xs transition-colors ${
                    currentStep >= 1
                      ? "bg-amber-600 text-white shadow-xs shadow-amber-600/30"
                      : "bg-zinc-100 text-zinc-400"
                  }`}
                >
                  <Receipt className="w-4 h-4" />
                </div>
                <span
                  className={`text-[10px] font-extrabold block ${
                    currentStep >= 1 ? "text-zinc-900" : "text-zinc-400"
                  }`}
                >
                  Received
                </span>
              </div>

              {/* Step 2: Preparing */}
              <div className="space-y-1.5">
                <div
                  className={`w-9 h-9 rounded-2xl mx-auto flex items-center justify-center font-bold text-xs transition-colors ${
                    currentStep >= 2
                      ? "bg-amber-600 text-white shadow-xs shadow-amber-600/30 animate-pulse"
                      : "bg-zinc-100 text-zinc-400"
                  }`}
                >
                  <ChefHat className="w-4 h-4" />
                </div>
                <span
                  className={`text-[10px] font-extrabold block ${
                    currentStep >= 2 ? "text-zinc-900" : "text-zinc-400"
                  }`}
                >
                  Cooking
                </span>
              </div>

              {/* Step 3: Ready */}
              <div className="space-y-1.5">
                <div
                  className={`w-9 h-9 rounded-2xl mx-auto flex items-center justify-center font-bold text-xs transition-colors ${
                    currentStep >= 3
                      ? "bg-emerald-600 text-white shadow-xs shadow-emerald-600/30"
                      : "bg-zinc-100 text-zinc-400"
                  }`}
                >
                  <BellRing className="w-4 h-4" />
                </div>
                <span
                  className={`text-[10px] font-extrabold block ${
                    currentStep >= 3 ? "text-zinc-900" : "text-zinc-400"
                  }`}
                >
                  Ready
                </span>
              </div>

              {/* Step 4: Completed */}
              <div className="space-y-1.5">
                <div
                  className={`w-9 h-9 rounded-2xl mx-auto flex items-center justify-center font-bold text-xs transition-colors ${
                    currentStep >= 4
                      ? "bg-zinc-950 text-white shadow-xs"
                      : "bg-zinc-100 text-zinc-400"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span
                  className={`text-[10px] font-extrabold block ${
                    currentStep >= 4 ? "text-zinc-900" : "text-zinc-400"
                  }`}
                >
                  Served
                </span>
              </div>
            </div>

            {/* Current Status Message Callout */}
            <div className="mt-4 p-3 rounded-2xl bg-zinc-50 border border-zinc-100 text-xs font-semibold text-zinc-700">
              {currentStep === 1 && "Your order has been sent to the kitchen display."}
              {currentStep === 2 && "Our chefs are cooking your fresh meal right now."}
              {currentStep === 3 &&
                (order.orderType === OrderType.DINE_IN && order.tableNumber
                  ? `Your food is ready and being served to Table ${order.tableNumber}!`
                  : "Your takeaway order is ready for pickup at the counter!")}
              {currentStep === 4 && "Order completed. Thank you for dining with Madrass Express!"}
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* MODULE 5: Call Waiter / Service Request System (Priority Feature) */}
        {/* ============================================================== */}
        {order.orderType === OrderType.DINE_IN && order.serviceRequests?.enabled && (
          <div className="bg-gradient-to-br from-amber-600 to-amber-700 text-white rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
                  <BellRing className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-sm tracking-tight leading-tight">
                    Need Table Assistance?
                  </h3>
                  <p className="text-[11px] text-amber-100 font-medium">
                    Call waiter, request water, cutlery or your bill.
                  </p>
                </div>
              </div>

              <Button
                onClick={() => setIsWaiterModalOpen(true)}
                className="bg-white text-amber-800 hover:bg-amber-50 font-black text-xs h-10 px-4 rounded-xl shadow-xs transition-all active:scale-95 shrink-0"
              >
                Call Waiter
              </Button>
            </div>

            {/* Active Service Requests List */}
            {order.activeServiceRequests && order.activeServiceRequests.length > 0 && (
              <div className="pt-2 border-t border-white/15 space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-200">
                  Recent Table Requests
                </span>
                <div className="space-y-1.5">
                  {order.activeServiceRequests.map((req: any) => {
                    const info = getServiceRequestLabel(req.type);
                    const Icon = info.icon;
                    return (
                      <div
                        key={req.id}
                        className="bg-black/20 backdrop-blur-xs rounded-xl p-2.5 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="w-3.5 h-3.5 text-amber-300" />
                          <span className="font-bold text-[11px] text-white">
                            {info.label}
                          </span>
                          {req.notes && (
                            <span className="text-[10px] text-amber-200/80 italic max-w-[120px] truncate">
                              "{req.notes}"
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {req.status === "PENDING" && (
                            <span className="bg-amber-400/30 text-amber-200 border border-amber-300/40 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-300"></span> Pending
                            </span>
                          )}
                          {req.status === "ACCEPTED" && (
                            <span className="bg-blue-400/30 text-blue-200 border border-blue-300/40 text-[10px] font-black px-2 py-0.5 rounded-full">
                              Staff Coming
                            </span>
                          )}
                          {req.status === "COMPLETED" && (
                            <span className="bg-emerald-400/30 text-emerald-200 border border-emerald-300/40 text-[10px] font-black px-2 py-0.5 rounded-full">
                              Served
                            </span>
                          )}
                          {req.status === "CANCELLED" && (
                            <span className="bg-zinc-800 text-zinc-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              Cancelled
                            </span>
                          )}

                          {req.status === "PENDING" && (
                            <button
                              onClick={() => handleCancelServiceRequest(req.id)}
                              className="text-[10px] text-amber-200 hover:text-white underline ml-1"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* MODULE 2: Free Restaurant Wi-Fi Card */}
        {/* ============================================================== */}
        {order.wifi?.enabled && (
          <div className="bg-white rounded-3xl p-5 border border-zinc-100 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Wifi className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-xs text-zinc-950 uppercase tracking-tight">
                    Free Guest Wi-Fi
                  </h3>
                  <p className="text-[10px] text-zinc-500 font-medium">
                    High-speed internet for all our diners
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              {/* Network SSID */}
              <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-1">
                <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 block">
                  Network (SSID)
                </span>
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-zinc-900 truncate">
                    {order.wifi.ssid}
                  </span>
                  <button
                    onClick={() => handleCopy(order.wifi.ssid, "ssid")}
                    className="p-1 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/50 transition-colors"
                    title="Copy Network Name"
                  >
                    {copiedField === "ssid" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Password */}
              <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-1">
                <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 block">
                  Password
                </span>
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-zinc-900 font-mono truncate">
                    {order.wifi.password || "No password"}
                  </span>
                  {order.wifi.password && (
                    <button
                      onClick={() => handleCopy(order.wifi.password, "password")}
                      className="p-1 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/50 transition-colors"
                      title="Copy Password"
                    >
                      {copiedField === "password" ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {order.wifi.instructions && (
              <p className="text-[10px] text-zinc-500 font-medium leading-relaxed bg-zinc-50/50 p-2.5 rounded-xl">
                💡 {order.wifi.instructions}
              </p>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* MODULE 3: Play & Win Banner Card */}
        {/* ============================================================== */}
        {order.games?.enabled && (
          <div className="bg-gradient-to-r from-violet-600 to-indigo-700 text-white rounded-3xl p-5 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span className="text-[10px] font-black uppercase tracking-widest text-violet-200">
                  Waiting For Food?
                </span>
              </div>
              <h3 className="font-black text-sm tracking-tight">
                Play & Win Food Trivia! 🎯
              </h3>
              <p className="text-[11px] text-violet-200 font-medium">
                Answer 4 fun food questions & unlock a bonus reward.
              </p>
            </div>

            <Button
              onClick={handleOpenQuiz}
              className="bg-white text-indigo-900 hover:bg-violet-50 font-black text-xs h-10 px-4 rounded-xl shadow-xs transition-all active:scale-95 shrink-0"
            >
              Play Quiz
            </Button>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODULE: Table Arena Multiplayer Games */}
        {/* ============================================================== */}
        {order.orderType === OrderType.DINE_IN && arenaSettings.enabled && (
          <div className="bg-gradient-to-r from-rose-500 via-amber-600 to-amber-500 text-white rounded-3xl p-5 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Swords className="w-4 h-4 text-amber-200" />
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-100">
                  Play Together
                </span>
              </div>
              <h3 className="font-black text-sm tracking-tight">
                Table Arena Multiplayer ⚔️
              </h3>
              <p className="text-[11px] text-amber-100 font-medium">
                Play Tic-Tac-Toe, RPS & Quiz Battles with friends or other tables!
              </p>
            </div>

            <Button
              onClick={() => {
                setArenaInitialMatch(null);
                setIsArenaModalOpen(true);
              }}
              className="bg-white text-rose-950 hover:bg-rose-50 font-black text-xs h-10 px-4 rounded-xl shadow-xs transition-all active:scale-95 shrink-0"
            >
              Play Arena
            </Button>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODULE 4: Explore More Dishes Carousel / Cards */}
        {/* ============================================================== */}
        {order.exploreMoreProducts && order.exploreMoreProducts.length > 0 && (
          <div className="bg-white rounded-3xl p-5 border border-zinc-100 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-xs text-zinc-950 uppercase tracking-tight">
                  Explore More Dishes 🍛
                </h3>
                <p className="text-[10px] text-zinc-500 font-medium">
                  Add popular specials to your table anytime
                </p>
              </div>

              <button
                onClick={() => router.push("/kiosk/menu")}
                className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
              >
                Full Menu <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              {order.exploreMoreProducts.map((p: any) => (
                <div
                  key={p.id}
                  className="bg-zinc-50 border border-zinc-100 rounded-2xl p-2.5 flex flex-col justify-between space-y-2"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          p.isVegetarian ? "bg-emerald-600" : "bg-red-600"
                        }`}
                      />
                      <span className="font-extrabold text-xs text-zinc-900 line-clamp-1">
                        {p.name}
                      </span>
                    </div>
                    {p.description && (
                      <p className="text-[10px] text-zinc-500 line-clamp-1">
                        {p.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-zinc-200/50">
                    <span className="font-black text-xs text-zinc-950">
                      ₹{p.price}
                    </span>
                    <button
                      onClick={() => router.push("/kiosk/menu")}
                      className="text-[10px] font-black bg-amber-600 text-white hover:bg-amber-700 px-2 py-1 rounded-lg flex items-center gap-0.5 active:scale-95 transition-transform"
                    >
                      <Plus className="w-3 h-3" /> Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Order Details Accordion / List */}
        <div className="bg-white rounded-3xl p-5 border border-zinc-100 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
            <span className="font-extrabold text-xs text-zinc-900">
              Ordered Items ({order.items.reduce((s: number, i: any) => s + i.quantity, 0)})
            </span>
            <span className="text-[11px] font-mono text-zinc-400">
              {order.displayId.slice(0, 8)}...
            </span>
          </div>

          <div className="space-y-3 divide-y divide-zinc-100">
            {order.items.map((item: any) => (
              <div key={item.id} className="pt-2.5 first:pt-0 space-y-1">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs bg-zinc-100 text-zinc-800 px-2 py-0.5 rounded-md">
                      {item.quantity}x
                    </span>
                    <span className="font-bold text-xs text-zinc-900">
                      {item.name}
                    </span>
                  </div>
                  <span className="font-black text-xs text-zinc-950">
                    ₹{item.price * item.quantity}
                  </span>
                </div>

                {item.options && item.options.length > 0 && (
                  <p className="text-[10px] text-zinc-500 pl-8">
                    {item.options
                      .map((o: any) => `${o.name}${o.quantity > 1 ? ` x${o.quantity}` : ""}`)
                      .join(", ")}
                  </p>
                )}

                {item.notes && (
                  <p className="text-[10px] text-amber-700 italic pl-8">
                    Note: "{item.notes}"
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Bill summary breakdown */}
          <div className="pt-3 border-t border-zinc-100 space-y-1.5 text-xs text-zinc-600 font-medium">
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>Discount ({order.couponCode})</span>
                <span>-₹{order.discountAmount}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-sm font-black text-zinc-950 pt-1">
              <span>Total Bill</span>
              <span className="text-base text-amber-700">₹{order.totalAmount}</span>
            </div>
          </div>
        </div>

        {/* Back to Menu or Order More Button */}
        <div className="pt-2">
          <Button
            variant="outline"
            onClick={() => router.push("/kiosk/menu")}
            className="w-full h-12 rounded-2xl border-zinc-200 text-zinc-800 font-extrabold text-xs hover:bg-zinc-100 shadow-xs"
          >
            Order Additional Dishes
          </Button>
        </div>
      </main>

      {/* ============================================================== */}
      {/* CALL WAITER BOTTOM SHEET / MODAL */}
      {/* ============================================================== */}
      {isWaiterModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto space-y-5 animate-in slide-in-from-bottom duration-300 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center">
                  <BellRing className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-zinc-950">
                    Call Table Assistance
                  </h3>
                  <p className="text-[11px] text-zinc-500 font-medium">
                    {order.tableNumber ? `Table ${order.tableNumber}` : "Dine-In"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsWaiterModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-400 block">
                Select Request Type
              </label>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { type: ServiceRequestType.CALL_WAITER, label: "Call Waiter", icon: BellRing },
                  { type: ServiceRequestType.WATER, label: "Request Water", icon: GlassWater },
                  { type: ServiceRequestType.EXTRA_PLATES, label: "Extra Plates", icon: UtensilsCrossed },
                  { type: ServiceRequestType.CUTLERY, label: "Request Cutlery", icon: Utensils },
                  { type: ServiceRequestType.BILL, label: "Request Bill", icon: Receipt },
                  { type: ServiceRequestType.OTHER, label: "Other Request", icon: HelpCircle },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = selectedRequestType === item.type;
                  return (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => setSelectedRequestType(item.type)}
                      className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
                        isSelected
                          ? "border-amber-600 bg-amber-50 text-amber-950 ring-2 ring-amber-600/20 font-bold"
                          : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isSelected ? "text-amber-600" : "text-zinc-500"}`} />
                      <span className="text-xs">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedRequestType === ServiceRequestType.OTHER && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-400 block">
                  Custom Request Message (Max 200 chars)
                </label>
                <textarea
                  value={otherNote}
                  onChange={(e) => setOtherNote(e.target.value.slice(0, 200))}
                  placeholder="e.g. Please bring extra green chutney, less spicy..."
                  className="w-full text-xs p-3 rounded-2xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 h-20 resize-none"
                />
                <span className="text-[10px] text-zinc-400 block text-right">
                  {otherNote.length}/200
                </span>
              </div>
            )}

            <div className="pt-2 space-y-2">
              <Button
                disabled={isSubmittingRequest || cooldownRemaining > 0}
                onClick={handleSubmitServiceRequest}
                className="w-full h-12 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-2xl text-xs shadow-md"
              >
                {isSubmittingRequest
                  ? "Sending Request..."
                  : cooldownRemaining > 0
                  ? `Wait ${cooldownRemaining}s before next request`
                  : "Send Service Request"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setIsWaiterModalOpen(false)}
                className="w-full text-xs text-zinc-500"
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* PLAY & WIN TRIVIA QUIZ MODAL */}
      {/* ============================================================== */}
      {isQuizModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto space-y-5 animate-in slide-in-from-bottom duration-300 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-violet-600 text-white flex items-center justify-center">
                  <Gamepad2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-zinc-950">
                    Food Trivia Quiz 🎯
                  </h3>
                  <p className="text-[11px] text-zinc-500 font-medium">
                    Test your culinary knowledge while waiting
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsQuizModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isLoadingQuiz ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-8 h-8 border-3 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-zinc-500 font-bold">Loading questions...</p>
              </div>
            ) : quizResult ? (
              /* Quiz Result Screen */
              <div className="py-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center mx-auto shadow-inner">
                  <Trophy className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-2xl font-black text-zinc-950">
                    You Scored {quizResult.score} / {quizResult.total}!
                  </h4>
                  <p className="text-xs text-zinc-500 font-medium">
                    {quizResult.passed
                      ? "Outstanding! You know your South Indian cuisine."
                      : "Good effort! Play again anytime to test your skills."}
                  </p>
                </div>

                {/* Reward Banner */}
                {quizResult.reward && (
                  <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white p-4 rounded-2xl space-y-2 shadow-md">
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-100">
                      🎉 Reward Unlocked!
                    </span>
                    <div className="text-xl font-black tracking-wider font-mono bg-black/20 py-1.5 px-3 rounded-xl inline-block">
                      {quizResult.reward.code}
                    </div>
                    <p className="text-[11px] text-amber-50">
                      {quizResult.reward.details}
                    </p>
                    <button
                      onClick={() => handleCopy(quizResult.reward.code, "password")}
                      className="text-xs font-bold text-amber-900 bg-white px-3 py-1.5 rounded-lg shadow-xs hover:bg-amber-50 active:scale-95 inline-flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" /> Copy Coupon Code
                    </button>
                  </div>
                )}

                <div className="pt-2 flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleResetQuiz}
                    className="flex-1 rounded-2xl h-11 text-xs font-bold"
                  >
                    Play Again
                  </Button>
                  <Button
                    onClick={() => setIsQuizModalOpen(false)}
                    className="flex-1 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl h-11 text-xs font-bold"
                  >
                    Close
                  </Button>
                </div>
              </div>
            ) : quizQuestions.length > 0 ? (
              /* Single Question Active Flow */
              <div className="space-y-4">
                <div className="flex items-center justify-between text-[11px] font-extrabold text-zinc-400 uppercase tracking-wider">
                  <span>
                    Question {currentQuestionIndex + 1} of {quizQuestions.length}
                  </span>
                  <span>{Math.round(((currentQuestionIndex + 1) / quizQuestions.length) * 100)}%</span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-violet-600 h-full transition-all duration-300"
                    style={{
                      width: `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%`,
                    }}
                  />
                </div>

                {/* Question Text */}
                <h4 className="text-sm font-bold text-zinc-950 leading-snug">
                  {quizQuestions[currentQuestionIndex]?.question}
                </h4>

                {/* Options */}
                <div className="space-y-2 pt-1">
                  {quizQuestions[currentQuestionIndex]?.options.map((opt: string, idx: number) => {
                    const qId = quizQuestions[currentQuestionIndex].id;
                    const isSelected = selectedAnswers[qId] === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleAnswerSelect(qId, idx)}
                        className={`w-full p-3 rounded-2xl border text-left text-xs font-semibold transition-all ${
                          isSelected
                            ? "border-violet-600 bg-violet-50 text-violet-950 ring-2 ring-violet-600/20 font-bold"
                            : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800"
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 flex justify-between gap-2">
                  {currentQuestionIndex < quizQuestions.length - 1 ? (
                    <Button
                      disabled={selectedAnswers[quizQuestions[currentQuestionIndex]?.id] === undefined}
                      onClick={handleNextQuizQuestion}
                      className="w-full h-11 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl text-xs font-bold shadow-xs"
                    >
                      Next Question <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  ) : (
                    <Button
                      disabled={
                        selectedAnswers[quizQuestions[currentQuestionIndex]?.id] === undefined ||
                        isSubmittingQuiz
                      }
                      onClick={handleSubmitQuiz}
                      className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-xs"
                    >
                      {isSubmittingQuiz ? "Calculating Score..." : "Submit & See Score 🎉"}
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-zinc-500 py-6 text-center">
                No quiz questions configured. Please ask restaurant staff.
              </p>
            )}
          </div>
        </div>
      )}

      {/* TABLE ARENA MULTIPLAYER MODAL */}
      <TableArenaModal
        isOpen={isArenaModalOpen}
        onClose={() => {
          setIsArenaModalOpen(false);
          setArenaInitialMatch(null);
        }}
        trackingToken={trackingToken}
        tableNumber={order.tableNumber || "00"}
        arenaSettings={arenaSettings}
        initialMatch={arenaInitialMatch}
      />
    </div>
  );
}
