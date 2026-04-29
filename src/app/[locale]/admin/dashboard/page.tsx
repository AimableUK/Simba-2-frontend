"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { format } from "date-fns";
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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  pending: "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30",
  confirmed: "text-blue-600 bg-blue-100 dark:bg-blue-900/30",
  packaged: "text-purple-600 bg-purple-100 dark:bg-purple-900/30",
  on_the_way: "text-orange-600 bg-orange-100 dark:bg-orange-900/30",
  delivered: "text-green-600 bg-green-100 dark:bg-green-900/30",
  cancelled: "text-red-600 bg-red-100 dark:bg-red-900/30",
};

const REVENUE_PRESETS = [
  "today",
  "yesterday",
  "week",
  "month",
  "year",
  "lifetime",
  "custom",
] as const;

export default function AdminDashboard() {
  const locale = useLocale();
  const t = useTranslations("admin.dashboard");
  const [revenuePreset, setRevenuePreset] =
    useState<(typeof REVENUE_PRESETS)[number]>("month");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [customOpen, setCustomOpen] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => orderApi.dashboard().then((r) => r.data),
    refetchInterval: 30_000,
  });

  const revenueParams = useMemo(() => {
    if (revenuePreset === "custom") {
      return {
        period: "custom",
        ...(fromDate && { from: fromDate }),
        ...(toDate && { to: toDate }),
      };
    }
    return { period: revenuePreset };
  }, [fromDate, revenuePreset, toDate]);

  const { data: revenueStats, isLoading: revenueLoading } = useQuery({
    queryKey: ["admin-dashboard-revenue", revenueParams],
    queryFn: () => orderApi.dashboard(revenueParams).then((r) => r.data),
    refetchInterval: 30_000,
  });

  const selectedPresetLabel = t(`periods.${revenuePreset}`);

  const revenueTitle = useMemo(() => {
    if (revenuePreset !== "custom") {
      return t("revenueTitle", { period: selectedPresetLabel });
    }
    if (fromDate && toDate) {
      return t("revenueCustomTitle", {
        from: format(new Date(fromDate), "MMM d, yyyy"),
        to: format(new Date(toDate), "MMM d, yyyy"),
      });
    }
    return t("revenueCustomRange");
  }, [fromDate, revenuePreset, selectedPresetLabel, t, toDate]);

  const canApplyCustomRange = Boolean(fromDate && toDate);

  const applyCustomRange = () => {
    if (!fromDate || !toDate) {
      toast.error(t("pickBothDates"));
      return;
    }
    if (new Date(fromDate) > new Date(toDate)) {
      toast.error(t("startBeforeEnd"));
      return;
    }
    setCustomOpen(false);
  };

  const statCards = stats
    ? [
        {
          label: t("totalRevenue"),
          value: formatPrice(stats.totalRevenue),
          icon: DollarSign,
          trend: t("growth12"),
          color: "text-green-500",
        },
        {
          label: t("monthRevenue"),
          value: formatPrice(stats.monthRevenue),
          icon: TrendingUp,
          trend: t("growth8"),
          color: "text-blue-500",
        },
        {
          label: t("totalOrders"),
          value: stats.totalOrders.toLocaleString(),
          icon: ShoppingCart,
          trend: t("todayCount", { count: stats.todayOrders }),
          color: "text-primary",
        },
        {
          label: t("pendingOrders"),
          value: stats.pendingOrders.toLocaleString(),
          icon: Clock,
          trend: t("needsAttention"),
          color: "text-yellow-500",
        },
        {
          label: t("totalProducts"),
          value: stats.totalProducts.toLocaleString(),
          icon: Package,
          trend: t("activeListings"),
          color: "text-purple-500",
        },
        {
          label: t("totalUsers"),
          value: stats.totalUsers.toLocaleString(),
          icon: Users,
          trend: t("registered"),
          color: "text-indigo-500",
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {t("welcome")}
          </p>
        </div>
        <Link
          href={`/${locale}/admin/orders`}
          className="flex items-center gap-2 text-sm text-primary hover:underline font-medium"
        >
          {t("viewOrders")} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {statsLoading
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
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h2 className="font-semibold">{revenueTitle}</h2>
          <div className="flex items-center gap-2">
            <Select
              value={revenuePreset}
              onValueChange={(value) => {
                setRevenuePreset(value as (typeof REVENUE_PRESETS)[number]);
                if (value !== "custom") setCustomOpen(false);
              }}
            >
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder={t("selectPeriod")} />
              </SelectTrigger>
              <SelectContent>
                {REVENUE_PRESETS.map((preset) => (
                  <SelectItem key={preset} value={preset}>
                    {t(`periods.${preset}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {revenuePreset === "custom" && (
              <Popover open={customOpen} onOpenChange={setCustomOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="whitespace-nowrap">
                    {fromDate && toDate
                      ? `${format(new Date(fromDate), "MMM d")} - ${format(
                          new Date(toDate),
                          "MMM d",
                        )}`
                      : t("pickDates")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-1.5">{t("from")}</p>
                      <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1.5">{t("to")}</p>
                      <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCustomOpen(false)}
                      >
                        {t("cancel")}
                      </Button>
                      <Button
                        type="button"
                        onClick={applyCustomRange}
                        disabled={!canApplyCustomRange}
                      >
                        {t("apply")}
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>
        {statsLoading || revenueLoading ? (
          <div className="h-64 bg-muted animate-pulse rounded-xl" />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenueStats?.revenueByDay || []}>
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
                    new Date(v).toLocaleDateString(locale, {
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
                formatter={(v: any) => [formatPrice(v), t("revenue")]}
                labelFormatter={(l) =>
                  new Date(l).toLocaleDateString(locale, {
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
            <h2 className="font-semibold">{t("topProducts")}</h2>
            <Link
              href={`/${locale}/admin/products`}
              className="text-xs text-primary hover:underline"
            >
              {t("viewAll")}
            </Link>
          </div>
          <div className="space-y-3">
            {statsLoading
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
                        {t("sold", { count: p.salesCount })}
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
            <h2 className="font-semibold">{t("recentOrders")}</h2>
            <Link
              href={`/${locale}/admin/orders`}
              className="text-xs text-primary hover:underline"
            >
              {t("viewAll")}
            </Link>
          </div>
          <div className="space-y-3">
            {statsLoading
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
