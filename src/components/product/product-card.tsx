"use client";
import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Heart, ShoppingCart, Star, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cartApi, wishlistApi } from "@/lib/api";
import { useWishlistStore, useCartStore } from "@/store";
import { cn, formatPrice, getDiscountPercent, getImageUrl } from "@/lib/utils";
import { useSession } from "@/lib/auth-client";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number;
  images: string[];
  rating: number;
  reviewCount: number;
  stock: number;
  isFeatured?: boolean;
  isAlcohol?: boolean;
  category?: { name: string; slug: string };
}

export function ProductCard({ product }: { product: Product }) {
  const t = useTranslations("product");
  const locale = useLocale();
  const { data: session } = useSession();
  const { has: isWishlisted, toggle: toggleLocal } = useWishlistStore();
  const { addItem } = useCartStore();
  const qc = useQueryClient();

  const discount = getDiscountPercent(product.price, product.comparePrice);
  const wishlisted = isWishlisted(product.id);

  const cartMutation = useMutation({
    mutationFn: () => cartApi.add({ productId: product.id, quantity: 1 }),
    onSuccess: (res) => {
      addItem(res.data);
      qc.invalidateQueries({ queryKey: ["cart"] });
      toast.success(t("addedToCart"));
    },
    onError: () => toast.error("Failed to add to cart"),
  });

  const wishlistMutation = useMutation({
    mutationFn: () => wishlistApi.toggle(product.id),
    onSuccess: () => {
      toggleLocal(product.id);
      qc.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!session?.user) {
      toast.error("Please sign in to add to cart");
      return;
    }
    if (product.stock === 0) return;
    cartMutation.mutate();
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!session?.user) {
      toast.error("Please sign in");
      return;
    }
    wishlistMutation.mutate();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="group"
    >
      <Link href={`/${locale}/product/${product.slug}`}>
        <div className="h-full bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 hover:shadow-lg transition-all duration-300">
          {/* Image */}
          <div className="relative aspect-square overflow-hidden bg-muted">
            <Image
              src={getImageUrl(product.images[0])}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />

            {/* Badges */}
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {discount && (
                <span className="bg-primary text-white w-fit text-[10px] font-bold px-2 py-0.5 rounded-full">
                  -{discount}%
                </span>
              )}
              {product.isFeatured && (
                <span className="flex flex-row whitespace-nowrap bg-foreground text-background text-[10px] font-bold px-2 py-0.5 rounded-full">
                  <Star
                    size={16}
                    fill="currentColor"
                    className="stroke-amber-500 text-amber-500"
                  />{" "}
                  Featured
                </span>
              )}
              {product.isAlcohol && (
                <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  18+
                </span>
              )}
              {product.stock === 0 && (
                <span className="bg-muted text-muted-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {t("outOfStock")}
                </span>
              )}
            </div>

            {/* Actions overlay */}
            <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleWishlist}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all",
                  wishlisted
                    ? "bg-primary text-white"
                    : "bg-card text-foreground hover:bg-primary hover:text-white",
                )}
              >
                <Heart
                  className={cn("w-4 h-4", wishlisted && "fill-current")}
                />
              </button>
              <Link
                href={`/${locale}/product/${product.slug}`}
                className="w-8 h-8 bg-card rounded-full flex items-center justify-center shadow-md hover:bg-primary hover:text-white transition-all text-foreground"
              >
                <Eye className="w-4 h-4" />
              </Link>
            </div>

            {/* Add to cart hover bar */}
            <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0 || cartMutation.isPending}
                className={cn(
                  "w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-2 transition-colors",
                  product.stock === 0
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "bg-primary text-white hover:bg-primary/90",
                )}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                {product.stock === 0 ? t("outOfStock") : t("addToCart")}
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="p-3">
            {product.category && (
              <p className="text-[10px] text-primary font-medium uppercase tracking-wider mb-1">
                {product.category.name}
              </p>
            )}
            <h3 className="text-sm font-medium text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors leading-snug">
              {product.name}
            </h3>

            {/* Rating */}
            {product.reviewCount > 0 && (
              <div className="flex items-center gap-1 mb-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={cn(
                        "w-3 h-3",
                        s <= Math.round(product.rating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground",
                      )}
                    />
                  ))}
                </div>
                <span className="text-[10px] text-muted-foreground">
                  ({product.reviewCount})
                </span>
              </div>
            )}

            {/* Price */}
            <div className="flex flex-col sm:flex-row items-baseline gap-2 ">
              <span className="text-base font-bold text-primary">
                {formatPrice(product.price)}
              </span>
              {product.comparePrice && product.comparePrice > product.price && (
                <span className="text-xs text-muted-foreground line-through">
                  {formatPrice(product.comparePrice)}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="aspect-square skeleton" />
      <div className="p-3 space-y-2">
        <div className="skeleton h-3 w-16 rounded" />
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-5 w-24 rounded" />
      </div>
    </div>
  );
}
