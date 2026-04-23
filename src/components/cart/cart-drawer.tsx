"use client";
import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { X, ShoppingBag, Plus, Minus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cartApi } from "@/lib/api";
import { useCartStore } from "@/store";
import { cn, formatPrice, getImageUrl } from "@/lib/utils";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import { usePathname } from "next/navigation";

export function CartDrawer() {
  const t = useTranslations("cart");
  const locale = useLocale();
  const { data: session } = useSession();
  const { isOpen, closeCart, setCart, items, total, deliveryFee } =
    useCartStore();
  const qc = useQueryClient();

  const pathname = usePathname();
  const isAdminRoute = pathname.includes("/admin");

  const { data } = useQuery({
    queryKey: ["cart"],
    queryFn: () => cartApi.get().then((r) => r.data),
    enabled: !!session?.user && isOpen,
  });

  useEffect(() => {
    if (data)
      setCart(data.items || [], data.total || 0, data.deliveryFee || 1000);
  }, [data]);

  const removeMutation = useMutation({
    mutationFn: (productId: string) => cartApi.remove(productId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
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
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || "Error updating cart"),
  });

  const grandTotal = total + deliveryFee;

  if (isAdminRoute) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={closeCart}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed right-0 top-0 h-full w-full sm:w-96 bg-card border-l border-border shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-foreground">{t("title")}</h2>
                {items.length > 0 && (
                  <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full font-medium">
                    {t("items", {
                      count: items.reduce((s, i) => s + i.quantity, 0),
                    })}
                  </span>
                )}
              </div>
              <button
                onClick={closeCart}
                className="p-1.5 rounded-lg hover:bg-accent transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto py-2">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
                  <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
                    <ShoppingBag className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{t("empty")}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t("emptyDesc")}
                    </p>
                  </div>
                  <button
                    onClick={closeCart}
                    className="px-6 py-2.5 bg-primary text-white rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    {t("shopNow")}
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {items.map((item) => (
                    <div key={item.productId} className="flex gap-3 px-4 py-3">
                      <div className="relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden bg-muted">
                        <Image
                          src={getImageUrl(item.product.images[0])}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/${locale}/product/${item.product.slug}`}
                          onClick={closeCart}
                          className="text-sm font-medium text-foreground hover:text-primary transition-colors line-clamp-2 leading-snug"
                        >
                          {item.product.name}
                        </Link>
                        <p className="text-sm font-bold text-primary mt-1">
                          {formatPrice(item.product.price)}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1.5 bg-muted rounded-full px-1 py-0.5">
                            <button
                              onClick={() => {
                                if (item.quantity <= 1)
                                  removeMutation.mutate(item.productId);
                                else
                                  updateMutation.mutate({
                                    productId: item.productId,
                                    quantity: item.quantity - 1,
                                  });
                              }}
                              className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-sm font-medium w-5 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateMutation.mutate({
                                  productId: item.productId,
                                  quantity: item.quantity + 1,
                                })
                              }
                              disabled={item.quantity >= item.product.stock}
                              className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-colors disabled:opacity-40"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <button
                            onClick={() =>
                              removeMutation.mutate(item.productId)
                            }
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-border p-5 space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>{t("subtotal")}</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>{t("delivery")}</span>
                    <span>{formatPrice(deliveryFee)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base text-foreground border-t border-border pt-2">
                    <span>{t("total")}</span>
                    <span className="text-primary">
                      {formatPrice(grandTotal)}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground text-center">
                  {t("deliveryNote")}
                </p>
                <Link
                  href={`/${locale}/checkout`}
                  onClick={closeCart}
                  className="block w-full text-center py-3 bg-primary text-white font-semibold rounded-full hover:bg-primary/90 transition-colors"
                >
                  {t("checkout")}
                </Link>
                <button
                  onClick={closeCart}
                  className="block w-full text-center py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("continueShopping")}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
