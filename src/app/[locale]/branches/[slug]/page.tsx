"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  Clock,
  Star,
  Phone,
  ShoppingCart,
  Plus,
  Minus,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { branchApi } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import { formatPrice, getImageUrl, formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/common/skeletons";
import { Pagination } from "@/components/common/pagination";
import { ConversationalSearch } from "@/components/search/conversation-search";

// MoMo deposit modal
function MoMoModal({
  orderId,
  depositAmount,
  orderNumber,
  onClose,
  onSuccess,
}: {
  orderId: string;
  depositAmount: number;
  orderNumber: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const t = useTranslations("branches");
  const [momoNumber, setMomoNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    if (!momoNumber.trim()) return;
    setLoading(true);
    try {
      await branchApi.payDeposit(orderId, momoNumber);
      onSuccess();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-bold text-lg mb-1">MoMo Deposit</h2>
        <p className="text-sm text-muted-foreground mb-5">
          Order #{orderNumber}
        </p>

        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-5">
          <p className="font-bold text-primary text-xl text-center">
            RWF {depositAmount.toLocaleString()}
          </p>
          <p className="text-xs text-center text-muted-foreground mt-1">
            {t("depositNote")}
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              {t("momoNumber")}
            </label>
            <input
              value={momoNumber}
              onChange={(e) => setMomoNumber(e.target.value)}
              placeholder={t("momoPlaceholder")}
              type="tel"
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {t("momoNote")}
            </p>
          </div>

          <button
            onClick={handlePay}
            disabled={loading || !momoNumber.trim()}
            className="w-full bg-primary text-primary-foreground font-semibold py-3.5 rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {loading
              ? t("processingPayment")
              : t("payDeposit", { amount: depositAmount.toLocaleString() })}
          </button>
          <button
            onClick={onClose}
            className="w-full border border-border py-2.5 rounded-xl hover:bg-muted transition-colors text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BranchDetailPage() {
  const t = useTranslations("branches");
  const locale = useLocale();
  const { slug } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const qc = useQueryClient();

  const [cart, setCart] = useState<Record<string, number>>({});
  const [pickupTime, setPickupTime] = useState("");
  const [notes, setNotes] = useState("");
  const [stockPage, setStockPage] = useState(1);
  const [momoModal, setMomoModal] = useState<{
    orderId: string;
    amount: number;
    orderNumber: string;
  } | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<{
    orderNumber: string;
    branchName: string;
    pickupTime: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<"shop" | "reviews">("shop");

  const { data: branch, isLoading: branchLoading } = useQuery({
    queryKey: ["branch", slug],
    queryFn: () => branchApi.get(slug as string).then((r) => r.data),
  });

  const { data: stockData, isLoading: stockLoading } = useQuery({
    queryKey: ["branch-stock", branch?.id, stockPage],
    queryFn: () =>
      branchApi
        .stock(branch!.id, { page: stockPage, limit: 12 })
        .then((r) => r.data),
    enabled: !!branch?.id,
  });

  const orderMutation = useMutation({
    mutationFn: (data: any) => branchApi.createOrder(data).then((r) => r.data),
    onSuccess: (data) => {
      setMomoModal({
        orderId: data.order.id,
        amount: data.depositAmount,
        orderNumber: data.order.orderNumber,
      });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || "Order failed"),
  });

  const totalItems = Object.values(cart).reduce((s, q) => s + q, 0);
  const totalPrice =
    stockData?.data?.reduce((sum: number, item: any) => {
      return sum + (cart[item.productId] || 0) * item.product.price;
    }, 0) || 0;

  const handleQty = (productId: string, delta: number, max: number) => {
    setCart((c) => {
      const cur = c[productId] || 0;
      const next = Math.max(0, Math.min(max, cur + delta));
      if (next === 0) {
        const { [productId]: _, ...rest } = c;
        return rest;
      }
      return { ...c, [productId]: next };
    });
  };

  const handlePlaceOrder = () => {
    if (!session?.user) {
      router.push(`/${locale}/auth/sign-in`);
      return;
    }
    if (totalItems === 0) {
      toast.error("Add items to your order first");
      return;
    }
    if (!pickupTime) {
      toast.error("Select a pick-up time");
      return;
    }

    orderMutation.mutate({
      branchId: branch.id,
      items: Object.entries(cart).map(([productId, quantity]) => ({
        productId,
        quantity,
      })),
      pickupTime: new Date(pickupTime).toISOString(),
      notes,
    });
  };

  const handleDepositSuccess = () => {
    setMomoModal(null);
    setOrderSuccess({
      orderNumber: momoModal!.orderNumber,
      branchName: branch.name,
      pickupTime,
    });
    setCart({});
    qc.invalidateQueries({ queryKey: ["my-branch-orders"] });
  };

  if (branchLoading)
    return (
      <div className="container mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-6 w-48" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      </div>
    );

  if (!branch)
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">Branch not found</p>
        <Link
          href={`/${locale}/branches`}
          className="mt-4 inline-block text-primary hover:underline"
        >
          ← All Branches
        </Link>
      </div>
    );

  // Success screen
  if (orderSuccess)
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-md">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-10 w-10 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">{t("orderConfirmed")}</h1>
        <p className="text-muted-foreground mb-6">
          {t("orderConfirmedDesc", {
            number: orderSuccess.orderNumber,
            branch: orderSuccess.branchName,
            time: new Date(orderSuccess.pickupTime).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          })}
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link
            href={`/${locale}/account/pickup-orders`}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            {t("viewMyOrders")}
          </Link>
          <Link
            href={`/${locale}/branches`}
            className="border border-border px-6 py-3 rounded-xl font-medium hover:bg-muted transition-colors"
          >
            ← {t("title")}
          </Link>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-background">
      {/* Branch Header */}
      <div className="bg-primary/5 border-b border-border py-10">
        <div className="container mx-auto px-4">
          <Link
            href={`/${locale}/branches`}
            className="text-sm text-muted-foreground hover:text-primary transition-colors mb-4 inline-block"
          >
            ← {t("title")}
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">{branch.name}</h1>
              <p className="text-muted-foreground mt-1 flex items-center gap-1.5">
                <MapPin className="h-4 w-4 shrink-0" /> {branch.address}
              </p>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {branch.openTime} – {branch.closeTime}
                </span>
                {branch.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    {branch.phone}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                  {branch.rating > 0 ? branch.rating.toFixed(1) : "New"} (
                  {branch.reviewCount})
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* AI Search */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">
              Search products at this branch
            </span>
          </div>
          <ConversationalSearch branchId={branch.id} />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-muted p-1 rounded-xl w-fit">
          {(["shop", "reviews"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${activeTab === tab ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {tab === "shop" ? "Shop" : `Reviews (${branch.reviewCount})`}
            </button>
          ))}
        </div>

        {activeTab === "shop" && (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Products */}
            <div className="lg:col-span-2">
              {stockLoading ? (
                <div className="grid sm:grid-cols-2 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-52 rounded-2xl" />
                  ))}
                </div>
              ) : stockData?.data?.length === 0 ? (
                <p className="text-muted-foreground text-center py-12">
                  {t("outOfStock")}
                </p>
              ) : (
                <>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {stockData?.data?.map((item: any) => {
                      const qty = cart[item.productId] || 0;
                      return (
                        <div
                          key={item.id}
                          className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-colors"
                        >
                          <div className="relative aspect-[4/3] bg-muted">
                            <Image
                              src={getImageUrl(item.product.images?.[0])}
                              alt={item.product.name}
                              fill
                              className="object-contain p-3"
                              sizes="(max-width:640px) 100vw, 300px"
                            />
                            {item.stock <= 5 && item.stock > 0 && (
                              <div className="absolute top-2 left-2 bg-yellow-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg">
                                Only {item.stock} left
                              </div>
                            )}
                          </div>
                          <div className="p-3">
                            <p className="text-xs text-muted-foreground">
                              {item.product.category?.name}
                            </p>
                            <p className="font-semibold text-sm mt-0.5 line-clamp-2">
                              {item.product.name}
                            </p>
                            <p className="text-primary font-bold mt-1">
                              {formatPrice(item.product.price)}
                            </p>
                            <div className="mt-3">
                              {qty === 0 ? (
                                <button
                                  onClick={() =>
                                    handleQty(item.productId, 1, item.stock)
                                  }
                                  disabled={item.stock === 0}
                                  className="w-full flex items-center justify-center gap-1.5 bg-primary text-primary-foreground text-sm font-medium py-2.5 rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors"
                                >
                                  <ShoppingCart className="h-4 w-4" /> Add
                                </button>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() =>
                                      handleQty(item.productId, -1, item.stock)
                                    }
                                    className="w-9 h-9 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors"
                                  >
                                    <Minus className="h-3.5 w-3.5" />
                                  </button>
                                  <span className="flex-1 text-center font-bold">
                                    {qty}
                                  </span>
                                  <button
                                    onClick={() =>
                                      handleQty(item.productId, 1, item.stock)
                                    }
                                    disabled={qty >= item.stock}
                                    className="w-9 h-9 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-40"
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <Pagination
                    page={stockPage}
                    totalPages={stockData?.pagination?.totalPages || 1}
                    onPageChange={setStockPage}
                    className="mt-6"
                  />
                </>
              )}
            </div>

            {/* Order Summary sidebar */}
            <div>
              <div className="bg-card border border-border rounded-2xl p-5 sticky top-24">
                <h2 className="font-bold text-lg mb-4">Your Order</h2>

                {totalItems === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    Add items from the left to build your order
                  </p>
                ) : (
                  <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                    {Object.entries(cart).map(([productId, qty]) => {
                      const item = stockData?.data?.find(
                        (s: any) => s.productId === productId,
                      );
                      if (!item) return null;
                      return (
                        <div
                          key={productId}
                          className="flex justify-between text-sm"
                        >
                          <span className="truncate mr-2">
                            {item.product.name} x{qty}
                          </span>
                          <span className="font-medium shrink-0">
                            {formatPrice(item.product.price * qty)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="border-t border-border pt-3 mb-4">
                  <div className="flex justify-between font-bold">
                    <span>Subtotal</span>
                    <span className="text-primary">
                      {formatPrice(totalPrice)}
                    </span>
                  </div>
                </div>

                {/* Pickup time */}
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1.5">
                    {t("pickupTime")}
                  </label>
                  <input
                    type="datetime-local"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("pickupTimeNote")}
                  </p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1.5">
                    Notes (optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                    placeholder="Any special requests..."
                  />
                </div>

                {/* Deposit notice */}
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 mb-4">
                  <p className="text-xs text-primary font-medium">
                    {t("depositRequired", { amount: "500" })}
                  </p>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={
                    orderMutation.isPending || totalItems === 0 || !pickupTime
                  }
                  className="w-full bg-primary text-primary-foreground font-semibold py-3.5 rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {orderMutation.isPending
                    ? "Placing order..."
                    : t("placePickupOrder")}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="max-w-2xl">
            {branch.reviews?.length === 0 ? (
              <p className="text-muted-foreground text-center py-12">
                {t("noReviews")}
              </p>
            ) : (
              <div className="space-y-4">
                {branch.reviews?.map((review: any) => (
                  <div
                    key={review.id}
                    className="bg-card border border-border rounded-2xl p-5"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
                          {review.user?.name?.[0]?.toUpperCase()}
                        </div>
                        <p className="font-medium text-sm">
                          {review.user?.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3.5 w-3.5 ${i < review.rating ? "fill-primary text-primary" : "text-muted-foreground"}`}
                          />
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-muted-foreground">
                        {review.comment}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDate(review.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MoMo Modal */}
      {momoModal && (
        <MoMoModal
          orderId={momoModal.orderId}
          depositAmount={momoModal.amount}
          orderNumber={momoModal.orderNumber}
          onClose={() => setMomoModal(null)}
          onSuccess={handleDepositSuccess}
        />
      )}
    </div>
  );
}
