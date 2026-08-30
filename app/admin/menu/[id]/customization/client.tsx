"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { createOptionGroup, deleteOptionGroup, createOption, deleteOption } from "./actions";
import { Trash2, Plus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export function CustomizationClient({ product }: { product: any }) {
  const { toast } = useToast();
  
  // Group Form
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [isRequired, setIsRequired] = useState(false);
  const [minSelections, setMinSelections] = useState(0);
  const [maxSelections, setMaxSelections] = useState("");

  // Option Form
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [optName, setOptName] = useState("");
  const [optPrice, setOptPrice] = useState("0");
  const [optMax, setOptMax] = useState("1");

  const handleAddGroup = async () => {
    if (!groupName) return;
    const res = await createOptionGroup(product.id, {
      name: groupName,
      isRequired,
      minSelections: isRequired ? Math.max(1, minSelections) : 0,
      maxSelections: maxSelections ? parseInt(maxSelections) : null,
      order: product.optionGroups.length,
    });
    if (res.error) toast({ title: "Error", description: res.error, variant: "destructive" });
    else {
      setShowGroupForm(false);
      setGroupName("");
    }
  };

  const handleAddOption = async (groupId: string) => {
    if (!optName) return;
    const res = await createOption(groupId, product.id, {
      name: optName,
      price: parseFloat(optPrice),
      maxQuantity: parseInt(optMax),
      isAvailable: true
    });
    if (res.error) toast({ title: "Error", description: res.error, variant: "destructive" });
    else {
      setActiveGroupId(null);
      setOptName("");
      setOptPrice("0");
    }
  };

  return (
    <div className="space-y-8">
      {!showGroupForm ? (
        <Button onClick={() => setShowGroupForm(true)}><Plus className="w-4 h-4 mr-2" /> Add Option Group</Button>
      ) : (
        <div className="p-4 border rounded-xl space-y-4 bg-muted/20">
          <h3 className="font-bold">New Option Group</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Group Name (e.g. Size, Crust, Extras)</Label>
              <Input value={groupName} onChange={e => setGroupName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Max Selections (Leave empty for unlimited)</Label>
              <Input type="number" value={maxSelections} onChange={e => setMaxSelections(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-6 items-center">
            <div className="flex items-center gap-2">
              <Switch checked={isRequired} onCheckedChange={setIsRequired} />
              <Label>Is Required?</Label>
            </div>
            {isRequired && (
              <div className="flex items-center gap-2">
                <Label>Min Selections:</Label>
                <Input type="number" className="w-20" value={minSelections} onChange={e => setMinSelections(parseInt(e.target.value))} />
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAddGroup}>Save Group</Button>
            <Button variant="outline" onClick={() => setShowGroupForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {product.optionGroups.map((group: any) => (
          <div key={group.id} className="border rounded-xl overflow-hidden">
            <div className="bg-muted p-4 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">{group.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {group.isRequired ? `Required (Min ${group.minSelections})` : 'Optional'} 
                  • Max: {group.maxSelections || 'Any'}
                </p>
              </div>
              <Button variant="ghost" className="text-destructive" onClick={() => deleteOptionGroup(group.id, product.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="p-4 space-y-4">
              {group.options.length > 0 ? (
                <div className="grid gap-2">
                  {group.options.map((opt: any) => (
                    <div key={opt.id} className="flex justify-between items-center p-2 border rounded-lg">
                      <div>
                        <span className="font-medium">{opt.name}</span>
                        {opt.maxQuantity > 1 && <span className="ml-2 text-xs bg-secondary px-2 rounded-full">Max {opt.maxQuantity}</span>}
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold">+₹{Number(opt.price).toFixed(2)}</span>
                        <Button variant="ghost" size="sm" onClick={() => deleteOption(opt.id, product.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No options added yet.</p>
              )}

              {activeGroupId === group.id ? (
                <div className="flex gap-2 items-end bg-muted/10 p-2 rounded-lg">
                  <div className="space-y-1 flex-1">
                    <Label>Option Name</Label>
                    <Input value={optName} onChange={e => setOptName(e.target.value)} placeholder="e.g. Extra Cheese" />
                  </div>
                  <div className="space-y-1 w-24">
                    <Label>Price (₹)</Label>
                    <Input type="number" value={optPrice} onChange={e => setOptPrice(e.target.value)} />
                  </div>
                  <div className="space-y-1 w-24">
                    <Label>Max Qty</Label>
                    <Input type="number" value={optMax} onChange={e => setOptMax(e.target.value)} />
                  </div>
                  <Button onClick={() => handleAddOption(group.id)}>Add</Button>
                  <Button variant="ghost" onClick={() => setActiveGroupId(null)}>Cancel</Button>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setActiveGroupId(group.id)}>
                  <Plus className="w-4 h-4 mr-2" /> Add Option
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
