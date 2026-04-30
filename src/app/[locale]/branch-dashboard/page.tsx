"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import Link from "next/link";
import { Clock, Package, CheckCircle, ChevronRight } from "lucide-react";
import { branchApi } from "@/lib/api";
import { formatPrice, formatDateTime } from "@/lib/utils";
import { Skeleton } from "@/components/common/skeletons";

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

export default function BranchDashboardPage() {
  const locale = useLocale();

  const { data, isLoading } = useQuery({
    queryKey: ["branch-dashboard"],
    queryFn: () => branchApi.dashboard({ limit: 10 }).then((r) => r.data),
    refetchInterval: 15_000,
  });

  const stats = data?.stats;

  const statCards = stats
    ? [
        {
          label: "Pending",
          value: stats.pendingCount,
          icon: Clock,
          color: "text-yellow-500",
          bg: "bg-yellow-50 dark:bg-yellow-900/20",
        },
        {
          label: "Preparing",
          value: stats.preparingCount,
          icon: Package,
          color: "text-purple-500",
          bg: "bg-purple-50 dark:bg-purple-900/20",
        },
        {
          label: "Ready",
          value: stats.readyCount,
          icon: CheckCircle,
          color: "text-green-500",
          bg: "bg-green-50 dark:bg-green-900/20",
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link
          href={`/${locale}/branch-dashboard/orders`}
          className="flex items-center gap-1 text-sm text-primary font-medium hover:underline"
        >
          All Orders <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))
          : statCards.map(({ label, value, icon: Icon, color, bg }) => (
              <div
                key={label}
                className={`${bg} rounded-2xl p-5 border border-border`}
              >
                <div className={`${color} mb-2`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
      </div>

      {/* Recent orders */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-semibold">Recent Orders</h2>
        </div>
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {data?.orders?.data?.slice(0, 8).map((order: any) => (
              <div
                key={order.id}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors"
              >
                <div>
                  <p className="font-mono font-semibold text-sm">
                    {order.orderNumber}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {order.user?.name} · {formatDateTime(order.createdAt)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {order.fulfillmentType === "delivery"
                      ? `Delivery: ${[order.deliveryStreet, order.deliveryDistrict, order.deliverySector]
                          .filter(Boolean)
                          .join(", ")}`
                      : `Pick-up: ${new Date(order.pickupTime).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[order.status]}`}
                  >
                    {order.status.replace("_", " ")}
                  </span>
                  <span className="font-bold text-sm text-primary">
                    {formatPrice(order.total)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
