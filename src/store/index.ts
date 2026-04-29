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

// Used when user is not logged in. On login, useCart hook syncs it to the server.

export interface GuestCartItem {
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

interface GuestCartStore {
  items: GuestCartItem[];
  add: (item: GuestCartItem) => void;
  update: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

export const useGuestCartStore = create<GuestCartStore>()(
  persist(
    (set, get) => ({
      items: [],

      add: (item) =>
        set((s) => {
          const existing = s.items.find((i) => i.productId === item.productId);
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.productId === item.productId
                  ? {
                      ...i,
                      quantity: Math.min(
                        i.product.stock,
                        i.quantity + item.quantity,
                      ),
                    }
                  : i,
              ),
            };
          }
          return { items: [...s.items, item] };
        }),

      update: (productId, quantity) =>
        set((s) => ({
          items:
            quantity <= 0
              ? s.items.filter((i) => i.productId !== productId)
              : s.items.map((i) =>
                  i.productId === productId ? { ...i, quantity } : i,
                ),
        })),

      remove: (productId) =>
        set((s) => ({
          items: s.items.filter((i) => i.productId !== productId),
        })),

      clear: () => set({ items: [] }),
    }),
    { name: "simba-guest-cart" },
  ),
);

//  Branch Store (persisted)

interface BranchStore {
  selectedBranchId: string | null;
  selectedBranchSlug: string | null;
  selectedBranchName: string | null;
  setBranch: (id: string, slug: string, name: string) => void;
  clearBranch: () => void;
}

export const useBranchStore = create<BranchStore>()(
  persist(
    (set) => ({
      selectedBranchId: null,
      selectedBranchSlug: null,
      selectedBranchName: null,
      setBranch: (id, slug, name) =>
        set({
          selectedBranchId: id,
          selectedBranchSlug: slug,
          selectedBranchName: name,
        }),
      clearBranch: () =>
        set({
          selectedBranchId: null,
          selectedBranchSlug: null,
          selectedBranchName: null,
        }),
    }),
    { name: "simba-branch" },
  ),
);

//  Notification Store (persisted)

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  createdAt: string;
  read: boolean;
}

interface NotificationStore {
  items: AppNotification[];
  unreadCount: number;
  push: (notification: Omit<AppNotification, "id" | "createdAt" | "read"> & { createdAt?: string }) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clear: () => void;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      items: [],
      unreadCount: 0,
      push: (notification) =>
        set((state) => {
          const next: AppNotification = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            createdAt: notification.createdAt || new Date().toISOString(),
            read: false,
            ...notification,
          };
          const items = [next, ...state.items].slice(0, 100);
          return {
            items,
            unreadCount: items.filter((i) => !i.read).length,
          };
        }),
      markRead: (id) =>
        set((state) => {
          const items = state.items.map((item) =>
            item.id === id ? { ...item, read: true } : item,
          );
          return {
            items,
            unreadCount: items.filter((i) => !i.read).length,
          };
        }),
      markAllRead: () =>
        set((state) => ({
          items: state.items.map((item) => ({ ...item, read: true })),
          unreadCount: 0,
        })),
      clear: () => set({ items: [], unreadCount: 0 }),
    }),
    { name: "simba-notifications" },
  ),
);
