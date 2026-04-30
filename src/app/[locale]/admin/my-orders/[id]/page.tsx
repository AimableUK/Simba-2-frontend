"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  CheckCircle,
  Circle,
  Clock,
  XCircle,
  ShoppingBag,
  ChefHat,
  Bell,
  ArrowLeft,
} from "lucide-react";
import { orderApi } from "@/lib/api";
import { useOrderSocket } from "@/hooks/useSocket";
import { formatPrice, formatDateTime, getImageUrl } from "@/lib/utils";
import { Skeleton } from "@/components/common/skeletons";
import { useCallback } from "react";

//  Match your BranchOrderStatus enum exactly

const ORDER_STATUS_STEPS = [
  "pending",
  "accepted",
  "preparing",
  "ready",
  "picked_up",
] as const;

type OrderStatus = (typeof ORDER_STATUS_STEPS)[number] | "cancelled";

const STATUS_ICONS: Record<string, any> = {
  pending: Clock,
  accepted: CheckCircle,
  preparing: ChefHat,
  ready: Bell,
  picked_up: ShoppingBag,
  cancelled: XCircle,
};

//  Types

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
}

interface StatusLog {
  id: string;
  status: string;
  note?: string;
  createdAt: string;
}

interface Branch {
  id: string;
  name: string;
  address: string;
  phone?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: string;
  subtotal: number;
  depositAmount: number;
  total: number;
  pickupTime: string;
  notes?: string;
  createdAt: string;
  items: OrderItem[];
  statusLogs?: StatusLog[];
  branch?: Branch;
}

//  Page

