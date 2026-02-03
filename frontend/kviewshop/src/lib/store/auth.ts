import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole, Brand, Creator } from '@/types/database';

interface AuthState {
  user: User | null;
  brand: Brand | null;
  creator: Creator | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setBrand: (brand: Brand | null) => void;
  setCreator: (creator: Creator | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      brand: null,
      creator: null,
      isLoading: true,
      setUser: (user) => set({ user }),
      setBrand: (brand) => set({ brand }),
      setCreator: (creator) => set({ creator }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: () => set({ user: null, brand: null, creator: null }),
    }),
    {
      name: 'kviewshop-auth',
      partialize: (state) => ({
        user: state.user,
      }),
    }
  )
);

// Cart Store
interface CartItem {
  productId: string;
  quantity: number;
  creatorId: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const items = get().items;
        const existingIndex = items.findIndex(
          (i) => i.productId === item.productId && i.creatorId === item.creatorId
        );
        if (existingIndex > -1) {
          const newItems = [...items];
          newItems[existingIndex].quantity += item.quantity;
          set({ items: newItems });
        } else {
          set({ items: [...items, item] });
        }
      },
      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.productId !== productId) });
      },
      updateQuantity: (productId, quantity) => {
        const items = get().items.map((i) =>
          i.productId === productId ? { ...i, quantity } : i
        );
        set({ items });
      },
      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'kviewshop-cart',
    }
  )
);
