import { create } from 'zustand';

export const useHistoryStore = create((set, get) => ({
  items: [],

  addItem: (item) => set((state) => ({
    items: [
      {
        id: Date.now(),
        ...item,
        createdAt: new Date().toISOString(),
      },
      ...state.items,
    ],
  })),

  removeItem: (id) => set((state) => ({
    items: state.items.filter((item) => item.id !== id),
  })),

  clearHistory: () => set({ items: [] }),
}));