export default function OrderDetailPage() {
  const t = useTranslations("orders");
  const locale = useLocale();
  const { id } = useParams();
  const qc = useQueryClient();

  const { data: order, isLoading } = useQuery<Order>({
    queryKey: ["order", id],
    queryFn: () => orderApi.myOrder(id as string).then((r) => r.data),
  });

  const handleOrderUpdate = useCallback(
    (data: any) => {
      qc.setQueryData(["order", id], (old: any) => {
        if (!old) return old;
        const nextStatus = data?.status || old.status;
        const nextLog = data?.statusLog;
        const nextLogs = nextLog
          ? [
              ...(old.statusLogs || []).filter(
                (l: any) => l.status !== nextLog.status,
              ),
              nextLog,
            ]
          : old.statusLogs;

        return {
          ...old,
          status: nextStatus,
          statusLogs: nextLogs,
          paymentStatus: data?.paymentStatus || old.paymentStatus,
        };
      });
      qc.invalidateQueries({ queryKey: ["order", id] });
    },
    [id, qc],
  );

  useOrderSocket(id as string, handleOrderUpdate);

  //  Loading
  if (isLoading)
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );

  //  Not found
  if (!order)
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">{t("notFound")}</p>
        <Link
          href={`/${locale}/admin/my-orders`}
          className="mt-4 inline-flex items-center gap-2 text-primary hover:underline"
        >
          <ArrowLeft size={16} strokeWidth={2.25} /> {t("title")}
        </Link>
      </div>
    );

  const isCancelled = order.status === "cancelled";
  const currentStep = ORDER_STATUS_STEPS.indexOf(
    order.status as (typeof ORDER_STATUS_STEPS)[number],
  );

  //  Render
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Back link */}
      <div className="mb-6">
        <Link
          href={`/${locale}/admin/my-orders`}
          className="text-muted-foreground hover:text-primary transition-colors text-sm"
        >
          <ArrowLeft strokeWidth={2.25} /> {t("title")}
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">
            {t("orderNumber")} {order.orderNumber}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {formatDateTime(order.createdAt)}
          </p>
        </div>
        <div className="text-right">
          <p className="font-bold text-xl text-primary">
            {formatPrice(order.total)}
          </p>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full mt-1 inline-block ${
              order.paymentStatus === "paid"
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : order.paymentStatus === "failed"
                  ? "bg-red-100 text-red-700"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
            }`}
          >
            {order.paymentStatus}
          </span>
        </div>
      </div>

      {/* Cancelled banner */}
      {isCancelled && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-4 mb-4 flex items-center gap-3">
          <XCircle className="h-5 w-5 text-destructive shrink-0" />
          <p className="text-sm text-destructive font-medium">
            {t("cancelledMessage")}
          </p>
        </div>
      )}

      {/* Timeline */}
      {!isCancelled && (
        <div className="bg-card border border-border rounded-2xl p-6 mb-4">
          <h2 className="font-semibold mb-6">{t("timeline")}</h2>
          <div className="relative">
            {/* Track line */}
            <div className="absolute left-[18px] top-5 bottom-5 w-0.5 bg-border" />
            {currentStep >= 0 && (
              <div
                className="absolute left-[18px] top-5 w-0.5 bg-primary transition-all duration-700"
                style={{
                  height: `${Math.min(
                    100,
                    (currentStep / (ORDER_STATUS_STEPS.length - 1)) * 100,
                  )}%`,
                }}
              />
            )}

            <div className="space-y-6">
              {ORDER_STATUS_STEPS.map((step, idx) => {
                const Icon = STATUS_ICONS[step] || Circle;
                const done = idx <= currentStep;
                const active = idx === currentStep;
                const log = order.statusLogs?.find((l) => l.status === step);

                return (
                  <div key={step} className="flex gap-4 relative">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 z-10 transition-colors border-2 ${
                        done
                          ? "bg-primary border-primary text-white"
                          : "bg-background border-border text-muted-foreground"
                      } ${active ? "ring-4 ring-primary/20" : ""}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="pt-1.5">
                      <p
                        className={`font-medium text-sm ${
                          done ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {t(`status.${step}`)}
                      </p>
                      {log && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDateTime(log.createdAt)}
                        </p>
                      )}
                      {log?.note && (
                        <p className="text-xs text-muted-foreground mt-0.5 italic">
                          {log.note}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Pickup info */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-4">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          {t("pickupInfo")}
        </h2>
        <div className="text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("pickupTime")}</span>
            <span className="font-medium">
              {formatDateTime(order.pickupTime)}
            </span>
          </div>
          {order.branch && (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("branch")}</span>
                <span className="font-medium">
                  {order.branch.name?.replace("Simba Supermarket ", "")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("address")}</span>
                <span className="font-medium text-right max-w-[60%]">
                  {order.branch.address}
                </span>
              </div>
              {order.branch.phone && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("phone")}</span>
                  <a
                    href={`tel:${order.branch.phone}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {order.branch.phone}
                  </a>
                </div>
              )}
            </>
          )}
          {order.notes && (
            <div className="mt-2 pt-2 border-t border-border">
              <span className="text-muted-foreground">{t("notes")}: </span>
              <span className="italic">{order.notes}</span>
            </div>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-4">
        <h2 className="font-semibold mb-4">
          {t("items")} ({order.items.length})
        </h2>
        <div className="space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex gap-3 items-center">
              <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-muted border border-border shrink-0">
                {item.image ? (
                  <Image
                    src={getImageUrl(item.image)}
                    alt={item.name}
                    fill
                    className="object-contain p-1"
                    sizes="56px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs font-bold">
                    {item.name[0]}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm line-clamp-1">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  x{item.quantity} · {formatPrice(item.price)} {t("each")}
                </p>
              </div>
              <span className="font-semibold text-sm shrink-0">
                {formatPrice(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="border-t border-border mt-4 pt-4 space-y-1.5 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>{t("subtotal")}</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>{t("deposit")}</span>
            <span>{formatPrice(order.depositAmount)}</span>
          </div>
          <div className="flex justify-between font-bold text-base pt-1">
            <span>{t("total")}</span>
            <span className="text-primary">{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
