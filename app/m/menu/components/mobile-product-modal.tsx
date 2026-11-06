"use client";

import { useState, useEffect } from "react";
import { MobileProduct, MobileOptionGroup, MobileOption } from "../types";
import { useMobileCartStore, MobileCartOption } from "@/lib/store/mobile-cart-store";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Minus, Check, AlertCircle, UtensilsCrossed, X } from "lucide-react";
import Image from "next/image";

interface MobileProductModalProps {
  product: MobileProduct | null;
  isOpen: boolean;
  onClose: () => void;
}

export function MobileProductModal({ product, isOpen, onClose }: MobileProductModalProps) {
  const addToCart = useMobileCartStore((state) => state.addToCart);

  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, MobileCartOption>>({});
  const [notes, setNotes] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && product) {
      setQuantity(1);
      setNotes("");
      setValidationError(null);

      // Auto-select first option for required single-choice groups if any
      const initialOptions: Record<string, MobileCartOption> = {};
      product.optionGroups.forEach((group) => {
        if (group.isRequired && group.maxSelections === 1 && group.options.length > 0) {
          const firstOpt = group.options[0];
          initialOptions[`${group.id}-${firstOpt.id}`] = {
            optionId: firstOpt.id,
            name: firstOpt.name,
            price: firstOpt.price,
            quantity: 1,
          };
        }
      });
      setSelectedOptions(initialOptions);
    }
  }, [isOpen, product]);

  if (!product) return null;

  const handleOptionToggle = (group: MobileOptionGroup, option: MobileOption) => {
    const key = `${group.id}-${option.id}`;
    const newSelected = { ...selectedOptions };

    if (group.maxSelections === 1) {
      // Radio mode: Clear other selections in this group
      Object.keys(newSelected).forEach((k) => {
        if (k.startsWith(`${group.id}-`)) {
          delete newSelected[k];
        }
      });
      newSelected[key] = {
        optionId: option.id,
        name: option.name,
        price: option.price,
        quantity: 1,
      };
    } else {
      // Checkbox mode
      if (newSelected[key]) {
        delete newSelected[key];
      } else {
        const countInGroup = Object.keys(newSelected).filter((k) => k.startsWith(`${group.id}-`)).length;
        if (group.maxSelections && countInGroup >= group.maxSelections) {
          setValidationError(`You can select at most ${group.maxSelections} option(s) for ${group.name}.`);
          return;
        }
        newSelected[key] = {
          optionId: option.id,
          name: option.name,
          price: option.price,
          quantity: 1,
        };
      }
    }

    setValidationError(null);
    setSelectedOptions(newSelected);
  };

  const handleOptionQuantity = (group: MobileOptionGroup, option: MobileOption, delta: number) => {
    const key = `${group.id}-${option.id}`;
    const newSelected = { ...selectedOptions };

    if (newSelected[key]) {
      const nextQ = newSelected[key].quantity + delta;
      if (nextQ <= 0) {
        delete newSelected[key];
      } else if (nextQ <= option.maxQuantity) {
        newSelected[key] = { ...newSelected[key], quantity: nextQ };
      }
      setSelectedOptions(newSelected);
    }
  };

  // Calculate live item price
  const optionsTotal = Object.values(selectedOptions).reduce(
    (sum, opt) => sum + opt.price * opt.quantity,
    0
  );
  const singleItemTotal = product.price + optionsTotal;
  const grandItemTotal = singleItemTotal * quantity;

  // Validate required groups
  const validateSelections = (): boolean => {
    for (const group of product.optionGroups) {
      const selectionsInGroup = Object.keys(selectedOptions).filter((k) =>
        k.startsWith(`${group.id}-`)
      );
      if (group.isRequired && selectionsInGroup.length < Math.max(1, group.minSelections)) {
        setValidationError(`Please select an option for required group: ${group.name}`);
        return false;
      }
    }
    return true;
  };

  const handleAddToCart = () => {
    if (!validateSelections()) return;

    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity,
      options: Object.values(selectedOptions),
      notes: notes.trim() || undefined,
      isVegetarian: product.isVegetarian,
      imageUrl: product.imageUrl,
    });

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl max-h-[92vh] flex flex-col bg-white">
        {/* Header / Image Area */}
        <div className="relative w-full h-48 bg-stone-100 shrink-0">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-amber-600/40 bg-amber-500/5">
              <UtensilsCrossed className="w-12 h-12 mb-1" />
              <span className="text-xs font-bold text-amber-700/60 uppercase tracking-widest">
                Madrass Express
              </span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center backdrop-blur-md hover:bg-black/60 transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Veg indicator & Category */}
          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white z-10">
            <div className="flex items-center gap-2">
              <div
                className={`w-4 h-4 border-2 flex items-center justify-center rounded-sm bg-white ${
                  product.isVegetarian ? "border-emerald-600" : "border-red-600"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    product.isVegetarian ? "bg-emerald-600" : "bg-red-600"
                  }`}
                />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                {product.categoryName}
              </span>
            </div>
            <span className="text-xl font-black tracking-tight text-white drop-shadow">
              ₹{product.price}
            </span>
          </div>
        </div>

        {/* Scrollable Customization Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
          <div>
            <h2 className="text-xl font-black text-zinc-950 tracking-tight">
              {product.name}
            </h2>
            {product.description && (
              <p className="text-xs text-zinc-500 font-medium mt-1 leading-relaxed">
                {product.description}
              </p>
            )}
          </div>

          {/* Validation Error banner */}
          {validationError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Option Groups */}
          {product.optionGroups.map((group) => {
            const isSingleChoice = group.maxSelections === 1;

            return (
              <div key={group.id} className="space-y-2.5 pt-2 border-t border-zinc-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-sm text-zinc-900">
                      {group.name}
                    </span>
                    {group.isRequired ? (
                      <span className="bg-amber-100 text-amber-800 font-bold text-[10px] px-2 py-0.5 rounded-full">
                        Required
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-zinc-400">
                        Optional
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-zinc-400 font-medium">
                    {isSingleChoice ? "Choose 1" : `Up to ${group.maxSelections || "any"}`}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {group.options.map((option) => {
                    const isSelected = !!selectedOptions[`${group.id}-${option.id}`];
                    const selectedOpt = selectedOptions[`${group.id}-${option.id}`];

                    return (
                      <div
                        key={option.id}
                        onClick={() => handleOptionToggle(group, option)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? "bg-amber-50/70 border-amber-300 shadow-sm"
                            : "bg-white border-zinc-100 hover:border-zinc-200"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${
                              isSelected
                                ? "bg-amber-600 border-amber-600 text-white"
                                : "border-zinc-300 bg-white"
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className={`text-sm font-semibold ${isSelected ? "text-amber-950 font-bold" : "text-zinc-800"}`}>
                            {option.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-zinc-900">
                            {option.price > 0 ? `+₹${option.price}` : "Free"}
                          </span>

                          {/* Multi-quantity for add-ons if maxQuantity > 1 */}
                          {!isSingleChoice && option.maxQuantity > 1 && isSelected && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1 bg-white border border-zinc-200 rounded-lg p-0.5 ml-1"
                            >
                              <button
                                onClick={() => handleOptionQuantity(group, option, -1)}
                                className="w-5 h-5 flex items-center justify-center text-zinc-600 hover:text-black"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-xs font-bold px-1 min-w-[16px] text-center">
                                {selectedOpt?.quantity || 1}
                              </span>
                              <button
                                onClick={() => handleOptionQuantity(group, option, 1)}
                                className="w-5 h-5 flex items-center justify-center text-zinc-600 hover:text-black"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
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

          {/* Cooking notes */}
          <div className="space-y-1.5 pt-2 border-t border-zinc-100">
            <label className="text-xs font-bold text-zinc-700">
              Special Instructions / Requests (Optional)
            </label>
            <Textarea
              placeholder="e.g., Less spicy, extra crispy dosa, chutney on the side..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs bg-zinc-50 border-zinc-200 rounded-xl resize-none"
              rows={2}
            />
          </div>
        </div>

        {/* Bottom Sticky Action Footer */}
        <div className="p-4 border-t border-zinc-100 bg-white shrink-0 flex items-center gap-3">
          {/* Quantity stepper */}
          <div className="flex items-center gap-2 bg-zinc-100 border border-zinc-200 rounded-2xl px-2 py-1">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-700 hover:bg-white disabled:opacity-30 transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="font-extrabold text-sm min-w-[20px] text-center">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-700 hover:bg-white transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add to Cart Button */}
          <Button
            onClick={handleAddToCart}
            className="flex-1 h-12 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-sm rounded-2xl shadow-md shadow-amber-600/20 flex items-center justify-between px-5"
          >
            <span>Add to Cart</span>
            <span>₹{grandItemTotal}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
