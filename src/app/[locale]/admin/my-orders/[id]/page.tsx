"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  CheckCircle,
  Circle,
  Package,
  Truck,
  Home,
  Clock,
  MapPin,
} from "lucide-react";
import { orderApi } from "@/lib/api";
import { useOrderSocket } from "@/hooks/useSocket";
import {
  formatPrice,
  formatDateTime,
  getImageUrl,
  ORDER_STATUS_STEPS,
} from "@/lib/utils";
import { Skeleton } from "@/components/common/skeletons";
import { useCallback } from "react";
import type { Order } from "@/types";

const STATUS_ICONS = {
  pending: Clock,
  confirmed: CheckCircle,
  packaged: Package,
  on_the_way: Truck,
  delivered: Home,
};

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
      qc.invalidateQueries({ queryKey: ["order", id] });
    },
    [id, qc],
  );

  useOrderSocket(id as string, handleOrderUpdate);

  if (isLoading)
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );

  if (!order)
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">Order not found</p>
        <Link
          href={`/${locale}/admin/my-orders`}
          className="mt-4 inline-block text-primary hover:underline"
        >
          ← {t("title")}
        </Link>
      </div>
    );

  const currentStep = ORDER_STATUS_STEPS.indexOf(order.status as any);
  const addr = order.deliveryAddress as any;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/${locale}/admin/my-orders`}
          className="text-muted-foreground hover:text-primary transition-colors text-sm"
        >
          ← {t("title")}
        </Link>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">
            {t("orderNumber")}
            {order.orderNumber}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {formatDateTime(order.createdAt)}
          </p>
        </div>
        <div className="text-right">
          <p className="font-bold text-xl text-primary">
            {formatPrice(order.total)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 capitalize">
            {order.paymentStatus}
          </p>
        </div>
      </div>

      {/* Order Timeline */}
      {order.status !== "cancelled" && (
        <div className="bg-card border border-border rounded-2xl p-6 mb-4">
          <h2 className="font-semibold mb-6">{t("timeline")}</h2>
          <div className="relative">
            {/* Progress line */}
            <div className="absolute left-[18px] top-5 bottom-5 w-0.5 bg-border" />
            <div
              className="absolute left-[18px] top-5 w-0.5 bg-primary transition-all duration-700"
              style={{
                height: `${Math.min(100, (currentStep / (ORDER_STATUS_STEPS.length - 1)) * 100)}%`,
              }}
            />

            <div className="space-y-6">
              {ORDER_STATUS_STEPS.map((step, idx) => {
                const Icon = STATUS_ICONS[step as keyof typeof STATUS_ICONS];
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
                        className={`font-medium text-sm ${done ? "text-foreground" : "text-muted-foreground"}`}
                      >
                        {t(`status.${step}`)}
                      </p>
                      {log && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDateTime(log.createdAt)}
                        </p>
                      )}
                      {log?.note && (
                        <p className="text-xs text-muted-foreground mt-0.5">
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

      {/* Items */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-4">
        <h2 className="font-semibold mb-4">Items ({order.items.length})</h2>
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
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                    {item.name[0]}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm line-clamp-1">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  x{item.quantity} · {formatPrice(item.price)} each
                </p>
              </div>
              <span className="font-semibold text-sm shrink-0">
                {formatPrice(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>
        <div className="border-t border-border mt-4 pt-4 space-y-1.5 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Delivery</span>
            <span>{formatPrice(order.deliveryFee)}</span>
          </div>
          <div className="flex justify-between font-bold text-base pt-1">
            <span>Total</span>
            <span className="text-primary">{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Delivery Address */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          {t("deliveryAddress")}
        </h2>
        <div className="text-sm text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">{addr?.fullName}</p>
          <p>{addr?.phone}</p>
          <p>{addr?.street}</p>
          <p>
            {addr?.district}
            {addr?.sector ? `, ${addr.sector}` : ""}
          </p>
          {addr?.notes && <p className="italic">Note: {addr.notes}</p>}
        </div>
      </div>
    </div>
  );
}
