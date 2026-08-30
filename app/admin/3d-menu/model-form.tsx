"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { upsert3DModel, delete3DModel } from "./actions";
import { useToast } from "@/components/ui/use-toast";

type ModelFormProps = {
  product: any; // We'll pass the full product with model3D attached
  isOpen: boolean;
  onClose: () => void;
};

export function ModelForm({ product, isOpen, onClose }: ModelFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [url, setUrl] = useState(product?.model3D?.url || "");
  const [thumbnail, setThumbnail] = useState(product?.model3D?.thumbnail || "");
  const [enabled, setEnabled] = useState(product?.model3D?.enabled ?? true);
  const [autoRotate, setAutoRotate] = useState(product?.model3D?.autoRotate ?? true);
  const [rotationSpeed, setRotationSpeed] = useState<number>(product?.model3D?.rotationSpeed ?? 1.0);

  // Update state when product changes (on modal open)
  useState(() => {
    if (product) {
      setUrl(product.model3D?.url || "");
      setThumbnail(product.model3D?.thumbnail || "");
      setEnabled(product.model3D?.enabled ?? true);
      setAutoRotate(product.model3D?.autoRotate ?? true);
      setRotationSpeed(product.model3D?.rotationSpeed ?? 1.0);
    }
  });

  if (!product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!url) {
      toast({ title: "Error", description: "Model URL is required", variant: "destructive" });
      setLoading(false);
      return;
    }

    const res = await upsert3DModel(product.id, {
      url,
      thumbnail: thumbnail || null,
      enabled,
      autoRotate,
      rotationSpeed,
    });

    if (res.error) {
      toast({ title: "Error", description: res.error, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "3D Model settings saved." });
      onClose();
    }
    
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!product.model3D) return;
    
    setLoading(true);
    const res = await delete3DModel(product.id);
    
    if (res.error) {
      toast({ title: "Error", description: res.error, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "3D Model removed." });
      onClose();
    }
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage 3D Model for {product.name}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">3D Model URL (.glb or .gltf)</Label>
            <Input 
              id="url" 
              placeholder="https://example.com/model.glb" 
              value={url} 
              onChange={e => setUrl(e.target.value)} 
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="thumbnail">Thumbnail URL (Optional)</Label>
            <Input 
              id="thumbnail" 
              placeholder="https://example.com/thumb.jpg" 
              value={thumbnail} 
              onChange={e => setThumbnail(e.target.value)} 
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="enabled">Enable in Kiosk</Label>
            <Switch 
              id="enabled" 
              checked={enabled} 
              onCheckedChange={setEnabled} 
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="autoRotate">Auto-Rotate in Viewer</Label>
            <Switch 
              id="autoRotate" 
              checked={autoRotate} 
              onCheckedChange={setAutoRotate} 
            />
          </div>

          {autoRotate && (
            <div className="space-y-2">
              <Label htmlFor="speed">Rotation Speed</Label>
              <Input 
                id="speed" 
                type="number" 
                step="0.1"
                min="0.1"
                max="10"
                value={rotationSpeed} 
                onChange={e => setRotationSpeed(parseFloat(e.target.value))} 
              />
            </div>
          )}

          <div className="flex justify-between pt-4">
            {product.model3D ? (
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading}>
                Remove Model
              </Button>
            ) : <div></div>}
            
            <div className="space-x-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                Save Model
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
