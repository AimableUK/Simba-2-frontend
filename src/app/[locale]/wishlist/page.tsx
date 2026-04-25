"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingCart, Trash2, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { wishlistApi, cartApi } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import { formatPrice, getImageUrl, getDiscountPercent } from "@/lib/utils";
import { useQueryClient as useQC } from "@tanstack/react-query";
import { Skeleton } from "@/components/common/skeletons";

export default function WishlistPage() {
  const t = useTranslations("wishlist");
  const tProduct = useTranslations("product");
  const locale = useLocale();
  const { data: session } = useSession();
  const qc = useQueryClient();

  const { data: items, isLoading } = useQuery({
    queryKey: ["wishlist"],
    queryFn: () => wishlistApi.get().then((r) => r.data),
    enabled: !!session?.user,
  });

  const removeMutation = useMutation({
    mutationFn: (productId: string) => wishlistApi.toggle(productId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success("Removed from wishlist");
    },
  });

  const addToCartMutation = useMutation({
    mutationFn: (productId: string) => cartApi.add({ productId, quantity: 1 }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      toast.success(tProduct("addedToCart"));
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || "Failed to add to cart"),
  });

  const addAllToCart = async () => {
    if (!items?.length) return;
    const inStock = items.filter((i: any) => i.product?.stock > 0);
    if (!inStock.length) {
      toast.error("No in-stock items to add");
      return;
    }

    let added = 0;
    for (const item of inStock) {
      try {
        await cartApi.add({ productId: item.productId, quantity: 1 });
        added++;
      } catch {
        /* skip out of stock */
      }
    }
    qc.invalidateQueries({ queryKey: ["cart"] });
    toast.success(`Added ${added} item${added !== 1 ? "s" : ""} to cart`);
  };

  if (!session?.user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-md">
        <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Heart className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-2xl font-bold mb-2">{t("title")}</h1>
        <p className="text-muted-foreground mb-6">
          Sign in to view your saved items
        </p>
        <Link
          href={`/${locale}/auth/sign-in`}
          className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary/5 border-b border-border py-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">{t("title")}</h1>
              {items?.length > 0 && (
                <p className="text-muted-foreground mt-1 text-sm">
                  {t("items", { count: items.length })}
                </p>
              )}
            </div>
            {items?.length > 0 && (
              <button
                onClick={addAllToCart}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-colors text-sm"
              >
                <ShoppingCart className="h-4 w-4" />
                Add all to cart
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-border overflow-hidden bg-card"
              >
                <Skeleton className="aspect-square w-full" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-9 w-full mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : !items?.length ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Heart className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold mb-2">{t("empty")}</h2>
            <p className="text-muted-foreground mb-8">{t("emptyDesc")}</p>
            <Link
              href={`/${locale}/shop`}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
            >
              {t("browseProducts")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            <AnimatePresence>
              {items.map((item: any) => {
                const product = item.product;
                const inStock = product?.stock > 0;
                const discount = getDiscountPercent(
                  product?.price,
                  product?.comparePrice,
                );

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="group bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/40 hover:shadow-md transition-all duration-200"
                  >
                    {/* Image */}
                    <Link
                      href={`/${locale}/product/${product?.slug}`}
                      className="block relative aspect-square bg-muted overflow-hidden"
                    >
                      <Image
                        src={getImageUrl(product?.images?.[0])}
                        alt={product?.name || ""}
                        fill
                        className="object-contain p-3 group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
                      />
                      {discount && (
                        <span className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-lg">
                          -{discount}%
                        </span>
                      )}
                      {!inStock && (
                        <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                          <span className="bg-background border border-border text-sm font-medium px-3 py-1.5 rounded-lg text-muted-foreground">
                            {t("outOfStock")}
                          </span>
                        </div>
                      )}
                      {/* Remove button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          removeMutation.mutate(item.productId);
                        }}
                        className="absolute top-3 right-3 w-8 h-8 bg-background/80 backdrop-blur border border-border rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-destructive hover:border-destructive hover:text-destructive-foreground transition-all"
                        title={t("remove")}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </Link>

                    {/* Info */}
                    <div className="p-4">
                      <Link
                        href={`/${locale}/product/${product?.slug}`}
                        className="block mb-1"
                      >
                        <p className="font-medium text-sm line-clamp-2 hover:text-primary transition-colors leading-tight">
                          {product?.name}
                        </p>
                      </Link>

                      {product?.category?.name && (
                        <p className="text-xs text-muted-foreground mb-2">
                          {product.category.name}
                        </p>
                      )}

                      <div className="flex items-baseline gap-2 mb-3">
                        <span className="font-bold text-primary">
                          {formatPrice(product?.price)}
                        </span>
                        {product?.comparePrice && (
                          <span className="text-xs text-muted-foreground line-through">
                            {formatPrice(product.comparePrice)}
                          </span>
                        )}
                      </div>

                      {/* Stock badge */}
                      <div className="flex items-center gap-1.5 mb-3">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${inStock ? "bg-green-500" : "bg-destructive"}`}
                        />
                        <span
                          className={`text-xs font-medium ${inStock ? "text-green-600 dark:text-green-400" : "text-destructive"}`}
                        >
                          {inStock
                            ? `${product.stock} ${t("inStock")}`
                            : t("outOfStock")}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            addToCartMutation.mutate(item.productId)
                          }
                          disabled={!inStock || addToCartMutation.isPending}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-primary-foreground text-xs font-semibold py-2.5 rounded-xl hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          <ShoppingCart className="h-3.5 w-3.5" />
                          {t("addToCart")}
                        </button>
                        <button
                          onClick={() => removeMutation.mutate(item.productId)}
                          disabled={removeMutation.isPending}
                          className="w-9 h-9 flex items-center justify-center border border-border rounded-xl hover:border-destructive hover:text-destructive hover:bg-destructive/5 transition-colors disabled:opacity-40"
                          title={t("remove")}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
