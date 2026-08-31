"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Monitor, Volume2, Hash, Image as ImageIcon, Save } from "lucide-react";

export function DisplaySettingsForm({ initialData }: { initialData: any }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [enableVoice, setEnableVoice] = useState(initialData?.enableVoice ?? true);
  const [voiceVolume, setVoiceVolume] = useState(initialData?.voiceVolume ?? 1.0);
  const [tokensCount, setTokensCount] = useState(initialData?.tokensCount ?? 6);
  const [brandLogoUrl, setBrandLogoUrl] = useState(initialData?.brandLogoUrl ?? "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/display/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enableVoice,
          voiceVolume: Number(voiceVolume),
          tokensCount: Number(tokensCount),
          brandLogoUrl
        })
      });

      const data = await res.json();
      if (data.success) {
        toast({ title: "Settings Saved", description: "Display settings have been updated successfully." });
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in duration-500">
      
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          {/* Voice Announcement Toggle */}
          <div className="bg-white rounded-2xl border border-zinc-100 p-5 shadow-sm transition-all hover:border-zinc-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
                  <Volume2 className="h-5 w-5" />
                </div>
                <div>
                  <Label htmlFor="enableVoice" className="text-base font-bold text-zinc-950 block">Voice Announcements</Label>
                  <span className="text-xs font-medium text-zinc-500 mt-0.5 block">Announce token numbers via audio</span>
                </div>
              </div>
              <Switch 
                id="enableVoice" 
                checked={enableVoice} 
                onCheckedChange={setEnableVoice} 
                className="data-[state=checked]:bg-emerald-500"
              />
            </div>

            {/* Conditional Volume Slider (using a number input styled nicely) */}
            <div className={`overflow-hidden transition-all duration-300 ${enableVoice ? 'max-h-24 opacity-100 mt-6 pt-4 border-t border-zinc-100' : 'max-h-0 opacity-0'}`}>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label htmlFor="voiceVolume" className="text-sm font-semibold text-zinc-700">Volume Level</Label>
                  <span className="text-xs font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-md">{Number(voiceVolume).toFixed(1)}</span>
                </div>
                <div className="relative flex items-center">
                  <Input 
                    id="voiceVolume" 
                    type="range" 
                    step="0.1" 
                    min="0.1" 
                    max="1.0" 
                    value={voiceVolume} 
                    onChange={(e) => setVoiceVolume(e.target.value)} 
                    className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tokens Count */}
          <div className="bg-white rounded-2xl border border-zinc-100 p-5 shadow-sm transition-all hover:border-zinc-200">
            <div className="flex items-start space-x-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
                <Hash className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <Label htmlFor="tokensCount" className="text-base font-bold text-zinc-950 block mb-1">Tokens Display Count</Label>
                <span className="text-xs font-medium text-zinc-500 block mb-4">Max tokens shown per column (Preparing/Ready)</span>
                
                <div className="relative">
                  <Input 
                    id="tokensCount" 
                    type="number" 
                    min="1" 
                    max="20" 
                    value={tokensCount} 
                    onChange={(e) => setTokensCount(e.target.value)} 
                    className="w-full h-11 bg-zinc-50 border-zinc-200 rounded-xl focus-visible:ring-amber-500/20 pl-4 font-semibold text-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Brand Logo URL */}
          <div className="bg-white rounded-2xl border border-zinc-100 p-5 shadow-sm transition-all hover:border-zinc-200">
            <div className="flex items-start space-x-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                <ImageIcon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <Label htmlFor="brandLogoUrl" className="text-base font-bold text-zinc-950 block mb-1">Brand Logo URL</Label>
                <span className="text-xs font-medium text-zinc-500 block mb-4">Displayed on the TV screen (Optional)</span>
                
                <div className="relative">
                  <Input 
                    id="brandLogoUrl" 
                    type="url" 
                    placeholder="https://example.com/logo.png"
                    value={brandLogoUrl} 
                    onChange={(e) => setBrandLogoUrl(e.target.value)} 
                    className="w-full h-11 bg-zinc-50 border-zinc-200 rounded-xl focus-visible:ring-blue-500/20 pl-4 text-sm"
                  />
                </div>
                
                {brandLogoUrl && (
                  <div className="mt-4 p-4 border border-zinc-100 rounded-xl bg-zinc-50/50 flex justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={brandLogoUrl} 
                      alt="Brand Logo Preview" 
                      className="max-h-24 max-w-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23a1a1aa" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-zinc-100">
        <Button 
          type="submit" 
          disabled={loading}
          className="h-12 px-8 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold shadow-sm transition-all"
        >
          {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
          Save Display Settings
        </Button>
      </div>
    </form>
  );
}
