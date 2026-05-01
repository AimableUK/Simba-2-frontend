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
import { User, Clock, Package } from "lucide-react";
import { useTranslations } from "next-intl";

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

const NEXT_STATUS: Record<string, string> = {
  accepted: "preparing",
  preparing: "ready",
  ready: "picked_up",
};

export default function BranchOrdersPage() {
  const t = useTranslations("branchDashboard");
  const { data: session } = useSession();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [selectedStaffId, setSelectedStaffId] = useState("");

  const role = (session?.user as any)?.role as string;
  const isManager = ["branch_manager", "admin", "super_admin"].includes(role);
  const isStaff = role === "branch_staff";

  useAdminSocket({
    onNewOrder: () =>
      qc.invalidateQueries({ queryKey: ["branch-dashboard-orders"] }),
    onOrderUpdated: () =>
      qc.invalidateQueries({ queryKey: ["branch-dashboard-orders"] }),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["branch-dashboard-orders", page, statusFilter],
    queryFn: () =>
      branchApi
        .dashboard({ page, limit: 15, status: statusFilter || undefined })
        .then((r) => r.data),
    refetchInterval: 10_000,
  });
  const branchName = data?.branch?.name;
  const branchStaff = data?.branch?.staff || [];

  useEffect(() => {
    if (!selected) return;
    setSelectedStaffId(
      selected.assignedTo?.id ||
        branchStaff.find((staff: any) => staff.user?.id === session?.user?.id)
          ?.id ||
        branchStaff[0]?.id ||
        "",
    );
  }, [selected, branchStaff, session?.user?.id]);

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      branchApi.updateStatus(id, { status }),
    onSuccess: () => {
      toast.success(t("orderUpdated"));
      setSelected(null);
      qc.invalidateQueries({ queryKey: ["branch-dashboard-orders"] });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || t("failed")),
  });

  const assignMutation = useMutation({
    mutationFn: ({ id, staffId }: { id: string; staffId: string }) =>
      branchApi.assignOrder(id, staffId),
    onSuccess: () => {
      toast.success(t("orderAssigned"));
      setSelected(null);
      qc.invalidateQueries({ queryKey: ["branch-dashboard-orders"] });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || t("failed")),
  });

  const STATUSES = [
    "",
    "pending",
    "accepted",
    "preparing",
    "ready",
    "picked_up",
    "cancelled",
  ];
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
      return `${t("delivery")}: ${[order.deliveryStreet, order.deliveryDistrict, order.deliverySector]
        .filter(Boolean)
        .join(", ")}`;
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
        <h1 className="text-2xl font-bold">
          {isStaff ? t("assignedOrders") : t("orders")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {branchName
            ? t("ordersForBranch", { branch: branchName })
            : t("ordersForYourBranch")}
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
                        {order.assignedTo?.user?.name || "-"}
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="flex max-h-[92vh] w-[calc(100vw-0.75rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-2xl sm:max-w-2xl sm:p-6"
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

            {selected.notes && (
              <div className="mb-4 rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-sm dark:border-yellow-800 dark:bg-yellow-900/20">
                <p className="mb-0.5 font-medium">{t("note")}:</p>
                <p className="text-muted-foreground">{selected.notes}</p>
              </div>
            )}

            <div className="space-y-2">
              {isManager && !["picked_up", "cancelled"].includes(selected.status) && (
                <div className="space-y-2 rounded-xl border border-border bg-muted/20 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{t("assignStaff")}</p>
                      <p className="text-xs text-muted-foreground">
                        {selected.assignedTo?.user?.name
                          ? t("currentAssignee", {
                              name: selected.assignedTo.user.name,
                            })
                          : t("assignHint")}
                      </p>
                    </div>
                    <span className="rounded-full border border-border bg-background px-2 py-1 text-[11px] font-medium text-muted-foreground">
                      {t("availableStaff", { count: branchStaff.length })}
                    </span>
                  </div>

                  <select
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">{t("selectStaff")}</option>
                    {branchStaff.map((staff: any) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.user?.name} - {staff.role.replace("_", " ")} (
                        {staff.activeOrders || 0} {t("active")})
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() =>
                      selectedStaffId &&
                      assignMutation.mutate({
                        id: selected.id,
                        staffId: selectedStaffId,
                      })
                    }
                    disabled={assignMutation.isPending || !selectedStaffId}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 font-semibold text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
                  >
                    <Package className="h-4 w-4" />
                    {assignMutation.isPending
                      ? t("assigning")
                      : selected.assignedTo?.user?.name
                        ? t("reassignAndStart")
                        : t("assignAndStart")}
                  </button>
                </div>
              )}

              {NEXT_STATUS[selected.status] && (
                <button
                  onClick={() =>
                    statusMutation.mutate({
                      id: selected.id,
                      status: NEXT_STATUS[selected.status],
                    })
                  }
                  disabled={statusMutation.isPending}
                  className="w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {statusMutation.isPending
                    ? t("updating")
                    : selected.status === "preparing"
                      ? t("markReady")
                      : selected.status === "ready"
                        ? t("markPickedUp")
                        : t("nextStep")}
                </button>
              )}

              {["pending", "accepted"].includes(selected.status) && (
                <button
                  onClick={() =>
                    statusMutation.mutate({
                      id: selected.id,
                      status: "cancelled",
                    })
                  }
                  disabled={statusMutation.isPending}
                  className="w-full rounded-xl border border-destructive py-2.5 font-medium text-destructive transition-colors hover:bg-destructive/5 disabled:opacity-50"
                >
                  {t("cancelOrder")}
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
