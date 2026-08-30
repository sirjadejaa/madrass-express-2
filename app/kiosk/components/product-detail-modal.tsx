"use client";

import { useState } from "react";
import { KioskProduct, KioskOptionGroup, KioskOption } from "../menu/types";
import { useKioskStore, CartItemOption } from "@/lib/store/kiosk-store";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Minus, AlertCircle } from "lucide-react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { ErrorBoundary } from "./error-boundary";

const FoodViewer3D = dynamic(() => import("./food-viewer-3d"), { ssr: false });

interface ProductDetailModalProps {
  product: KioskProduct | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductDetailModal({ product, isOpen, onClose }: ProductDetailModalProps) {
  const addToCart = useKioskStore((state) => state.addToCart);
  
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, CartItemOption>>({});
  const [selectedRecommendations, setSelectedRecommendations] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [viewerKey, setViewerKey] = useState(0);
  const [showValidation, setShowValidation] = useState(false);

  // Reset state when a new product is opened
  useState(() => {
    if (isOpen) {
      setQuantity(1);
      setSelectedOptions({});
      setSelectedRecommendations([]);
      setNotes("");
      setShowValidation(false);
      setViewerKey(v => v + 1);
    }
  });

  if (!product) return null;

  const handleOptionChange = (group: KioskOptionGroup, option: KioskOption, isSelected: boolean) => {
    const newSelected = { ...selectedOptions };
    const key = `${group.id}-${option.id}`;

    if (group.maxSelections === 1) {
      // Radio behavior: Clear other selections in this group
      Object.keys(newSelected).forEach(k => {
        if (k.startsWith(`${group.id}-`)) {
          delete newSelected[k];
        }
      });
      if (isSelected) {
        newSelected[key] = {
          id: Math.random().toString(36).substring(2, 9),
          optionId: option.id,
          name: option.name,
          price: option.price,
          quantity: 1,
        };
      }
    } else {
      // Checkbox behavior
      if (isSelected) {
        // Enforce maxSelections if set
        const currentGroupSelections = Object.keys(newSelected).filter(k => k.startsWith(`${group.id}-`)).length;
        if (group.maxSelections && currentGroupSelections >= group.maxSelections) {
          return; // Max reached
        }
        
        newSelected[key] = {
          id: Math.random().toString(36).substring(2, 9),
          optionId: option.id,
          name: option.name,
          price: option.price,
          quantity: 1,
        };
      } else {
        delete newSelected[key];
      }
    }
    
    setSelectedOptions(newSelected);
  };

  const handleOptionQuantity = (group: KioskOptionGroup, option: KioskOption, delta: number) => {
    const key = `${group.id}-${option.id}`;
    const newSelected = { ...selectedOptions };
    
    if (newSelected[key]) {
      const newQuantity = newSelected[key].quantity + delta;
      if (newQuantity <= 0) {
        delete newSelected[key];
      } else if (newQuantity <= option.maxQuantity) {
        newSelected[key].quantity = newQuantity;
      }
    } else if (delta > 0) {
      handleOptionChange(group, option, true);
      return;
    }
    
    setSelectedOptions(newSelected);
  };

  // Validation
  const validationErrors: string[] = [];
  if (product) {
    product.optionGroups?.forEach(group => {
      const selectedCount = Object.keys(selectedOptions).filter(k => k.startsWith(`${group.id}-`)).length;
      if (group.isRequired && selectedCount < group.minSelections) {
        validationErrors.push(`${group.name} is required (select at least ${group.minSelections})`);
      }
    });
  }

  const calculateTotal = () => {
    const basePrice = Number(product.price);
    const optionsPrice = Object.values(selectedOptions).reduce((sum, opt) => sum + (Number(opt.price) * opt.quantity), 0);
    const recsPrice = product.recommendations?.filter(r => selectedRecommendations.includes(r.id)).reduce((sum, r) => sum + r.price, 0) || 0;
    return (basePrice + optionsPrice) * quantity + recsPrice;
  };

  const handleAddToOrder = () => {
    if (validationErrors.length > 0) {
      setShowValidation(true);
      return;
    }

    // Add main product
    addToCart({
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      quantity,
      options: Object.values(selectedOptions),
      notes: notes.trim() || undefined,
    });
    
    // Add selected recommendations
    product.recommendations?.forEach(rec => {
      if (selectedRecommendations.includes(rec.id)) {
        addToCart({
          productId: rec.id,
          name: rec.name,
          price: rec.price,
          quantity: 1,
          options: [],
        });
      }
    });
    
    onClose();
  };

  const has3DModel = product.model3D && product.model3D.enabled;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden hide-close-button border-0 h-[85vh] flex flex-col">
        <div className="flex-1 overflow-y-auto bg-background">
          {/* Image/3D Header */}
          <div className="relative w-full h-80 bg-orange-100 dark:bg-zinc-800 shrink-0">
            {has3DModel ? (
              <ErrorBoundary fallback={
                product.image ? (
                  <Image src={product.image.url} alt={product.name} fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-6xl">🍲</div>
                )
              }>
                <FoodViewer3D 
                  key={viewerKey}
                  modelUrl={product.model3D!.url} 
                  autoRotate={product.model3D!.autoRotate} 
                  rotationSpeed={product.model3D!.rotationSpeed} 
                />
              </ErrorBoundary>
            ) : product.image ? (
              <Image 
                src={product.image.url} 
                alt={product.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-6xl">
                🍲
              </div>
            )}
            
            <div className="absolute top-4 right-4 flex flex-col gap-2 z-50">
              <Button 
                variant="secondary" 
                className="rounded-full w-12 h-12 shadow-md bg-background/80 backdrop-blur-sm hover:bg-background"
                onClick={onClose}
              >
                ✕
              </Button>
            </div>

            {has3DModel && (
              <div className="absolute bottom-4 right-4 z-50">
                <Button 
                  variant="secondary" 
                  size="sm"
                  className="shadow-md bg-background/80 backdrop-blur-sm"
                  onClick={() => setViewerKey(v => v + 1)}
                >
                  Reset Camera
                </Button>
              </div>
            )}
          </div>

          <div className="p-8 space-y-8">
            {/* Title & Description */}
            <div>
              <div className="flex justify-between items-start">
                <h2 className="text-4xl font-bold">{product.name}</h2>
                <span className="text-3xl font-bold">₹{Number(product.price).toFixed(2)}</span>
              </div>
              {product.description && (
                <p className="text-xl text-muted-foreground mt-4">{product.description}</p>
              )}
            </div>

            {showValidation && validationErrors.length > 0 && (
              <div className="bg-destructive/10 text-destructive p-4 rounded-xl flex flex-col gap-2 border border-destructive/20">
                <div className="flex items-center gap-2 font-bold text-lg">
                  <AlertCircle className="h-5 w-5" />
                  Please complete required selections
                </div>
                <ul className="list-disc pl-6">
                  {validationErrors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              </div>
            )}

            {/* Option Groups */}
            {product.optionGroups?.map(group => {
              const isRadio = group.maxSelections === 1;
              const selectedCount = Object.keys(selectedOptions).filter(k => k.startsWith(`${group.id}-`)).length;
              const groupError = showValidation && group.isRequired && selectedCount < group.minSelections;

              return (
                <div key={group.id} className="space-y-4">
                  <div className="flex justify-between items-end border-b pb-2">
                    <div>
                      <h3 className="text-2xl font-semibold flex items-center gap-2">
                        {group.name}
                        {group.isRequired && <span className="text-sm bg-destructive/10 text-destructive px-2 py-0.5 rounded uppercase tracking-wider font-bold">Required</span>}
                      </h3>
                      <p className="text-muted-foreground">
                        {isRadio ? "Choose 1" : `Choose up to ${group.maxSelections || 'any'}`}
                      </p>
                    </div>
                  </div>

                  <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${groupError ? 'p-2 rounded-xl border-2 border-destructive border-dashed' : ''}`}>
                    {group.options.map(option => {
                      const key = `${group.id}-${option.id}`;
                      const selectedOpt = selectedOptions[key];
                      const isSelected = !!selectedOpt;
                      const isDisabled = !isSelected && !isRadio && group.maxSelections && selectedCount >= group.maxSelections;

                      return (
                        <div 
                          key={option.id} 
                          className={`flex items-center justify-between p-4 border rounded-xl transition-colors ${isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'} ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          onClick={() => {
                            if (!isDisabled && option.maxQuantity === 1) {
                              handleOptionChange(group, option, !isSelected);
                            }
                          }}
                        >
                          <div className="flex items-center space-x-3">
                            {isRadio ? (
                              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-primary' : 'border-muted-foreground'}`}>
                                {isSelected && <div className="w-3 h-3 rounded-full bg-primary" />}
                              </div>
                            ) : option.maxQuantity === 1 ? (
                              <Checkbox 
                                checked={isSelected}
                                disabled={isDisabled}
                                className="w-6 h-6 pointer-events-none"
                              />
                            ) : null}
                            
                            <label className={`text-lg font-medium ${isDisabled ? 'pointer-events-none' : 'cursor-pointer'}`}>
                              {option.name}
                            </label>
                          </div>

                          <div className="flex items-center gap-4">
                            {Number(option.price) > 0 && (
                              <span className="font-semibold text-lg">+₹{Number(option.price).toFixed(2)}</span>
                            )}
                            
                            {/* Quantity Selector for options that support multiples (e.g. maxQuantity > 1) */}
                            {option.maxQuantity > 1 && (
                              <div className="flex items-center gap-2 bg-background border rounded-lg p-1" onClick={e => e.stopPropagation()}>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 rounded-md"
                                  onClick={() => handleOptionQuantity(group, option, -1)}
                                  disabled={!isSelected}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="w-6 text-center font-bold">
                                  {isSelected ? selectedOpt.quantity : 0}
                                </span>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 rounded-md"
                                  onClick={() => handleOptionQuantity(group, option, 1)}
                                  disabled={isDisabled || (isSelected && selectedOpt.quantity >= option.maxQuantity)}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Special Instructions */}
            <div className="space-y-4">
              <h3 className="text-2xl font-semibold border-b pb-2">Special Instructions</h3>
              <Textarea 
                placeholder="Any specific requests? (e.g. Less spicy, Extra sambar)"
                className="text-lg p-4 min-h-[120px] rounded-xl"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            
            {/* Upselling Recommendations */}
            {product.recommendations && product.recommendations.length > 0 && (
              <div className="space-y-4 mt-8 bg-primary/5 p-6 rounded-2xl border border-primary/10">
                <h3 className="text-2xl font-bold flex items-center gap-2 text-primary">
                  Complete your meal
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {product.recommendations.map(rec => {
                    const isSelected = selectedRecommendations.includes(rec.id);
                    return (
                      <div 
                        key={rec.id} 
                        className={`flex items-center gap-4 p-4 border rounded-xl transition-colors cursor-pointer bg-background ${isSelected ? 'border-primary shadow-sm' : 'hover:border-primary/50'}`}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedRecommendations(prev => prev.filter(id => id !== rec.id));
                          } else {
                            setSelectedRecommendations(prev => [...prev, rec.id]);
                          }
                        }}
                      >
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted shrink-0">
                          {rec.image ? (
                            <Image src={rec.image.url} alt={rec.name} fill className="object-cover" />
                          ) : (
                            <div className="flex w-full h-full items-center justify-center text-2xl">🍲</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-lg truncate">{rec.name}</h4>
                          <span className="text-muted-foreground">+₹{rec.price.toFixed(2)}</span>
                        </div>
                        <Checkbox 
                          checked={isSelected}
                          className="w-6 h-6 pointer-events-none"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-background border-t shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-10 flex items-center justify-between gap-6 shrink-0">
          <div className="flex items-center gap-4 bg-muted p-2 rounded-2xl">
            <Button 
              variant="ghost" 
              size="icon" 
              className="w-14 h-14 rounded-xl"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
            >
              <Minus className="w-8 h-8" />
            </Button>
            <span className="text-3xl font-bold w-12 text-center">{quantity}</span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="w-14 h-14 rounded-xl"
              onClick={() => setQuantity(quantity + 1)}
            >
              <Plus className="w-8 h-8" />
            </Button>
          </div>

          <Button 
            size="lg" 
            className="flex-1 h-20 text-2xl rounded-2xl shadow-lg hover:scale-[1.02] transition-transform"
            onClick={handleAddToOrder}
          >
            Add to Order - ₹{calculateTotal().toFixed(2)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
