import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { OrderType } from '@prisma/client';

export type CartItemOption = {
  id: string; // Random internal id
  optionId: string;
  name: string;
  price: number;
  quantity: number;
};

export type CartItem = {
  id: string; // Unique id for the cart item
  productId: string;
  name: string;
  price: number;
  quantity: number;
  options: CartItemOption[];
  notes?: string;
  isAvailable?: boolean;
};

interface KioskState {
  // Session / Flow State
  orderType: OrderType | null;
  tableId: string | null;
  tableName: string | null;
  isQRSession: boolean;
  
  // Cart State
  cart: CartItem[];
  appliedCouponCode: string | null;
  discountAmount: number;
  
  // Actions
  setOrderType: (type: OrderType | null) => void;
  setTable: (id: string, name: string) => void;
  setQRSession: (active: boolean) => void;
  
  addToCart: (item: Omit<CartItem, 'id'>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  markItemsUnavailable: (productIds: string[]) => void;
  
  applyCoupon: (code: string, discount: number) => void;
  removeCoupon: () => void;
  
  // Tax State
  taxPercent: number;
  setTaxPercent: (tax: number) => void;
  
  resetKiosk: () => void; // Used for timeouts or completed orders
}

const generateId = () => Math.random().toString(36).substring(2, 9);

export const useKioskStore = create<KioskState>()(
  persist(
    (set) => ({
      orderType: null,
      tableId: null,
      tableName: null,
      isQRSession: false,
      cart: [],
      appliedCouponCode: null,
      discountAmount: 0,
      taxPercent: 5.0, // Default fallback
      
      setTaxPercent: (tax) => set({ taxPercent: tax }),
      setOrderType: (type) => set({ orderType: type }),
      setTable: (id, name) => set({ tableId: id, tableName: name }),
      setQRSession: (active) => set({ isQRSession: active }),
      
      addToCart: (item) => set((state) => {
        // Check if identical item exists (same productId, options with same quantities, notes)
        const existingItemIndex = state.cart.findIndex(
          (c) => {
            if (c.productId !== item.productId || c.notes !== item.notes) return false;
            
            // Sort and stringify options to compare
            const sortOptions = (opts: CartItemOption[]) => 
              [...opts].sort((a, b) => a.optionId.localeCompare(b.optionId)).map(o => `${o.optionId}:${o.quantity}`);
              
            return JSON.stringify(sortOptions(c.options)) === JSON.stringify(sortOptions(item.options));
          }
        );

        if (existingItemIndex >= 0) {
          // Update quantity of existing item
          const newCart = [...state.cart];
          newCart[existingItemIndex].quantity += item.quantity;
          return { cart: newCart };
        }

        // Add new item
        return { cart: [...state.cart, { ...item, id: generateId() }] };
      }),
      
      removeFromCart: (id) => set((state) => ({
        cart: state.cart.filter((item) => item.id !== id)
      })),
      
      updateQuantity: (id, quantity) => set((state) => {
        if (quantity <= 0) {
          return { cart: state.cart.filter((item) => item.id !== id) };
        }
        return {
          cart: state.cart.map((item) => 
            item.id === id ? { ...item, quantity } : item
          )
        };
      }),
      
      clearCart: () => set({ cart: [], appliedCouponCode: null, discountAmount: 0 }),
      
      markItemsUnavailable: (productIds) => set((state) => ({
        cart: state.cart.map((item) => 
          productIds.includes(item.productId) 
            ? { ...item, isAvailable: false } 
            : item
        )
      })),
      
      applyCoupon: (code, discount) => set({ appliedCouponCode: code, discountAmount: discount }),
      removeCoupon: () => set({ appliedCouponCode: null, discountAmount: 0 }),
      
      resetKiosk: () => set((state) => {
        if (state.isQRSession) {
          // If in table QR session, preserve table assignment and orderType!
          return {
            cart: [],
            appliedCouponCode: null,
            discountAmount: 0,
          };
        }
        return {
          orderType: null,
          tableId: null,
          tableName: null,
          cart: [],
          appliedCouponCode: null,
          discountAmount: 0,
        };
      }),
    }),
    {
      name: "madrass_order_store_v2",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" && window.localStorage
          ? window.localStorage
          : {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            }
      ),
      partialize: (state) => ({
        orderType: state.orderType,
        tableId: state.tableId,
        tableName: state.tableName,
        isQRSession: state.isQRSession,
        cart: state.cart,
        appliedCouponCode: state.appliedCouponCode,
        discountAmount: state.discountAmount,
      }),
    }
  )
);
