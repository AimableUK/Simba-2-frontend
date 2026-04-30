"use client";

import { useState } from "react";
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
  const { data: session } = useSession();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<any>(null);

  const role = (session?.user as any)?.role as string;
  const isManager = ["branch_manager", "admin", "super_admin"].includes(role);

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

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      branchApi.updateStatus(id, { status }),
    onSuccess: () => {
      toast.success("Order updated");
      setSelected(null);
      qc.invalidateQueries({ queryKey: ["branch-dashboard-orders"] });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || "Failed"),
  });

  const assignMutation = useMutation({
    mutationFn: ({ id, staffId }: { id: string; staffId: string }) =>
      branchApi.assignOrder(id, staffId),
    onSuccess: () => {
      toast.success("Order assigned");
      setSelected(null);
      qc.invalidateQueries({ queryKey: ["branch-dashboard-orders"] });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || "Failed"),
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {branchName ? `Showing orders for ${branchName}` : "Showing orders for this branch"}
        </p>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatusFilter(s);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border capitalize ${
              statusFilter === s
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border hover:bg-muted"
            }`}
          >
            {s === "" ? "All" : s.replace("_", " ")}
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {[
                  "Order",
                  "Customer",
                  "Items",
                  "Total",
                  "Pick-up Time",
                  "Status",
                  "Assigned To",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide"
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
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono font-semibold text-xs">
                        {order.orderNumber}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{order.user?.name}</p>
                        <p className="text-[11px] sm:text-xs text-muted-foreground mt-1">
                          {order.user?.phone}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {order.items?.length}
                      </td>
                      <td className="px-4 py-3 font-semibold text-primary">
                        {formatPrice(order.total)}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
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
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[order.status]}`}
                        >
                          {order.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {order.assignedTo?.user?.name || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelected(order)}
                          className="text-xs text-primary hover:underline font-medium"
                        >
                          Manage
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

      {/* Order detail modal */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-card border border-border rounded-2xl p-4 sm:p-6 w-[calc(100vw-0.75rem)] sm:w-full sm:max-w-2xl shadow-2xl max-h-[92vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shrink-0 mb-4">
              <h2 className="font-bold text-lg mb-1">
                Order {selected.orderNumber}
              </h2>
              <p className="text-sm text-muted-foreground">
                {formatDateTime(selected.createdAt)}
              </p>
            </div>

            {/* Customer */}
            <div className="bg-muted/40 rounded-xl p-3 mb-4 text-sm space-y-1">
              <p className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-medium">{selected.user?.name}</span>
              </p>
              <p className="text-muted-foreground pl-5">
                {selected.user?.phone} - {selected.user?.email}
              </p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {selected.fulfillmentType === "delivery"
                  ? `Delivery: ${[selected.deliveryStreet, selected.deliveryDistrict, selected.deliverySector]
                      .filter(Boolean)
                      .join(", ")}`
                  : `Pick-up: ${new Date(selected.pickupTime).toLocaleString([], {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`}
              </p>
            </div>

            {/* Items */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Items
              </p>
              <div className="grid grid-cols-2 gap-2 sm:gap-3 max-h-[42vh] overflow-y-auto pr-1">
                {selected.items?.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-2 rounded-xl border border-border p-2.5 sm:p-3 bg-background min-w-0"
                  >
                    <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-muted border border-border shrink-0">
                      {item.image ? (
                        <Image
                          src={getImageUrl(item.image)}
                          alt={item.name}
                          fill
                          className="object-contain p-1"
                          sizes="(max-width: 640px) 50vw, 120px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs font-bold">
                          {item.name?.[0] || "?"}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs sm:text-sm line-clamp-2 leading-snug">
                        {item.name}
                      </p>
                      <p className="text-[11px] sm:text-xs text-muted-foreground mt-1">
                        x{item.quantity} - {formatPrice(item.price)} each
                      </p>
                    </div>
                    <span className="font-semibold text-xs sm:text-sm shrink-0">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-border mt-2 pt-2 flex justify-between font-bold text-sm">
                <span>Total</span>
                <span className="text-primary">
                  {formatPrice(selected.total)}
                </span>
              </div>
            </div>

            {selected.notes && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-3 mb-4 text-sm">
                <p className="font-medium mb-0.5">Note:</p>
                <p className="text-muted-foreground">{selected.notes}</p>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2">
              {/* Manager: assign to self / start preparing */}
              {isManager && selected.status === "accepted" && (
                <button
                  onClick={() =>
                    statusMutation.mutate({
                      id: selected.id,
                      status: "preparing",
                    })
                  }
                  disabled={statusMutation.isPending}
                  className="w-full bg-purple-600 text-white font-semibold py-3 rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Package className="h-4 w-4" /> Start Preparing
                </button>
              )}

              {/* Progress button based on current status */}
              {NEXT_STATUS[selected.status] && (
                <button
                  onClick={() =>
                    statusMutation.mutate({
                      id: selected.id,
                      status: NEXT_STATUS[selected.status],
                    })
                  }
                  disabled={statusMutation.isPending}
                  className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {statusMutation.isPending
                    ? "Updating..."
                    : selected.status === "preparing"
                      ? "✅ Mark as Ready"
                      : selected.status === "ready"
                        ? "🎉 Mark as Picked Up"
                        : "Next Step"}
                </button>
              )}

              {/* Cancel (only pending/accepted) */}
              {["pending", "accepted"].includes(selected.status) && (
                <button
                  onClick={() =>
                    statusMutation.mutate({
                      id: selected.id,
                      status: "cancelled",
                    })
                  }
                  disabled={statusMutation.isPending}
                  className="w-full border border-destructive text-destructive font-medium py-2.5 rounded-xl hover:bg-destructive/5 disabled:opacity-50 transition-colors"
                >
                  Cancel Order
                </button>
              )}

              <button
                onClick={() => setSelected(null)}
                className="w-full border border-border py-2.5 rounded-xl hover:bg-muted transition-colors font-medium text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



