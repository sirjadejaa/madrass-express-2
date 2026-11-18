"use client";

import { useState } from "react";
import {
  updateCustomerExperienceSettingsAction,
  createQuizQuestionAction,
  deleteQuizQuestionAction,
  toggleQuizQuestionAction,
} from "./actions";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Wifi,
  BellRing,
  Gamepad2,
  Sparkles,
  ShoppingBag,
  Plus,
  Trash2,
  CheckCircle2,
  X,
  Volume2,
} from "lucide-react";

interface ExperienceSettingsFormProps {
  initialSettings: any;
  initialQuestions: any[];
}

export function ExperienceSettingsForm({
  initialSettings,
  initialQuestions,
}: ExperienceSettingsFormProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [wifiEnabled, setWifiEnabled] = useState(initialSettings?.wifiEnabled ?? false);
  const [wifiSSID, setWifiSSID] = useState(initialSettings?.wifiSSID || "MadrassExpress-Guest");
  const [wifiPassword, setWifiPassword] = useState(initialSettings?.wifiPassword || "");
  const [wifiInstructions, setWifiInstructions] = useState(
    initialSettings?.wifiInstructions || "Connect to Wi-Fi network and enter password."
  );

  const [serviceRequestsEnabled, setServiceRequestsEnabled] = useState(
    initialSettings?.serviceRequestsEnabled ?? true
  );
  const [serviceRequestCooldownSeconds, setServiceRequestCooldownSeconds] = useState(
    initialSettings?.serviceRequestCooldownSeconds || 60
  );
  const [notificationSoundEnabled, setNotificationSoundEnabled] = useState(
    initialSettings?.notificationSoundEnabled ?? true
  );

  const [gamesEnabled, setGamesEnabled] = useState(initialSettings?.gamesEnabled ?? true);
  const [gameRewardEnabled, setGameRewardEnabled] = useState(
    initialSettings?.gameRewardEnabled ?? false
  );
  const [gameRewardCouponCode, setGameRewardCouponCode] = useState(
    initialSettings?.gameRewardCouponCode || "WINNER10"
  );
  const [gameRewardMinScore, setGameRewardMinScore] = useState(
    initialSettings?.gameRewardMinScore || 75
  );

  const [exploreMoreEnabled, setExploreMoreEnabled] = useState(
    initialSettings?.exploreMoreEnabled ?? true
  );

  // Quiz Questions State
  const [questions, setQuestions] = useState<any[]>(initialQuestions);
  const [isAddQuestionModalOpen, setIsAddQuestionModalOpen] = useState(false);
  const [newQuestionText, setNewQuestionText] = useState("");
  const [newOptions, setNewOptions] = useState<string[]>(["", "", "", ""]);
  const [newCorrectIndex, setNewCorrectIndex] = useState(0);
  const [newExplanation, setNewExplanation] = useState("");
  const [isCreatingQuestion, setIsCreatingQuestion] = useState(false);

  // Save Settings
  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const res = await updateCustomerExperienceSettingsAction({
        wifiEnabled,
        wifiSSID,
        wifiPassword,
        wifiInstructions,
        serviceRequestsEnabled,
        serviceRequestCooldownSeconds: Number(serviceRequestCooldownSeconds),
        notificationSoundEnabled,
        gamesEnabled,
        gameRewardEnabled,
        gameRewardCouponCode,
        gameRewardMinScore: Number(gameRewardMinScore),
        exploreMoreEnabled,
      });

      if (res.error) {
        toast({ title: "Failed to save settings", description: res.error, variant: "destructive" });
      } else {
        toast({ title: "Settings Saved", description: "Customer experience settings updated successfully." });
      }
    } catch {
      toast({ title: "Error", description: "Could not save settings.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  // Add Quiz Question
  const handleCreateQuestion = async () => {
    setIsCreatingQuestion(true);
    try {
      const res = await createQuizQuestionAction({
        question: newQuestionText,
        options: newOptions.filter((o) => o.trim().length > 0),
        correctIndex: newCorrectIndex,
        explanation: newExplanation,
      });

      if (res.error) {
        toast({ title: "Failed to add question", description: res.error, variant: "destructive" });
      } else {
        toast({ title: "Question Added", description: "New trivia question added successfully." });
        setQuestions((prev) => [...prev, res.question]);
        setIsAddQuestionModalOpen(false);
        setNewQuestionText("");
        setNewOptions(["", "", "", ""]);
        setNewCorrectIndex(0);
        setNewExplanation("");
      }
    } catch {
      toast({ title: "Error", description: "Could not add question.", variant: "destructive" });
    } finally {
      setIsCreatingQuestion(false);
    }
  };

  // Delete Question
  const handleDeleteQuestion = async (id: string) => {
    try {
      const res = await deleteQuizQuestionAction(id);
      if (res.success) {
        setQuestions((prev) => prev.filter((q) => q.id !== id));
        toast({ title: "Deleted", description: "Question deleted." });
      } else {
        toast({ title: "Error", description: res.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Could not delete question.", variant: "destructive" });
    }
  };

  // Toggle Question
  const handleToggleQuestion = async (id: string, active: boolean) => {
    try {
      const res = await toggleQuizQuestionAction(id, active);
      if (res.success) {
        setQuestions((prev) =>
          prev.map((q) => (q.id === id ? { ...q, isActive: active } : q))
        );
      }
    } catch {
      toast({ title: "Error", description: "Could not toggle question.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Save Button floating / top bar */}
      <div className="flex items-center justify-between bg-zinc-950 text-white p-4 sm:p-5 rounded-2xl shadow-sm">
        <div>
          <h3 className="font-extrabold text-sm sm:text-base">
            Customer Waiting Experience
          </h3>
          <p className="text-xs text-zinc-400 font-medium">
            Manage Wi-Fi, Call Waiter, Trivia Games & Rewards for diners.
          </p>
        </div>

        <Button
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs h-10 px-5 rounded-xl shadow-xs shrink-0"
        >
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </div>

      {/* SECTION 1: Free Wi-Fi */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-zinc-900">Free Restaurant Wi-Fi</h4>
              <p className="text-xs text-zinc-500 font-medium">
                Provide high-speed Wi-Fi network credentials to seated customers.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-500">
              {wifiEnabled ? "Visible" : "Hidden"}
            </span>
            <Switch checked={wifiEnabled} onCheckedChange={setWifiEnabled} />
          </div>
        </div>

        {wifiEnabled && (
          <div className="p-6 bg-zinc-50/40 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700">
                  Wi-Fi Network Name (SSID)
                </label>
                <Input
                  value={wifiSSID}
                  onChange={(e) => setWifiSSID(e.target.value)}
                  placeholder="e.g. MadrassExpress-Guest"
                  className="bg-white rounded-xl text-xs h-10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700">
                  Wi-Fi Password
                </label>
                <Input
                  value={wifiPassword}
                  onChange={(e) => setWifiPassword(e.target.value)}
                  placeholder="e.g. Dosa@2026"
                  className="bg-white rounded-xl text-xs h-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700">
                Connection Instructions (Optional)
              </label>
              <Input
                value={wifiInstructions}
                onChange={(e) => setWifiInstructions(e.target.value)}
                placeholder="e.g. Select network and enter password. Contact staff if you encounter any issue."
                className="bg-white rounded-xl text-xs h-10"
              />
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: Call Waiter / Service Requests */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-zinc-900">
                Call Waiter & Service Requests
              </h4>
              <p className="text-xs text-zinc-500 font-medium">
                Allow customers to call staff, request water, cutlery, or bills directly from their phones.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-500">
              {serviceRequestsEnabled ? "Enabled" : "Disabled"}
            </span>
            <Switch
              checked={serviceRequestsEnabled}
              onCheckedChange={setServiceRequestsEnabled}
            />
          </div>
        </div>

        {serviceRequestsEnabled && (
          <div className="p-6 bg-zinc-50/40 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700">
                  Request Cooldown Period (Seconds)
                </label>
                <Input
                  type="number"
                  min="10"
                  max="300"
                  value={serviceRequestCooldownSeconds}
                  onChange={(e) => setServiceRequestCooldownSeconds(Number(e.target.value))}
                  className="bg-white rounded-xl text-xs h-10"
                />
                <span className="text-[10px] text-zinc-400">
                  Prevents duplicate button taps from the same table (default 60s).
                </span>
              </div>

              <div className="space-y-1.5 flex flex-col justify-center">
                <label className="text-xs font-bold text-zinc-700">
                  Staff Dashboard Audio Chime
                </label>
                <div className="flex items-center gap-3 pt-1">
                  <Switch
                    checked={notificationSoundEnabled}
                    onCheckedChange={setNotificationSoundEnabled}
                  />
                  <span className="text-xs text-zinc-600 font-medium flex items-center gap-1">
                    <Volume2 className="w-3.5 h-3.5 text-amber-600" />
                    {notificationSoundEnabled ? "Chime enabled on incoming requests" : "Muted"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: Play & Win Trivia Games & Rewards */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-zinc-900">
                Play & Win Food Trivia Games
              </h4>
              <p className="text-xs text-zinc-500 font-medium">
                Keep waiting customers engaged with fun food quizzes and optional rewards.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-500">
              {gamesEnabled ? "Enabled" : "Disabled"}
            </span>
            <Switch checked={gamesEnabled} onCheckedChange={setGamesEnabled} />
          </div>
        </div>

        {gamesEnabled && (
          <div className="p-6 bg-zinc-50/40 space-y-6">
            {/* Reward Configuration */}
            <div className="p-4 bg-white rounded-2xl border border-zinc-200/60 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-xs text-zinc-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Optional Win Rewards
                  </h5>
                  <p className="text-[11px] text-zinc-500 font-medium">
                    Reward customers who achieve the target score on the food trivia quiz.
                  </p>
                </div>

                <Switch
                  checked={gameRewardEnabled}
                  onCheckedChange={setGameRewardEnabled}
                />
              </div>

              {gameRewardEnabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-100">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700">
                      Reward Coupon Code
                    </label>
                    <Input
                      value={gameRewardCouponCode}
                      onChange={(e) => setGameRewardCouponCode(e.target.value)}
                      placeholder="e.g. WINNER10"
                      className="bg-zinc-50 rounded-xl text-xs h-10 font-mono font-bold uppercase"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700">
                      Minimum Score to Win (%)
                    </label>
                    <Input
                      type="number"
                      min="50"
                      max="100"
                      value={gameRewardMinScore}
                      onChange={(e) => setGameRewardMinScore(Number(e.target.value))}
                      className="bg-zinc-50 rounded-xl text-xs h-10"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Quiz Questions Management */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-xs text-zinc-900">
                    Active Quiz Questions ({questions.length})
                  </h5>
                  <p className="text-[11px] text-zinc-500">
                    Questions shown in random order during the waiting quiz.
                  </p>
                </div>

                <Button
                  size="sm"
                  onClick={() => setIsAddQuestionModalOpen(true)}
                  className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Question
                </Button>
              </div>

              <div className="space-y-2">
                {questions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-3.5 bg-white rounded-2xl border border-zinc-200/70 flex items-start justify-between gap-3 shadow-xs"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] bg-zinc-100 font-bold px-1.5 py-0.5 rounded text-zinc-600">
                          #{idx + 1}
                        </span>
                        <h6 className="font-bold text-xs text-zinc-900">
                          {q.question}
                        </h6>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        {q.options.map((opt: string, optIdx: number) => {
                          const isCorrect = optIdx === q.correctIndex;
                          return (
                            <span
                              key={optIdx}
                              className={`text-[10px] px-2 py-1 rounded-lg font-medium flex items-center gap-1 ${
                                isCorrect
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold"
                                  : "bg-zinc-50 text-zinc-600"
                              }`}
                            >
                              {isCorrect && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 shrink-0" />}
                              {opt}
                            </span>
                          );
                        })}
                      </div>

                      {q.explanation && (
                        <p className="text-[10px] text-zinc-400 italic pt-0.5">
                          💡 {q.explanation}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 pt-0.5">
                      <Switch
                        checked={q.isActive}
                        onCheckedChange={(val) => handleToggleQuestion(q.id, val)}
                      />
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Question"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 4: Explore More Visibility */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-xs p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-zinc-900">
              Explore More Popular Dishes
            </h4>
            <p className="text-xs text-zinc-500 font-medium">
              Show recommended add-ons and popular dishes on the customer waiting screen.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-zinc-500">
            {exploreMoreEnabled ? "Enabled" : "Disabled"}
          </span>
          <Switch
            checked={exploreMoreEnabled}
            onCheckedChange={setExploreMoreEnabled}
          />
        </div>
      </div>

      {/* ADD QUESTION MODAL */}
      {isAddQuestionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="font-black text-sm text-zinc-950">Add Trivia Question</h3>
              <button
                onClick={() => setIsAddQuestionModalOpen(false)}
                className="p-1 rounded-full hover:bg-zinc-100 text-zinc-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-700">Question Text</label>
                <Input
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  placeholder="e.g. Which dal is used to make Rasam?"
                  className="text-xs h-10 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-zinc-700 block">
                  Answer Choices (Select the correct option)
                </label>
                {newOptions.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correctOption"
                      checked={newCorrectIndex === i}
                      onChange={() => setNewCorrectIndex(i)}
                      className="w-4 h-4 text-violet-600 focus:ring-violet-500"
                    />
                    <Input
                      value={opt}
                      onChange={(e) => {
                        const updated = [...newOptions];
                        updated[i] = e.target.value;
                        setNewOptions(updated);
                      }}
                      placeholder={`Choice ${i + 1}${i === newCorrectIndex ? " (Correct Answer)" : ""}`}
                      className="text-xs h-9 rounded-xl flex-1"
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-700">
                  Fun Fact / Explanation (Optional)
                </label>
                <Input
                  value={newExplanation}
                  onChange={(e) => setNewExplanation(e.target.value)}
                  placeholder="e.g. Toor dal cooked with tamarind water..."
                  className="text-xs h-10 rounded-xl"
                />
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsAddQuestionModalOpen(false)}
                className="flex-1 rounded-xl text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                disabled={isCreatingQuestion || !newQuestionText.trim()}
                onClick={handleCreateQuestion}
                className="flex-1 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold"
              >
                {isCreatingQuestion ? "Adding..." : "Add Question"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
