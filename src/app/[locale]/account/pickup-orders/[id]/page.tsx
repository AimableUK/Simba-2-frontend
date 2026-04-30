"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { Package, Clock, Star } from "lucide-react";
import { branchApi } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import { formatPrice, formatDateTime } from "@/lib/utils";
import { OrderCardSkeleton } from "@/components/common/skeletons";
import { Pagination } from "@/components/common/pagination";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  pending:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  accepted: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  preparing:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  ready: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  picked_up: "bg-muted text-muted-foreground",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

function ReviewModal({ order, onClose }: { order: any; onClose: () => void }) {
  const t = useTranslations("branches");
  const qc = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const mutation = useMutation({
    mutationFn: () => branchApi.reviewBranch(order.id, { rating, comment }),
    onSuccess: () => {
      toast.success(t("reviewSuccess"));
      qc.invalidateQueries({ queryKey: ["my-pickup-orders"] });
      onClose();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || "Failed"),
  });

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-bold text-lg mb-1">{t("reviewBranch")}</h2>
        <p className="text-sm text-muted-foreground mb-5">
          {order.branch?.name}
        </p>

        <div className="flex gap-1 mb-4">
          {[1, 2, 3, 4, 5].map((s) => (
            <button key={s} onClick={() => setRating(s)}>
              <Star
                className={`h-7 w-7 transition-colors ${s <= rating ? "fill-primary text-primary" : "text-muted-foreground"}`}
              />
            </button>
          ))}
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t("reviewPlaceholder")}
          rows={3}
          className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none mb-4"
        />

        <div className="flex gap-3">
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="flex-1 bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/90 disabled:opacity-50"
          >
            {mutation.isPending ? "Submitting..." : t("submitReview")}
          </button>
          <button
            onClick={onClose}
            className="px-5 py-3 border border-border rounded-xl hover:bg-muted font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PickupOrdersPage() {
  const t = useTranslations("branches");
  const locale = useLocale();
  const { data: session } = useSession();
  const [page, setPage] = useState(1);
  const [reviewOrder, setReviewOrder] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["my-pickup-orders", page],
    queryFn: () => branchApi.myOrders({ page, limit: 10 }).then((r) => r.data),
    enabled: !!session?.user,
  });

  if (!session?.user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground mb-4">
          Please sign in to view your pick-up orders
        </p>
        <Link
          href={`/${locale}/auth/sign-in`}
          className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-8">{t("myPickupOrders")}</h1>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <OrderCardSkeleton key={i} />
          ))}
        </div>
      ) : data?.data?.length === 0 ? (
        <div className="text-center py-20">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-6">No pick-up orders yet</p>
          <Link
            href={`/${locale}/branches`}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            Browse Branches
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {data?.data?.map((order: any) => (
            <div
              key={order.id}
              className="bg-card border border-border rounded-2xl p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold">{order.orderNumber}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDateTime(order.createdAt)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {order.branch?.name}
                  </p>
                </div>
                <span
                  className={`text-xs font-medium px-3 py-1.5 rounded-full ${STATUS_COLORS[order.status]}`}
                >
                  {t(`status.${order.status}`)}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm mb-3">
                <span className="text-muted-foreground">
                  {order.items?.length} items
                </span>
                <span className="font-bold text-primary">
                  {formatPrice(order.total)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3">
                <span>
                  Pick-up:{" "}
                  {order.fulfillmentType === "delivery"
                    ? [order.deliveryStreet, order.deliveryDistrict, order.deliverySector]
                        .filter(Boolean)
                        .join(", ")
                    : new Date(order.pickupTime).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                </span>
                <div className="flex items-center gap-3">
                  {order.status === "picked_up" && !order.review && (
                    <button
                      onClick={() => setReviewOrder(order)}
                      className="flex items-center gap-1 text-primary font-medium hover:underline"
                    >
                      <Star className="h-3.5 w-3.5" /> Rate
                    </button>
                  )}
                  {order.paymentStatus === "pending" && (
                    <Link
                      href={`/${locale}/branches/${order.branch?.slug}`}
                      className="text-primary font-medium hover:underline"
                    >
                      Pay Deposit
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}

          <Pagination
            page={page}
            totalPages={data?.pagination?.totalPages || 1}
            onPageChange={setPage}
            className="mt-6"
          />
        </div>
      )}

      {reviewOrder && (
        <ReviewModal order={reviewOrder} onClose={() => setReviewOrder(null)} />
      )}
    </div>
  );
}
