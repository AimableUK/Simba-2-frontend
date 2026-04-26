"use client";
import { useQuery } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { Package, ChevronRight, Clock } from "lucide-react";
import { orderApi } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import {
  formatPrice,
  formatDateTime,
  getImageUrl,
  ORDER_STATUS_STEPS,
} from "@/lib/utils";
import { OrderCardSkeleton } from "@/components/common/skeletons";
import { Pagination } from "@/components/common/pagination";
import { useState } from "react";
import type { Order } from "@/types";

const STATUS_COLORS: Record<string, string> = {
  pending:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  accepted: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  preparing:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  ready:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  picked_up:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export default function OrdersPage() {
  const t = useTranslations("orders");
  const locale = useLocale();
  const { data: session } = useSession();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["my-orders", page],
    queryFn: () => orderApi.myOrders({ page, limit: 10 }).then((r) => r.data),
    enabled: !!session?.user,
  });

  if (!session?.user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground mb-4">
          Please sign in to view your orders
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
      <h1 className="text-2xl font-bold mb-8">{t("title")}</h1>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <OrderCardSkeleton key={i} />
          ))}
        </div>
      ) : data?.data?.length === 0 ? (
        <div className="text-center py-20">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">{t("noOrders")}</h2>
          <p className="text-muted-foreground mb-6">{t("noOrdersDesc")}</p>
          <Link
            href={`/${locale}/shop`}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {data?.data?.map((order: Order) => (
            <Link
              key={order.id}
              href={`/${locale}/account/orders/${order.id}`}
              className="block"
            >
              <div className="bg-card border border-border rounded-2xl p-5 hover:border-primary/40 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold">
                      {t("orderNumber")}
                      {order.orderNumber}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDateTime(order.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-medium px-3 py-1.5 rounded-full ${STATUS_COLORS[order.status]}`}
                    >
                      {t(`status.${order.status}`)}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="flex gap-2 mb-3">
                  {order.items.slice(0, 4).map((item, idx) => (
                    <div
                      key={item.id}
                      className="relative w-14 h-14 rounded-xl overflow-hidden bg-muted border border-border"
                    >
                      {item.image ? (
                        <Image
                          src={getImageUrl(item.image)}
                          alt={item.name}
                          fill
                          className="object-contain p-1"
                          sizes="56px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                          {item.name[0]}
                        </div>
                      )}
                      {idx === 3 && order.items.length > 4 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs font-bold rounded-xl">
                          +{order.items.length - 4}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {order.items.length} items
                  </span>
                  <span className="font-bold text-primary">
                    {formatPrice(order.total)}
                  </span>
                </div>
              </div>
            </Link>
          ))}

          <Pagination
            page={page}
            totalPages={data?.pagination?.totalPages || 1}
            onPageChange={setPage}
            className="mt-8"
          />
        </div>
      )}
    </div>
  );
}
