"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/** A customization choice the customer selected for a cart item */
export interface CartCustomization {
  type: string;
  label: string;
  selectedValue: string;
  priceModifier: number;
}

/** A single item in the cart */
export interface CartItem {
  productId: string;
  productName: string;
  productSlug: string;
  productImage: string;
  basePrice: number;
  customizations: CartCustomization[];
  quantity: number;
  /** basePrice + sum of customization priceModifiers */
  unitPrice: number;
  referenceImage?: string;
  designDescription?: string;
  isCustomOrder?: boolean;
}

export interface CartToastInfo {
  id: string;
  productName: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
}

interface CartState {
  items: CartItem[];
  toastItem: CartToastInfo | null;
  toastVisible: boolean;
  hideCartToast: () => void;

  /** Add an item or increment quantity if the same product+customizations combo exists */
  addItem: (item: Omit<CartItem, "unitPrice">) => void;

  /** Remove an item by its index in the array */
  removeItem: (index: number) => void;

  /** Update quantity for an item by index */
  updateQty: (index: number, quantity: number) => void;

  /** Clear the entire cart */
  clearCart: () => void;

  /** Total price of all items in cart */
  totalPrice: () => number;

  /** Total number of items (sum of quantities) */
  totalItems: () => number;
}

/** Compute unit price: base + modifiers */
function calcUnitPrice(basePrice: number, customizations: CartCustomization[]): number {
  return basePrice + customizations.reduce((sum, c) => sum + c.priceModifier, 0);
}

/**
 * Check if two customization arrays are the same combination.
 * Used to determine if we should merge quantities or add a new line item.
 */
function sameCustomizations(a: CartCustomization[], b: CartCustomization[]): boolean {
  if (a.length !== b.length) return false;
  return a.every(
    (ac, i) => ac.type === b[i].type && ac.selectedValue === b[i].selectedValue
  );
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      toastItem: null,
      toastVisible: false,

      hideCartToast: () => set({ toastVisible: false }),

      addItem: (item) => {
        const unitPrice = calcUnitPrice(item.basePrice, item.customizations);

        const toastInfo: CartToastInfo = {
          id: Date.now().toString(),
          productName: item.productName,
          productImage: item.productImage,
          quantity: item.quantity,
          unitPrice,
        };

        set((state) => {
          // Check for existing item with same product + same customizations
          const existingIdx = state.items.findIndex(
            (i) =>
              i.productId === item.productId &&
              sameCustomizations(i.customizations, item.customizations)
          );

          if (existingIdx >= 0) {
            // Merge: increment quantity
            const updated = [...state.items];
            updated[existingIdx] = {
              ...updated[existingIdx],
              quantity: updated[existingIdx].quantity + item.quantity,
            };
            return {
              items: updated,
              toastItem: toastInfo,
              toastVisible: true,
            };
          }

          // New line item
          return {
            items: [...state.items, { ...item, unitPrice }],
            toastItem: toastInfo,
            toastVisible: true,
          };
        });
      },

      removeItem: (index) => {
        set((state) => ({
          items: state.items.filter((_, i) => i !== index),
        }));
      },

      updateQty: (index, quantity) => {
        if (quantity < 1) return;
        set((state) => {
          const updated = [...state.items];
          if (updated[index]) {
            updated[index] = { ...updated[index], quantity };
          }
          return { items: updated };
        });
      },

      clearCart: () => set({ items: [] }),

      totalPrice: () =>
        get().items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),

      totalItems: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    {
      name: "celsa-cart", // localStorage key
      partialize: (state) => ({ items: state.items }),
    }
  )
);
