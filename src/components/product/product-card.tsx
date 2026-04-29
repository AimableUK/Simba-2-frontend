"use client";

import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Heart, ShoppingCart, Star, Minus, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { wishlistApi } from "@/lib/api";
import { useWishlistStore, useGuestCartStore, useBranchStore } from "@/store";
import { cn, formatPrice, getDiscountPercent, getImageUrl } from "@/lib/utils";
import { useSession } from "@/lib/auth-client";
import { RatingStars } from "@/components/common/rating-stars";
import { useCart } from "@/hooks/useCart";

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
  const { selectedBranchId } = useBranchStore();
  const {
    items: serverCartItems,
    addToCartAsync,
    updateQuantity,
    removeItem,
    isAdding,
  } = useCart();
  const {
    items: guestCartItems,
    add: addToGuestCart,
    update: updateGuestCart,
    remove: removeGuestCart,
  } = useGuestCartStore();
  const qc = useQueryClient();

  const discount = getDiscountPercent(product.price, product.comparePrice);
  const wishlisted = isWishlisted(product.id);
  const serverCartItem = serverCartItems.find(
    (item) => item.product.id === product.id,
  );
  const guestCartItem = guestCartItems.find(
    (item) => item.productId === product.id,
  );
  const cartQuantity = session?.user
    ? serverCartItem?.quantity || 0
    : guestCartItem?.quantity || 0;

  const wishlistMutation = useMutation({
    mutationFn: () => wishlistApi.toggle(product.id),
    onSuccess: () => {
      toggleLocal(product.id);
      qc.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (product.stock === 0) {
      toast.error(t("outOfStock"));
      return;
    }

    if (!session?.user) {
      if (guestCartItem) {
        updateGuestCart(
          product.id,
          Math.min(product.stock, guestCartItem.quantity + 1),
        );
      } else {
        addToGuestCart({
          productId: product.id,
          quantity: 1,
          product: {
            id: product.id,
            name: product.name,
            slug: product.slug,
            price: product.price,
            comparePrice: product.comparePrice,
            images: product.images,
            stock: product.stock,
          },
        });
      }
      toast.success(t("addedToCart"));
      return;
    }

    await addToCartAsync({
      productId: product.id,
      quantity: 1,
      branchId: selectedBranchId || undefined,
    });
    toast.success(t("addedToCart"));
  };

  const handleDecrease = (e: React.MouseEvent) => {
    e.preventDefault();
    if (session?.user) {
      if (!serverCartItem) return;
      const nextQuantity = serverCartItem.quantity - 1;
      if (nextQuantity <= 0)
        removeItem({
          productId: product.id,
          branchId: selectedBranchId || undefined,
        });
      else
        updateQuantity({
          productId: product.id,
          quantity: nextQuantity,
          branchId: selectedBranchId || undefined,
        });
      return;
    }

    if (!guestCartItem) return;
    const nextQuantity = guestCartItem.quantity - 1;
    if (nextQuantity <= 0) removeGuestCart(product.id);
    else updateGuestCart(product.id, nextQuantity);
  };

  const handleIncrease = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (product.stock === 0) return;

    if (session?.user) {
      const nextQuantity = (serverCartItem?.quantity || 0) + 1;
      if (nextQuantity <= product.stock) {
        if (serverCartItem)
          updateQuantity({
            productId: product.id,
            quantity: nextQuantity,
            branchId: selectedBranchId || undefined,
          });
        else
          await addToCartAsync({
            productId: product.id,
            quantity: 1,
            branchId: selectedBranchId || undefined,
          });
      }
      return;
    }

    const nextQuantity = (guestCartItem?.quantity || 0) + 1;
    if (nextQuantity <= product.stock) {
      if (guestCartItem) updateGuestCart(product.id, nextQuantity);
      else
        addToGuestCart({
          productId: product.id,
          quantity: 1,
          product: {
            id: product.id,
            name: product.name,
            slug: product.slug,
            price: product.price,
            comparePrice: product.comparePrice,
            images: product.images,
            stock: product.stock,
          },
        });
    }
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
                <span className="flex flex-row items-center whitespace-nowrap bg-foreground text-background text-[10px] font-bold px-2 py-0.5 rounded-full">
                  <Star
                    size={14}
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
            <div className="absolute top-2 right-2 flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
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
            </div>

            {/* Add to cart hover bar */}
            <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 translate-y-[140%] opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-hover:pointer-events-auto">
              {product.stock === 0 ? (
                <button
                  disabled
                  className="min-w-[9rem] px-4 py-2 text-xs font-semibold rounded-full flex items-center justify-center gap-2 bg-muted text-muted-foreground cursor-not-allowed shadow-md"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  {t("outOfStock")}
                </button>
              ) : cartQuantity > 0 ? (
                <div className="min-w-[9rem] px-3 py-2 bg-primary text-white flex items-center justify-between gap-2 rounded-full shadow-md">
                  <button
                    onClick={handleDecrease}
                    className="w-7 h-7 rounded-full border border-white/30 flex items-center justify-center hover:bg-white/10 transition-colors shrink-0"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="min-w-6 text-center text-sm font-semibold tabular-nums">
                    {cartQuantity}
                  </span>
                  <button
                    onClick={handleIncrease}
                    disabled={cartQuantity >= product.stock}
                    className="w-7 h-7 rounded-full border border-white/30 flex items-center justify-center hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleAddToCart}
                  disabled={isAdding}
                  className={cn(
                    "min-w-[9rem] px-4 py-2 text-xs font-semibold rounded-full flex items-center justify-center gap-2 transition-colors shadow-md",
                    "bg-primary text-white hover:bg-primary/90",
                  )}
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  {t("addToCart")}
                </button>
              )}
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
                <RatingStars rating={product.rating} starClassName="h-3 w-3" />
                <span className="text-[10px] text-muted-foreground -mt-2">
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
