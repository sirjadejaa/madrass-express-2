"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { ServiceRequestStatus, ServiceRequestType } from "@prisma/client";
import { updateServiceRequestStatusAction } from "./actions";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  BellRing,
  GlassWater,
  UtensilsCrossed,
  Utensils,
  Receipt,
  HelpCircle,
  CheckCircle2,
  Clock,
  Volume2,
  VolumeX,
  RefreshCw,
  Search,
  Check,
  MapPin,
  Ticket,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ServiceRequestItem {
  id: string;
  type: ServiceRequestType;
  status: ServiceRequestStatus;
  notes: string | null;
  cancelReason: string | null;
  tableId: string;
  tableName: string;
  orderTokenNumber: number | null;
  createdAt: string;
  acceptedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
}

export function ServiceRequestsClient({
  initialRequests,
}: {
  initialRequests: ServiceRequestItem[];
}) {
  const { toast } = useToast();
  const [requests, setRequests] = useState<ServiceRequestItem[]>(initialRequests);
  const [statusFilter, setStatusFilter] = useState<"ALL" | ServiceRequestStatus>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Cancellation modal state
  const [cancelModalItem, setCancelModalItem] = useState<ServiceRequestItem | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const knownRequestIds = useRef<Set<string>>(new Set(initialRequests.map((r) => r.id)));

  // Sound chime helper via Web Audio API
  const playNotificationChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(784, ctx.currentTime); // G5 note
      osc.frequency.setValueAtTime(1046.5, ctx.currentTime + 0.1); // C6 note
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      console.warn("Could not play audio chime", e);
    }
  };

  // Poll for live requests every 4 seconds
  const fetchLatestRequests = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const res = await fetch("/api/admin/service-requests");
      if (!res.ok) throw new Error("Network error");
      const data = await res.json();

      if (data.success && Array.isArray(data.requests)) {
        // Detect newly arrived PENDING requests
        let hasNewPending = false;
        data.requests.forEach((r: ServiceRequestItem) => {
          if (!knownRequestIds.current.has(r.id) && r.status === "PENDING") {
            hasNewPending = true;
          }
          knownRequestIds.current.add(r.id);
        });

        if (hasNewPending && soundEnabled) {
          playNotificationChime();
        }

        setRequests(data.requests);
      }
    } catch {
      // Background poll silently catches
    } finally {
      if (isManual) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      fetchLatestRequests(false);
    }, 4000);
    return () => clearInterval(interval);
  }, [soundEnabled]);

  // Update Status Action
  const handleUpdateStatus = async (
    requestId: string,
    newStatus: ServiceRequestStatus,
    reason?: string
  ) => {
    setUpdatingId(requestId);
    try {
      const res = await updateServiceRequestStatusAction({
        requestId,
        status: newStatus,
        cancelReason: reason,
      });

      if (res.error) {
        toast({ title: "Update Failed", description: res.error, variant: "destructive" });
      } else {
        toast({
          title: "Status Updated",
          description: `Request marked as ${newStatus.toLowerCase()}.`,
        });
        setCancelModalItem(null);
        setCancelReason("");
        await fetchLatestRequests(false);
      }
    } catch {
      toast({ title: "Error", description: "Failed to update status.", variant: "destructive" });
    } finally {
      setUpdatingId(null);
    }
  };

  const getRequestTypeMeta = (type: ServiceRequestType) => {
    switch (type) {
      case "CALL_WAITER":
        return { label: "Call Waiter / Assistance", icon: BellRing, color: "text-amber-600 bg-amber-50 border-amber-200" };
      case "WATER":
        return { label: "Request Water", icon: GlassWater, color: "text-blue-600 bg-blue-50 border-blue-200" };
      case "EXTRA_PLATES":
        return { label: "Extra Plates", icon: UtensilsCrossed, color: "text-orange-600 bg-orange-50 border-orange-200" };
      case "CUTLERY":
        return { label: "Request Cutlery", icon: Utensils, color: "text-purple-600 bg-purple-50 border-purple-200" };
      case "BILL":
        return { label: "Request Bill", icon: Receipt, color: "text-emerald-600 bg-emerald-50 border-emerald-200" };
      case "OTHER":
        return { label: "Other Request", icon: HelpCircle, color: "text-zinc-700 bg-zinc-100 border-zinc-200" };
      default:
        return { label: "Service Request", icon: BellRing, color: "text-zinc-600 bg-zinc-50 border-zinc-200" };
    }
  };

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
      const matchesSearch =
        searchQuery.trim() === "" ||
        r.tableName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.notes && r.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
        r.type.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [requests, statusFilter, searchQuery]);

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-zinc-100 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight flex items-center gap-2">
              <BellRing className="w-6 h-6 text-amber-600" />
              Service Requests
            </h1>

            {pendingCount > 0 && (
              <span className="bg-red-500 text-white font-black text-xs px-2.5 py-0.5 rounded-full shadow-xs animate-bounce">
                {pendingCount} Pending
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 font-medium mt-1">
            Real-time table assistance, water, cutlery, and bill requests from diners.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Notification sound toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`rounded-xl text-xs font-bold gap-1.5 ${
              soundEnabled
                ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                : "text-zinc-400 border-zinc-200 hover:bg-zinc-100"
            }`}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-amber-600" /> Sound On
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5" /> Sound Off
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLatestRequests(true)}
            className="rounded-xl text-xs font-bold gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-amber-600" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[
            { id: "ALL", label: `All (${requests.length})` },
            { id: "PENDING", label: `Pending (${requests.filter((r) => r.status === "PENDING").length})` },
            { id: "ACCEPTED", label: `Accepted (${requests.filter((r) => r.status === "ACCEPTED").length})` },
            { id: "COMPLETED", label: `Completed (${requests.filter((r) => r.status === "COMPLETED").length})` },
            { id: "CANCELLED", label: `Cancelled (${requests.filter((r) => r.status === "CANCELLED").length})` },
          ].map((tab) => {
            const isSelected = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isSelected
                    ? "bg-zinc-950 text-white shadow-xs"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search table or request..."
            className="pl-9 h-9 text-xs rounded-xl bg-zinc-50 border-zinc-200"
          />
        </div>
      </div>

      {/* Requests Grid */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-zinc-100 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-zinc-900">No Service Requests</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            {statusFilter === "ALL"
              ? "No customer service requests received in the last 24 hours."
              : `No requests with status ${statusFilter.toLowerCase()}.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRequests.map((req) => {
            const meta = getRequestTypeMeta(req.type);
            const Icon = meta.icon;
            const isUpdating = updatingId === req.id;
            const isPending = req.status === "PENDING";
            const isAccepted = req.status === "ACCEPTED";
            const isCompleted = req.status === "COMPLETED";
            const isCancelled = req.status === "CANCELLED";

            return (
              <div
                key={req.id}
                className={`bg-white rounded-3xl p-5 border transition-all space-y-4 shadow-xs ${
                  isPending
                    ? "border-amber-300 ring-2 ring-amber-500/10 shadow-amber-500/5 bg-amber-50/20"
                    : isAccepted
                    ? "border-blue-200 bg-blue-50/10"
                    : "border-zinc-100"
                }`}
              >
                {/* Top Table & Time Info */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="bg-zinc-950 text-white font-black text-sm px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-400" />
                      Table {req.tableName}
                    </div>

                    {req.orderTokenNumber && (
                      <span className="text-[11px] font-bold text-zinc-500 bg-zinc-100 px-2 py-1 rounded-lg flex items-center gap-1">
                        <Ticket className="w-3 h-3 text-zinc-400" /> #{req.orderTokenNumber}
                      </span>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isPending && (
                      <Badge className="bg-amber-500 text-white font-black text-[10px] px-2.5 py-0.5 rounded-full animate-pulse border-none">
                        PENDING
                      </Badge>
                    )}
                    {isAccepted && (
                      <Badge className="bg-blue-600 text-white font-black text-[10px] px-2.5 py-0.5 rounded-full border-none">
                        ATTENDING
                      </Badge>
                    )}
                    {isCompleted && (
                      <Badge className="bg-emerald-600 text-white font-black text-[10px] px-2.5 py-0.5 rounded-full border-none">
                        COMPLETED
                      </Badge>
                    )}
                    {isCancelled && (
                      <Badge variant="outline" className="text-zinc-500 border-zinc-200 text-[10px] font-bold">
                        CANCELLED
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Request Type & Note */}
                <div className="space-y-2">
                  <div className={`p-3 rounded-2xl border flex items-center gap-2.5 ${meta.color}`}>
                    <Icon className="w-5 h-5 shrink-0" />
                    <span className="font-extrabold text-xs">{meta.label}</span>
                  </div>

                  {req.notes && (
                    <div className="p-3 bg-zinc-50 border border-zinc-100 rounded-2xl space-y-1">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                        Customer Note
                      </span>
                      <p className="text-xs text-zinc-800 font-medium break-words leading-relaxed">
                        "{req.notes}"
                      </p>
                    </div>
                  )}

                  {req.cancelReason && (
                    <div className="p-2.5 bg-red-50/50 border border-red-100 rounded-xl text-[11px] text-red-700 font-medium">
                      Cancelled: {req.cancelReason}
                    </div>
                  )}
                </div>

                {/* Time & Timeline */}
                <div className="text-[11px] text-zinc-400 font-medium flex items-center justify-between pt-1 border-t border-zinc-100">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })}
                  </span>
                  {req.acceptedAt && !req.completedAt && (
                    <span className="text-blue-600 font-semibold text-[10px]">
                      Accepted {formatDistanceToNow(new Date(req.acceptedAt), { addSuffix: true })}
                    </span>
                  )}
                </div>

                {/* Action Buttons for Staff */}
                {(isPending || isAccepted) && (
                  <div className="pt-2 flex gap-2">
                    {isPending && (
                      <Button
                        disabled={isUpdating}
                        onClick={() => handleUpdateStatus(req.id, ServiceRequestStatus.ACCEPTED)}
                        className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs h-10 rounded-xl shadow-xs"
                      >
                        Accept Request
                      </Button>
                    )}

                    {isAccepted && (
                      <Button
                        disabled={isUpdating}
                        onClick={() => handleUpdateStatus(req.id, ServiceRequestStatus.COMPLETED)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs h-10 rounded-xl shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5 mr-1" /> Mark Completed
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      disabled={isUpdating}
                      onClick={() => setCancelModalItem(req)}
                      className="border-zinc-200 text-zinc-600 hover:bg-zinc-100 font-bold text-xs h-10 rounded-xl"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Cancellation Reason Modal */}
      {cancelModalItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <h3 className="font-black text-sm text-zinc-950">
              Cancel Service Request
            </h3>
            <p className="text-xs text-zinc-500 font-medium">
              Cancel request for <strong>Table {cancelModalItem.tableName}</strong>.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                Reason (Optional)
              </label>
              <Input
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Attended directly, table vacated..."
                className="text-xs h-10 rounded-xl bg-zinc-50 border-zinc-200"
              />
            </div>

            <div className="pt-2 flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCancelModalItem(null)}
                className="flex-1 rounded-xl text-xs font-bold"
              >
                Back
              </Button>
              <Button
                variant="destructive"
                onClick={() =>
                  handleUpdateStatus(
                    cancelModalItem.id,
                    ServiceRequestStatus.CANCELLED,
                    cancelReason
                  )
                }
                className="flex-1 rounded-xl text-xs font-bold"
              >
                Confirm Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
