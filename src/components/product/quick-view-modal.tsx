"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { X, Plus, Minus, ShoppingCart, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useCart } from "@/hooks/useCart";
import { useGuestCartStore, useBranchStore, useCartStore } from "@/store";
import { useSession } from "@/lib/auth-client";
import { formatPrice, getImageUrl, getDiscountPercent } from "@/lib/utils";

interface QuickViewProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number;
  images: string[];
  stock: number;
  shortDescription?: string;
  category?: { name: string; slug: string };
  unit?: string;
}

interface QuickViewModalProps {
  product: QuickViewProduct | null;
  onClose: () => void;
}

export function QuickViewModal({ product, onClose }: QuickViewModalProps) {
  const t = useTranslations("product");
  const locale = useLocale();
  const { data: session } = useSession();
  const { addToCartAsync, isAdding } = useCart();
  const { selectedBranchId } = useBranchStore();
  const guestCart = useGuestCartStore();
  const { openCart } = useCartStore();
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const discount = getDiscountPercent(product.price, product.comparePrice);
  const inStock = product.stock > 0;

  const handleAddToCart = async () => {
    if (!session?.user) {
      guestCart.add({
        productId: product.id,
        quantity,
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
      openCart();
      toast.success(t("addedToCart"));
      onClose();
      return;
    }
    try {
      await addToCartAsync({ productId: product.id, quantity, branchId: selectedBranchId || undefined });
      toast.success(t("addedToCart"));
      onClose();
    } catch {}
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.2 }}
          className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex">
            {/* Image */}
            <div className="relative w-48 h-48 sm:w-56 sm:h-56 bg-muted shrink-0">
              <Image
                src={getImageUrl(product.images[0])}
                alt={product.name}
                fill
                className="object-contain p-4"
                sizes="224px"
              />
              {discount && (
                <span className="absolute top-2 left-2 bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  -{discount}%
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 p-5 flex flex-col min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  {product.category && (
                    <p className="text-xs text-primary font-medium uppercase tracking-wide mb-1">
                      {product.category.name}
                    </p>
                  )}
                  <h3 className="font-bold text-base leading-snug line-clamp-2">
                    {product.name}
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg hover:bg-muted transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-end gap-2 mt-2">
                <span className="text-xl font-bold text-primary">{formatPrice(product.price)}</span>
                {product.comparePrice && (
                  <span className="text-sm text-muted-foreground line-through">{formatPrice(product.comparePrice)}</span>
                )}
                {product.unit && <span className="text-xs text-muted-foreground">/ {product.unit}</span>}
              </div>

              {product.shortDescription && (
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{product.shortDescription}</p>
              )}

              <div className="flex items-center gap-2 mt-2">
                <div className={`w-2 h-2 rounded-full ${inStock ? "bg-green-500" : "bg-destructive"}`} />
                <span className={`text-xs font-medium ${inStock ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
                  {inStock ? t("inStock") : t("outOfStock")}
                </span>
              </div>

              {inStock && (
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center border border-border rounded-lg overflow-hidden">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 hover:bg-muted transition-colors">
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">{quantity}</span>
                    <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} className="p-2 hover:bg-muted transition-colors">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-auto pt-4">
                <button
                  onClick={handleAddToCart}
                  disabled={!inStock || isAdding}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
                >
                  <ShoppingCart className="h-4 w-4" />
                  {t("addToCart")}
                </button>
                <Link
                  href={`/${locale}/product/${product.slug}`}
                  onClick={onClose}
                  className="flex items-center justify-center p-2.5 border border-border rounded-xl hover:bg-muted transition-colors"
                  title="View full details"
                >
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
