import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    comparePrice?: number;
    images: string[];
    stock: number;
  };
}

//  Cart Store 

interface CartStore {
  items: CartItem[];
  total: number;
  deliveryFee: number;
  isOpen: boolean;
  setCart: (items: CartItem[], total: number, deliveryFee: number) => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  getItemCount: () => number;
  getGrandTotal: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  total: 0,
  deliveryFee: 1000,
  isOpen: false,
  setCart: (items, total, deliveryFee) => set({ items, total, deliveryFee }),
  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
  toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),
  getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
  getGrandTotal: () => get().total + get().deliveryFee,
}));

//  UI Store 

interface UIStore {
  mobileMenuOpen: boolean;
  searchOpen: boolean;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
  openSearch: () => void;
  closeSearch: () => void;
  toggleSearch: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  mobileMenuOpen: false,
  searchOpen: false,
  toggleMobileMenu: () => set((s) => ({ mobileMenuOpen: !s.mobileMenuOpen })),
  closeMobileMenu: () => set({ mobileMenuOpen: false }),
  openSearch: () => set({ searchOpen: true }),
  closeSearch: () => set({ searchOpen: false }),
  toggleSearch: () => set((s) => ({ searchOpen: !s.searchOpen })),
}));

//  Wishlist Store (persisted) 

interface WishlistStore {
  productIds: string[];
  toggle: (id: string) => boolean;
  has: (id: string) => boolean;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      productIds: [],
      toggle: (id) => {
        const has = get().productIds.includes(id);
        set((s) => ({
          productIds: has ? s.productIds.filter((i) => i !== id) : [...s.productIds, id],
        }));
        return !has;
      },
      has: (id) => get().productIds.includes(id),
    }),
    { name: 'simba-wishlist' }
  )
);
