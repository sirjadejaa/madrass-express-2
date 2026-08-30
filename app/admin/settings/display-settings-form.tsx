"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

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
        toast({ title: "Settings Saved" });
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center space-x-4">
        <Switch 
          id="enableVoice" 
          checked={enableVoice} 
          onCheckedChange={setEnableVoice} 
        />
        <Label htmlFor="enableVoice">Enable Voice Announcements</Label>
      </div>

      {enableVoice && (
        <div className="space-y-2">
          <Label htmlFor="voiceVolume">Voice Volume (0.1 to 1.0)</Label>
          <Input 
            id="voiceVolume" 
            type="number" 
            step="0.1" 
            min="0.1" 
            max="1.0" 
            value={voiceVolume} 
            onChange={(e) => setVoiceVolume(e.target.value)} 
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="tokensCount">Max Tokens to Display (per column)</Label>
        <Input 
          id="tokensCount" 
          type="number" 
          min="1" 
          max="20" 
          value={tokensCount} 
          onChange={(e) => setTokensCount(e.target.value)} 
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="brandLogoUrl">Brand Logo URL (Optional)</Label>
        <Input 
          id="brandLogoUrl" 
          type="url" 
          placeholder="https://example.com/logo.png"
          value={brandLogoUrl} 
          onChange={(e) => setBrandLogoUrl(e.target.value)} 
        />
      </div>

      <Button type="submit" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Settings
      </Button>
    </form>
  );
}
