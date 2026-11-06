import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { OrderType } from "@prisma/client";

export type MobileCartOption = {
  optionId: string;
  name: string;
  price: number;
  quantity: number;
};

export type MobileCartItem = {
  id: string; // Unique instance id in cart
  productId: string;
  name: string;
  price: number;
  quantity: number;
  options: MobileCartOption[];
  notes?: string;
  isVegetarian?: boolean;
  imageUrl?: string | null;
};

interface MobileCartState {
  // Session Context
  restaurantId: string | null;
  restaurantName: string | null;
  tableId: string | null;
  tableName: string | null;
  orderType: OrderType;
  
  // Cart Items
  cart: MobileCartItem[];
  appliedCouponCode: string | null;
  discountAmount: number;
  taxPercent: number;

  // Customer Contact Info (Saved for convenience)
  customerName: string;
  customerPhone: string;

  // Idempotency
  idempotencyKey: string;

  // Actions
  setTableContext: (data: {
    restaurantId: string;
    restaurantName: string;
    tableId: string;
    tableName: string;
  }) => void;
  setOrderType: (type: OrderType) => void;
  setCustomerInfo: (name: string, phone: string) => void;
  addToCart: (item: Omit<MobileCartItem, "id">) => void;
  updateQuantity: (id: string, delta: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  applyCoupon: (code: string, discount: number) => void;
  removeCoupon: () => void;
  setTaxPercent: (tax: number) => void;
  regenerateIdempotencyKey: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 10);
const generateIdempotency = () => `qr_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

export const useMobileCartStore = create<MobileCartState>()(
  persist(
    (set) => ({
      restaurantId: null,
      restaurantName: null,
      tableId: null,
      tableName: null,
      orderType: OrderType.DINE_IN,
      cart: [],
      appliedCouponCode: null,
      discountAmount: 0,
      taxPercent: 5.0,
      customerName: "",
      customerPhone: "",
      idempotencyKey: generateIdempotency(),

      setTableContext: ({ restaurantId, restaurantName, tableId, tableName }) =>
        set(() => ({
          restaurantId,
          restaurantName,
          tableId,
          tableName,
          orderType: OrderType.DINE_IN,
        })),

      setOrderType: (type) => set({ orderType: type }),

      setCustomerInfo: (name, phone) =>
        set({ customerName: name, customerPhone: phone }),

      addToCart: (item) =>
        set((state) => {
          // Check if identical item already exists in cart (same product, same options, same notes)
          const sortOpts = (opts: MobileCartOption[]) =>
            [...opts]
              .sort((a, b) => a.optionId.localeCompare(b.optionId))
              .map((o) => `${o.optionId}:${o.quantity}`)
              .join("|");

          const itemOptSig = sortOpts(item.options);

          const existingIndex = state.cart.findIndex(
            (c) =>
              c.productId === item.productId &&
              (c.notes || "").trim() === (item.notes || "").trim() &&
              sortOpts(c.options) === itemOptSig
          );

          if (existingIndex >= 0) {
            const updated = [...state.cart];
            updated[existingIndex].quantity += item.quantity;
            return { cart: updated };
          }

          return {
            cart: [...state.cart, { ...item, id: generateId() }],
          };
        }),

      updateQuantity: (id, delta) =>
        set((state) => {
          const updated = state.cart
            .map((item) => {
              if (item.id === id) {
                const newQ = item.quantity + delta;
                return newQ > 0 ? { ...item, quantity: newQ } : null;
              }
              return item;
            })
            .filter(Boolean) as MobileCartItem[];

          return { cart: updated };
        }),

      removeFromCart: (id) =>
        set((state) => ({
          cart: state.cart.filter((item) => item.id !== id),
        })),

      clearCart: () =>
        set({
          cart: [],
          appliedCouponCode: null,
          discountAmount: 0,
          idempotencyKey: generateIdempotency(),
        }),

      applyCoupon: (code, discount) =>
        set({ appliedCouponCode: code, discountAmount: discount }),

      removeCoupon: () =>
        set({ appliedCouponCode: null, discountAmount: 0 }),

      setTaxPercent: (tax) => set({ taxPercent: tax }),

      regenerateIdempotencyKey: () =>
        set({ idempotencyKey: generateIdempotency() }),
    }),
    {
      name: "madrass_mobile_cart_v1",
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
        restaurantId: state.restaurantId,
        restaurantName: state.restaurantName,
        tableId: state.tableId,
        tableName: state.tableName,
        orderType: state.orderType,
        cart: state.cart,
        appliedCouponCode: state.appliedCouponCode,
        discountAmount: state.discountAmount,
        customerName: state.customerName,
        customerPhone: state.customerPhone,
        idempotencyKey: state.idempotencyKey,
      }),
    }
  )
);
