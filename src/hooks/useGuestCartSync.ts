"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import { cartApi } from "@/lib/api";
import { useGuestCartStore, useCartStore } from "@/store";

export function useGuestCartSync() {
  const { data: session } = useSession();
  const { items, clear } = useGuestCartStore();
  const { setCart } = useCartStore();
  const qc = useQueryClient();

  // Track previous auth state so we only sync on the login transition
  const wasLoggedIn = useRef<boolean | null>(null);

  useEffect(() => {
    const isLoggedIn = !!session?.user;

    // First render — just record state, don't sync yet
    if (wasLoggedIn.current === null) {
      wasLoggedIn.current = isLoggedIn;
      return;
    }

    // Transition: logged-out → logged-in
    if (!wasLoggedIn.current && isLoggedIn) {
      wasLoggedIn.current = true;

      if (items.length === 0) return;

      const sync = async () => {
        try {
          // Add each guest item to the server cart sequentially
          // (avoids race conditions on quantity merging)
          for (const item of items) {
            await cartApi.add({
              productId: item.productId,
              quantity: item.quantity,
            });
          }

          // Refresh the server cart in TanStack Query
          await qc.invalidateQueries({ queryKey: ["cart"] });

          // Clear guest cart from localStorage
          clear();

          toast.success(
            `${items.length} item${items.length > 1 ? "s" : ""} added from your guest cart`,
          );
        } catch {
          // Silent — server cart still works, guest items remain
          // until next login attempt
          console.error("Guest cart sync failed");
        }
      };

      sync();
    }

    if (!isLoggedIn) wasLoggedIn.current = false;
  }, [session?.user]);
}
