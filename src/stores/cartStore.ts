"use client"

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CartItem = { providerProductId: string, optionId?: string, unitType?: string, quantity: number, title?: string, price?: number }

type CartState = {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (providerProductId: string) => void
  clear: () => void
}

export const useCartStore = create<CartState>((persist as any)((set: any, get: any) => ({
  items: [],
  addItem: (item: CartItem) => set((state: CartState) => {
    const exists = state.items.find(i => i.providerProductId === item.providerProductId && i.optionId === item.optionId)
    if (exists) return { items: state.items.map(i => (i.providerProductId === item.providerProductId && i.optionId === item.optionId) ? { ...i, quantity: i.quantity + item.quantity } : i) }
    return { items: [...state.items, item] }
  }),
  removeItem: (id: string) => set((state: CartState) => ({ items: state.items.filter(i => i.providerProductId !== id) })),
  clear: () => set({ items: [] }),
}), { name: 'cart-store' }) as any)
