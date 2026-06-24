"use client"

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CartItem = { providerProductId: string, optionId?: string, unitType?: string, quantity: number, title?: string, price?: number, image?: string }

type CartState = {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (providerProductId: string, optionId?: string) => void
  updateQuantity: (providerProductId: string, optionId: string | undefined, quantity: number) => void
  clear: () => void
  isOpen: boolean
  setOpen: (v: boolean) => void
}

export const useCartStore = create<CartState>()(
  persist<CartState>((set, get) => ({
    items: [],
    addItem: (item: CartItem) => set((state: CartState) => {
      const exists = state.items.find(i => i.providerProductId === item.providerProductId && i.optionId === item.optionId)
      if (exists) return { items: state.items.map(i => (i.providerProductId === item.providerProductId && i.optionId === item.optionId) ? { ...i, quantity: i.quantity + item.quantity } : i) }
      const newItems = [...state.items, item]
      return { items: newItems, isOpen: true }
    }),
    removeItem: (providerProductId: string, optionId?: string) => set((state: CartState) => ({ items: state.items.filter(i => !(i.providerProductId === providerProductId && (optionId === undefined || i.optionId === optionId))) })),
    updateQuantity: (providerProductId: string, optionId: string | undefined, quantity: number) => set((state: CartState) => ({ items: state.items.map(i => (i.providerProductId === providerProductId && i.optionId === optionId) ? { ...i, quantity } : i).filter(i => i.quantity > 0) })),
    clear: () => set({ items: [] }),
    isOpen: false,
    setOpen: (v: boolean) => set({ isOpen: v }),
  }), { name: 'cart-store' })
)

