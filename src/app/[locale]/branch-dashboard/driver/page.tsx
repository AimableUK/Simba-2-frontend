"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import { branchApi } from "@/lib/api";
import Image from "next/image";
import { formatPrice, formatDateTime, getImageUrl } from "@/lib/utils";
import { toast } from "sonner";
import { Pagination } from "@/components/common/pagination";
import { TableRowSkeleton } from "@/components/common/skeletons";
import { useAdminSocket } from "@/hooks/useSocket";
import { User, Clock, Package, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  accepted: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  preparing: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  ready: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  picked_up: "bg-muted text-muted-foreground",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export default function DriverDashboardPage() {
  const t = useTranslations("branchDashboard");
  const { data: session } = useSession();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<any>(null);

  const role = (session?.user as any)?.role as string;

  useAdminSocket({
    onOrderUpdated: () =>
      qc.invalidateQueries({ queryKey: ["driver-dashboard"] }),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["driver-dashboard", page, statusFilter],
    queryFn: () =>
      branchApi
        .driverDashboard({ page, limit: 15, status: statusFilter || undefined })
        .then((r) => r.data),
    refetchInterval: 10_000,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      branchApi.updateStatus(id, { status }),
    onSuccess: () => {
      toast.success(t("orderUpdated"));
      setSelected(null);
      qc.invalidateQueries({ queryKey: ["driver-dashboard"] });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || t("failed")),
  });

  const STATUSES = ["", "pending", "accepted", "preparing", "ready", "picked_up", "cancelled"];
  const STATUS_LABELS: Record<string, string> = {
    "": t("all"),
    pending: t("pending"),
    accepted: t("accepted"),
    preparing: t("preparing"),
    ready: t("ready"),
    picked_up: t("pickedUp"),
    cancelled: t("cancelled"),
  };

  const getDeliveryLabel = (order: any) => {
    if (order.fulfillmentType === "delivery") {
      const address = [order.deliveryStreet, order.deliveryDistrict, order.deliverySector]
        .filter(Boolean)
        .join(", ");
      const coords =
        order.deliveryLatitude !== null &&
        order.deliveryLatitude !== undefined &&
        order.deliveryLongitude !== null &&
        order.deliveryLongitude !== undefined
          ? `${order.deliveryLatitude}, ${order.deliveryLongitude}`
          : "";
      return coords && address
        ? `${t("delivery")}: ${address} | ${t("location")}: ${coords}`
        : coords
          ? `${t("location")}: ${coords}`
          : `${t("delivery")}: ${address || "-"}`;
    }

    return `${t("pickup")}: ${new Date(order.pickupTime).toLocaleString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("assignedOrders")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("ordersForYourBranch")}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatusFilter(s);
              setPage(1);
            }}
            className={`rounded-xl border px-4 py-2 text-sm font-medium capitalize transition-colors ${
              statusFilter === s
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:bg-muted"
            }`}
          >
            {STATUS_LABELS[s] || s.replace("_", " ")}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {[
                  t("cols.order"),
                  t("cols.customer"),
                  t("cols.items"),
                  t("cols.total"),
                  t("cols.pickupTime"),
                  t("cols.status"),
                  t("cols.assignedTo"),
                  t("cols.actions"),
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <TableRowSkeleton key={i} cols={8} />
                  ))
                : data?.orders?.data?.map((order: any) => (
                    <tr
                      key={order.id}
                      className="border-b border-border last:border-0 transition-colors hover:bg-muted/30"
                    >
                      <td className="px-4 py-3 font-mono text-xs font-semibold">
                        {order.orderNumber}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{order.user?.name}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground sm:text-xs">
                          {order.user?.phone}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {order.items?.length}
                      </td>
                      <td className="px-4 py-3 font-semibold text-primary">
                        {formatPrice(order.total)}
                      </td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap text-muted-foreground">
                        {getDeliveryLabel(order)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[order.status]}`}
                        >
                          {STATUS_LABELS[order.status] || order.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {order.branch?.name || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelected(order)}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          {t("manage")}
                        </button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        page={page}
        totalPages={data?.orders?.pagination?.totalPages || 1}
        onPageChange={setPage}
      />

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="flex max-h-[calc(100vh-1rem)] w-[calc(100vw-0.5rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-2xl sm:max-w-2xl sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 shrink-0">
              <h2 className="mb-1 text-lg font-bold">
                {t("orderTitle", { number: selected.orderNumber })}
              </h2>
              <p className="text-sm text-muted-foreground">
                {formatDateTime(selected.createdAt)}
              </p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              <div className="mb-4 rounded-xl bg-muted/40 p-3 text-sm space-y-1">
                <p className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium">{selected.user?.name}</span>
                </p>
                <p className="pl-5 text-muted-foreground">
                  {selected.user?.phone} - {selected.user?.email}
                </p>
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {getDeliveryLabel(selected)}
                </p>
                {selected.fulfillmentType === "delivery" &&
                  [selected.deliveryStreet, selected.deliveryDistrict, selected.deliverySector]
                    .filter(Boolean)
                    .join(", ") && (
                    <p className="pl-5 text-xs text-muted-foreground">
                      {t("address")}: {[selected.deliveryStreet, selected.deliveryDistrict, selected.deliverySector]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  )}
                {selected.fulfillmentType === "delivery" &&
                  selected.deliveryLatitude !== null &&
                  selected.deliveryLatitude !== undefined &&
                  selected.deliveryLongitude !== null &&
                  selected.deliveryLongitude !== undefined && (
                    <p className="pl-5 text-xs text-muted-foreground">
                      {t("coordinates")}: {selected.deliveryLatitude}, {selected.deliveryLongitude}
                      <button
                        type="button"
                        onClick={() =>
                          window.open(
                            `https://www.openstreetmap.org/?mlat=${selected.deliveryLatitude}&mlon=${selected.deliveryLongitude}#map=18/${selected.deliveryLatitude}/${selected.deliveryLongitude}`,
                            "_blank",
                            "noopener,noreferrer",
                          )
                        }
                        className="ml-2 inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary transition-colors hover:bg-primary/20"
                      >
                        <MapPin className="h-3 w-3" />
                        {t("openMap")}
                      </button>
                    </p>
                  )}
              </div>

              <div className="mb-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("items")}
                </p>
                <div className="grid max-h-[42vh] grid-cols-2 gap-2 overflow-y-auto pr-1 sm:gap-3">
                  {selected.items?.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex min-w-0 flex-col gap-2 rounded-xl border border-border bg-background p-2.5 sm:p-3"
                    >
                      <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-border bg-muted">
                        {item.image ? (
                          <Image
                            src={getImageUrl(item.image)}
                            alt={item.name}
                            fill
                            className="object-contain p-1"
                            sizes="(max-width: 640px) 50vw, 120px"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs font-bold text-muted-foreground">
                            {item.name?.[0] || "?"}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-xs font-medium leading-snug sm:text-sm">
                          {item.name}
                        </p>
                        <p className="mt-1 text-[11px] text-muted-foreground sm:text-xs">
                          x{item.quantity} - {formatPrice(item.price)} each
                        </p>
                      </div>
                      <span className="shrink-0 text-xs font-semibold sm:text-sm">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex justify-between border-t border-border pt-2 text-sm font-bold">
                  <span>{t("total")}</span>
                  <span className="text-primary">{formatPrice(selected.total)}</span>
                </div>
              </div>

              {selected.status === "ready" &&
                selected.fulfillmentType === "delivery" &&
                !selected.deliveryConfirmed && (
                  <div className="mb-4 rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-sm dark:border-yellow-800 dark:bg-yellow-900/20">
                    <p className="font-medium">{t("waitingForCustomerConfirmation")}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("confirmDeliveryDesc")}
                    </p>
                  </div>
                )}

              {selected.fulfillmentType === "delivery" &&
                selected.deliveryConfirmed && (
                  <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm dark:border-green-800 dark:bg-green-900/20">
                    <p className="font-medium text-green-800 dark:text-green-300">
                      ✓ {t("customerConfirmedDelivery") || "Customer confirmed receipt"}
                    </p>
                  </div>
                )}
            </div>

            <div className="mt-4 space-y-2">
              {selected.status === "ready" &&
                selected.fulfillmentType === "delivery" &&
                selected.deliveryConfirmed &&
                selected.status !== "picked_up" && (
                  <button
                    onClick={() =>
                      statusMutation.mutate({
                        id: selected.id,
                        status: "picked_up",
                      })
                    }
                    disabled={statusMutation.isPending}
                    className="w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                  >
                    {statusMutation.isPending
                      ? t("updating")
                      : t("markPickedUp")}
                  </button>
                )}

              <button
                onClick={() => setSelected(null)}
                className="w-full rounded-xl border border-border py-2.5 text-sm font-medium transition-colors hover:bg-muted"
              >
                {t("close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
