"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
  TrendingUp,
  ShoppingCart,
  Users,
  Package,
  Clock,
  DollarSign,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { orderApi } from "@/lib/api";
import { formatPrice, formatDateTime } from "@/lib/utils";
import {
  StatCardSkeleton,
  TableRowSkeleton,
} from "@/components/common/skeletons";

const STATUS_COLORS: Record<string, string> = {
  pending: "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30",
  confirmed: "text-blue-600 bg-blue-100 dark:bg-blue-900/30",
  packaged: "text-purple-600 bg-purple-100 dark:bg-purple-900/30",
  on_the_way: "text-orange-600 bg-orange-100 dark:bg-orange-900/30",
  delivered: "text-green-600 bg-green-100 dark:bg-green-900/30",
  cancelled: "text-red-600 bg-red-100 dark:bg-red-900/30",
};

export default function AdminDashboard() {
  const locale = useLocale();
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => orderApi.dashboard().then((r) => r.data),
    refetchInterval: 30_000,
  });

  const statCards = stats
    ? [
        {
          label: "Total Revenue",
          value: formatPrice(stats.totalRevenue),
          icon: DollarSign,
          trend: "+12%",
          color: "text-green-500",
        },
        {
          label: "This Month's Revenue",
          value: formatPrice(stats.monthRevenue),
          icon: TrendingUp,
          trend: "+8%",
          color: "text-blue-500",
        },
        {
          label: "Total Orders",
          value: stats.totalOrders.toLocaleString(),
          icon: ShoppingCart,
          trend: `${stats.todayOrders} today`,
          color: "text-primary",
        },
        {
          label: "Pending Orders",
          value: stats.pendingOrders.toLocaleString(),
          icon: Clock,
          trend: "Needs attention",
          color: "text-yellow-500",
        },
        {
          label: "Total Products",
          value: stats.totalProducts.toLocaleString(),
          icon: Package,
          trend: "Active listings",
          color: "text-purple-500",
        },
        {
          label: "Total Users",
          value: stats.totalUsers.toLocaleString(),
          icon: Users,
          trend: "Registered",
          color: "text-indigo-500",
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Welcome back! Here's what's happening.
          </p>
        </div>
        <Link
          href={`/${locale}/admin/orders`}
          className="flex items-center gap-2 text-sm text-primary hover:underline font-medium"
        >
          View Orders <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))
          : statCards.map(({ label, value, icon: Icon, trend, color }) => (
              <div
                key={label}
                className="bg-card border border-border rounded-2xl p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <p className="text-xs text-muted-foreground font-medium leading-tight">
                    {label}
                  </p>
                  <div
                    className={`w-8 h-8 rounded-xl bg-muted flex items-center justify-center ${color}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground mt-1">{trend}</p>
              </div>
            ))}
      </div>

      {/* Revenue Chart */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="font-semibold mb-6">Revenue - Last 30 Days</h2>
        {isLoading ? (
          <div className="h-64 bg-muted animate-pulse rounded-xl" />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={stats?.revenueByDay || []}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fc7d00" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#fc7d00" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickFormatter={(v) =>
                  new Date(v).toLocaleDateString("en", {
                    month: "short",
                    day: "numeric",
                  })
                }
                className="text-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                className="text-muted-foreground"
              />
              <Tooltip
                formatter={(v: any) => [formatPrice(v), "Revenue"]}
                labelFormatter={(l) =>
                  new Date(l).toLocaleDateString("en", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })
                }
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#fc7d00"
                strokeWidth={2}
                fill="url(#revGrad)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Top Products</h2>
            <Link
              href={`/${locale}/admin/products`}
              className="text-xs text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {isLoading
              ? [1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-10 bg-muted animate-pulse rounded-lg"
                  />
                ))
              : stats?.topProducts?.map((p: any, idx: number) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <span className="w-6 text-center text-sm font-bold text-muted-foreground">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.salesCount} sold
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-primary shrink-0">
                      {formatPrice(p.price)}
                    </p>
                  </div>
                ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Recent Orders</h2>
            <Link
              href={`/${locale}/admin/orders`}
              className="text-xs text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {isLoading
              ? [1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-14 bg-muted animate-pulse rounded-xl"
                  />
                ))
              : stats?.recentOrders?.slice(0, 6).map((o: any) => (
                  <Link
                    key={o.id}
                    href={`/${locale}/admin/orders`}
                    className="flex items-center gap-3 hover:bg-muted/50 rounded-xl p-2 -mx-2 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium">{o.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {o.user?.name} · {formatDateTime(o.createdAt)}
                      </p>
                    </div>
                    <div className="ml-auto text-right shrink-0">
                      <p className="text-sm font-bold">
                        {formatPrice(o.total)}
                      </p>
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[o.status]}`}
                      >
                        {o.status.replace("_", " ")}
                      </span>
                    </div>
                  </Link>
                ))}
          </div>
        </div>
      </div>
    </div>
  );
}
