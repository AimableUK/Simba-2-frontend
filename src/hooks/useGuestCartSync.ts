"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import { cartApi } from "@/lib/api";
import { useGuestCartStore, useCartStore, useBranchStore } from "@/store";

export function useGuestCartSync() {
  const { data: session } = useSession();
  const { items, clear } = useGuestCartStore();
  const { setCart } = useCartStore();
  const { selectedBranchId } = useBranchStore();
  const qc = useQueryClient();

  // Prevent duplicate syncs while the login/session state is settling.
  const syncingRef = useRef(false);
  const lastSyncedCartKey = useRef<string | null>(null);

  useEffect(() => {
    const isLoggedIn = !!session?.user;
    const cartKey = items
      .map((item) => `${item.productId}:${item.quantity}`)
      .sort()
      .join("|");

    if (!isLoggedIn) {
      syncingRef.current = false;
      lastSyncedCartKey.current = null;
      return;
    }

    if (items.length === 0) return;
    if (syncingRef.current) return;
    if (lastSyncedCartKey.current === cartKey) return;

    syncingRef.current = true;
    lastSyncedCartKey.current = cartKey;
    const snapshot = items.map((item) => ({ ...item }));

    const sync = async () => {
      try {
        for (const item of snapshot) {
          await cartApi.add({
            productId: item.productId,
            quantity: item.quantity,
            branchId: selectedBranchId || undefined,
          });
        }

        await qc.invalidateQueries({ queryKey: ["cart"] });
        clear();
        toast.success(
          `${snapshot.length} item${snapshot.length > 1 ? "s" : ""} added from your guest cart`,
        );
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 401) {
          // Don't keep retrying a sync that the backend refused.
          // The guest cart stays intact and will retry after logout/login state changes.
          console.error("Guest cart sync unauthorized");
          return;
        }

        // Keep guest cart intact if server sync fails so the user can retry.
        lastSyncedCartKey.current = null;
        console.error("Guest cart sync failed");
      } finally {
        syncingRef.current = false;
      }
    };

    void sync();
  }, [session?.user, items, clear, qc]);
}
