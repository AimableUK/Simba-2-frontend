"use client"
import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  Heart,
  Minus,
  Plus,
  ChevronRight,
  Shield,
  Truck,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { productApi, reviewApi } from "@/lib/api";
import { useCart } from "@/hooks/useCart";
import {
  useCartStore,
  useGuestCartStore,
  useWishlistStore,
  useBranchStore,
} from "@/store";
import { useSession } from "@/lib/auth-client";
import { formatPrice, getImageUrl, getDiscountPercent } from "@/lib/utils";
import { ProductDetailSkeleton } from "@/components/common/skeletons";
import { RatingStars } from "@/components/common/rating-stars";
import type { Review } from "@/types";
import { ProductCard } from "@/components/product/product-card";

export default function ProductPage() {
  const params = useParams();
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("product");
  const tCommon = useTranslations("common");
  const { data: session } = useSession();
  const { addToCartAsync, isAdding } = useCart();
  const qc = useQueryClient();
  const { toggle, has } = useWishlistStore();
  const { selectedBranchId } = useBranchStore();

  const slug = params.slug as string;
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const guestCart = useGuestCartStore();
  const { openCart } = useCartStore();

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => productApi.get(slug).then((r) => r.data),
  });

  const { data: similar } = useQuery({
    queryKey: ["similar", slug],
    queryFn: () => productApi.similar(slug).then((r) => r.data),
    enabled: !!product,
  });

  const reviewMutation = useMutation({
    mutationFn: () =>
      reviewApi.add(product!.id, {
        rating: reviewRating,
        comment: reviewComment,
      }),
    onSuccess: () => {
      toast.success(t("reviewSuccess"));
      setReviewComment("");
      qc.invalidateQueries({ queryKey: ["product", slug] });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || t("reviewError")),
  });

  const handleAddToCart = useCallback(async () => {
    if (!session?.user) {
      guestCart.add({
        productId: product!.id,
        quantity,
        product: {
          id: product!.id,
          name: product!.name,
          slug: product!.slug,
          price: product!.price,
          comparePrice: product!.comparePrice,
          images: product!.images,
          stock: product!.stock,
        },
      });
      openCart();
      toast.success(t("addedToCart"));
      return;
    }
    try {
      await addToCartAsync({
        productId: product!.id,
        quantity,
        branchId: selectedBranchId || undefined,
      });
      toast.success(t("addedToCart"));
    } catch {}
  }, [
    product,
    quantity,
    session,
    addToCartAsync,
    guestCart,
    openCart,
    selectedBranchId,
    locale,
    t,
  ]);

  const handleWishlist = useCallback(() => {
    if (!product) return;
    toggle(product.id);
  }, [product, toggle]);

  if (isLoading) return <ProductDetailSkeleton />;
  if (!product)
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">{tCommon("noResults")}</p>
        <Link
          href={`/${locale}/shop`}
          className="mt-4 inline-block text-primary hover:underline"
        >
          {tCommon("back")}
        </Link>
      </div>
    );

  const images = product.images?.length ? product.images : [""];
  const discount = getDiscountPercent(product.price, product.comparePrice);
  const wishlisted = has(product.id);
  const inStock = product.stock > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="border-b border-border bg-muted/30">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link
              href={`/${locale}`}
              className="hover:text-primary transition-colors"
            >
              {tCommon("back").replace("Back", "Home")}
            </Link>
            <ChevronRight className="h-3 w-3" />
            <Link
              href={`/${locale}/shop`}
              className="hover:text-primary transition-colors"
            >
              Shop
            </Link>
            {product.category && (
              <>
                <ChevronRight className="h-3 w-3" />
                <Link
                  href={`/${locale}/shop?category=${product.category.slug}`}
                  className="hover:text-primary transition-colors"
                >
                  {product.category.name}
                </Link>
              </>
            )}
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium truncate max-w-[200px]">
              {product.name}
            </span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/*  Image Gallery  */}
          <div className="space-y-3">
            {/* Big main image */}
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted border border-border">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0"
                >
                  <Image
                    src={getImageUrl(images[activeImage])}
                    alt={product.name}
                    fill
                    className="object-contain p-4"
                    sizes="(max-width:1024px) 100vw, 50vw"
                    priority
                  />
                </motion.div>
              </AnimatePresence>

              {discount && (
                <div className="absolute top-4 left-4 bg-primary text-primary-foreground text-xs font-bold px-2.5 py-1.5 rounded-lg">
                  -{discount}%
                </div>
              )}
              {product.isAlcohol && (
                <div className="absolute top-4 right-4 bg-destructive/10 text-destructive text-xs font-medium px-2.5 py-1.5 rounded-lg flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  18+
                </div>
              )}
            </div>

            {/* Thumbnails - up to 4, clickable */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.slice(0, 4).map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      activeImage === idx
                        ? "border-primary shadow-md scale-105"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Image
                      src={getImageUrl(img)}
                      alt={`${product.name} ${idx + 1}`}
                      fill
                      className="object-contain p-2"
                      sizes="100px"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/*  Product Info  */}
          <div className="space-y-5">
            {/* Category + name */}
            {product.category && (
              <Link
                href={`/${locale}/shop?category=${product.category.slug}`}
                className="text-sm text-primary font-medium hover:underline"
              >
                {product.category.name}
              </Link>
            )}

            <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-3">
              <RatingStars rating={product.rating} starClassName="h-5 w-5" />
              <span className="text-sm text-muted-foreground">
                {product.rating.toFixed(1)} ({product.reviewCount}{" "}
                {t("reviews")})
              </span>
              <span className="text-sm text-muted-foreground">·</span>
              <span className="text-sm text-muted-foreground">
                {product.viewCount} views
              </span>
            </div>

            {/* Price */}
            <div className="flex items-end gap-3">
              <span className="text-3xl font-bold text-primary">
                {formatPrice(product.price)}
              </span>
              {product.comparePrice && (
                <span className="text-lg text-muted-foreground line-through">
                  {formatPrice(product.comparePrice)}
                </span>
              )}
              {product.unit && (
                <span className="text-sm text-muted-foreground mb-1">
                  / {product.unit}
                </span>
              )}
            </div>

            {/* Short description */}
            {product.shortDescription && (
              <p className="text-muted-foreground">
                {product.shortDescription}
              </p>
            )}

            {/* Alcohol warning */}
            {product.isAlcohol && (
              <div className="flex items-center gap-2 text-sm bg-destructive/10 text-destructive px-4 py-3 rounded-xl border border-destructive/20">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{t("alcohol")}</span>
              </div>
            )}

            {/* Stock */}
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${inStock ? "bg-green-500" : "bg-destructive"}`}
              />
              <span
                className={`text-sm font-medium ${inStock ? "text-green-600 dark:text-green-400" : "text-destructive"}`}
              >
                {!inStock
                  ? t("outOfStock")
                  : product.stock <= product.lowStockAlert
                    ? t("lowStock", { count: product.stock })
                    : t("inStock")}
              </span>
            </div>

            {/* Quantity */}
            {inStock && (
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-foreground">
                  {t("quantity")}:
                </span>
                <div className="flex items-center gap-0 border border-border rounded-xl overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-3 hover:bg-muted transition-colors"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-12 text-center font-semibold text-sm">
                    {quantity}
                  </span>
                  <button
                    onClick={() =>
                      setQuantity(Math.min(product.stock, quantity + 1))
                    }
                    className="p-3 hover:bg-muted transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* CTA buttons */}
            <div className="flex gap-3 flex-col sm:flex-row">
              <button
                onClick={handleAddToCart}
                disabled={!inStock || isAdding}
                className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground font-semibold py-3.5 px-6 rounded-xl transition-colors"
              >
                <ShoppingCart className="h-5 w-5" />
                {isAdding ? tCommon("loading") : t("addToCart")}
              </button>
              <button
                onClick={handleWishlist}
                className={`flex items-center justify-center gap-2 border font-medium py-3.5 px-5 rounded-xl transition-colors ${
                  wishlisted
                    ? "border-primary text-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-muted"
                }`}
              >
                <Heart
                  className={`h-5 w-5 ${wishlisted ? "fill-primary" : ""}`}
                />
                <span className="hidden sm:inline">
                  {wishlisted ? t("removeWishlist") : t("wishlist")}
                </span>
              </button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              {[
                { icon: Truck, label: "Fast Delivery" },
                { icon: Shield, label: "Secure Payment" },
                { icon: RotateCcw, label: "Easy Returns" },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-1.5 text-center p-3 rounded-xl bg-muted/50"
                >
                  <Icon className="h-5 w-5 text-primary" />
                  <span className="text-xs font-medium">{label}</span>
                </div>
              ))}
            </div>

            {/* Meta details */}
            <div className="border-t border-border pt-4 space-y-2 text-sm">
              {product.sku && (
                <div className="flex gap-2">
                  <span className="text-muted-foreground min-w-[80px]">
                    {t("sku")}:
                  </span>
                  <span className="font-medium">{product.sku}</span>
                </div>
              )}
              {product.category && (
                <div className="flex gap-2">
                  <span className="text-muted-foreground min-w-[80px]">
                    {t("category")}:
                  </span>
                  <Link
                    href={`/${locale}/shop?category=${product.category.slug}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {product.category.name}
                  </Link>
                </div>
              )}
              {product.tags?.length > 0 && (
                <div className="flex gap-2 flex-wrap items-start">
                  <span className="text-muted-foreground min-w-[80px]">
                    {t("tags")}:
                  </span>
                  <div className="flex gap-1 flex-wrap">
                    {product.tags.map((tag: string) => (
                      <Link
                        key={tag}
                        href={`/${locale}/shop?tags=${tag}`}
                        className="text-xs bg-muted hover:bg-primary/10 hover:text-primary px-2.5 py-1 rounded-full transition-colors"
                      >
                        {tag}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/*  Description  */}
        <div className="mt-16 border-t border-border pt-10">
          <h2 className="text-xl font-bold mb-4">{t("description")}</h2>
          <div className="prose dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
            {product.description}
          </div>
        </div>

        {/*  Reviews  */}
        <div className="mt-16 border-t border-border pt-10">
          <h2 className="text-xl font-bold mb-6">
            {t("reviews")} ({product.reviewCount})
          </h2>

          {/* Review form */}
          {session?.user && (
            <div className="bg-muted/30 border border-border rounded-2xl p-6 mb-8">
              <h3 className="font-semibold mb-4">{t("writeReview")}</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {t("rating")}
                  </label>
                  <RatingStars
                    rating={reviewRating}
                    onChange={setReviewRating}
                    allowHalf
                    starClassName="h-5 w-5"
                  />
                </div>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder={t("writeReview") + "..."}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                />
                <button
                  onClick={() => reviewMutation.mutate()}
                  disabled={reviewMutation.isPending}
                  className="bg-primary text-primary-foreground font-medium px-6 py-2.5 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {reviewMutation.isPending
                    ? tCommon("loading")
                    : t("submitReview")}
                </button>
              </div>
            </div>
          )}

          {/* Review list */}
          {product.reviews?.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {t("noReviews")}
            </p>
          ) : (
            <div className="space-y-4">
              {product.reviews?.map((review: Review) => (
                <div
                  key={review.id}
                  className="border border-border rounded-2xl p-5"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
                        {review.user?.name?.[0]?.toUpperCase() || "U"}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {review.user?.name || "Anonymous"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <RatingStars rating={review.rating} starClassName="h-5 w-5" />
                  </div>
                  {review.comment && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {review.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/*  Similar Products  */}
        {similar && similar.length > 0 && (
          <div className="mt-16 border-t border-border pt-10">
            <h2 className="text-xl font-bold mb-6">{t("similar")}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {similar.map((p: any) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
