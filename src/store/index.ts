import { create } from "zustand";
import { persist } from "zustand/middleware";

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
  addItem: (item: CartItem) => void;
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
  addItem: (item) =>
    set((s) => {
      const existing = s.items.find((i) => i.id === item.id);
      const items = existing
        ? s.items.map((i) =>
            i.id === item.id
              ? { ...i, quantity: i.quantity + item.quantity }
              : i,
          )
        : [...s.items, item];
      const total = items.reduce(
        (sum, i) => sum + i.product.price * i.quantity,
        0,
      );
      return { items, total };
    }),
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
  openMobileMenu: () => void;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
  openSearch: () => void;
  closeSearch: () => void;
  toggleSearch: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  mobileMenuOpen: false,
  searchOpen: false,
  openMobileMenu: () => set({ mobileMenuOpen: true }),
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
          productIds: has
            ? s.productIds.filter((i) => i !== id)
            : [...s.productIds, id],
        }));
        return !has;
      },
      has: (id) => get().productIds.includes(id),
    }),
    { name: "simba-wishlist" },
  ),
);
