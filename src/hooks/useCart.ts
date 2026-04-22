"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cartApi } from "@/lib/api";
import { useCartStore } from "@/store";
import { useSession } from "@/lib/auth-client";
import { useEffect } from "react";
import { toast } from "sonner";

export function useCart() {
  const { data: session } = useSession();
  const { setCart, items, total, deliveryFee } = useCartStore();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: () => cartApi.get().then((r) => r.data),
    enabled: !!session?.user,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (data)
      setCart(data.items || [], data.total || 0, data.deliveryFee || 1000);
  }, [data, setCart]);

  const addMutation = useMutation({
    mutationFn: ({
      productId,
      quantity,
    }: {
      productId: string;
      quantity: number;
    }) => cartApi.add({ productId, quantity }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || "Failed to add to cart"),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      productId,
      quantity,
    }: {
      productId: string;
      quantity: number;
    }) => cartApi.update(productId, quantity),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });

  const removeMutation = useMutation({
    mutationFn: (productId: string) => cartApi.remove(productId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });

  const clearMutation = useMutation({
    mutationFn: () => cartApi.clear(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });

  return {
    items,
    total,
    deliveryFee,
    grandTotal: total + deliveryFee,
    isLoading,
    itemCount: items.reduce((s, i) => s + i.quantity, 0),
    addToCart: addMutation.mutate,
    addToCartAsync: addMutation.mutateAsync,
    isAdding: addMutation.isPending,
    updateQuantity: updateMutation.mutate,
    removeItem: removeMutation.mutate,
    clearCart: clearMutation.mutate,
  };
}
