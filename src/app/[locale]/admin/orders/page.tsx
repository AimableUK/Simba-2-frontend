"use client";
import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { Search, Filter, ChevronDown, Eye } from "lucide-react";
import { toast } from "sonner";
import { orderApi } from "@/lib/api";
import { formatPrice, formatDateTime } from "@/lib/utils";
import { TableRowSkeleton } from "@/components/common/skeletons";
import { Pagination } from "@/components/common/pagination";
import { useAdminSocket } from "@/hooks/useSocket";
import type { Order } from "@/types";

const STATUSES = [
  "",
  "pending",
  "accepted",
  "preparing",
  "ready",
  "picked_up",
  "cancelled",
];
const STATUS_COLORS: Record<string, string> = {
  pending: "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30",
  accepted: "text-blue-600 bg-blue-100 dark:bg-blue-900/30",
  preparing: "text-purple-600 bg-purple-100 dark:bg-purple-900/30",
  ready: "text-orange-600 bg-orange-100 dark:bg-orange-900/30",
  picked_up: "text-green-600 bg-green-100 dark:bg-green-900/30",
  cancelled: "text-red-600 bg-red-100 dark:bg-red-900/30",
};

export default function AdminOrdersPage() {
  const locale = useLocale();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [note, setNote] = useState("");

  useAdminSocket({
    onNewOrder: () => qc.invalidateQueries({ queryKey: ["admin-orders"] }),
    onOrderUpdated: () => qc.invalidateQueries({ queryKey: ["admin-orders"] }),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders", page, search, statusFilter],
    queryFn: () =>
      orderApi
        .adminList({ page, limit: 20, search, status: statusFilter })
        .then((r) => r.data),
  });

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      status,
      note,
    }: {
      id: string;
      status: string;
      note?: string;
    }) => orderApi.updateStatus(id, { status, note }),
    onSuccess: () => {
      toast.success("Order status updated");
      setSelectedOrder(null);
      setNote("");
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || "Failed to update status"),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Orders</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search order, customer..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">All Statuses</option>
          {STATUSES.filter(Boolean).map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ").replace(/^\w/, (c) => c.toUpperCase())}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {[
                  "Order #",
                  "Customer",
                  "Items",
                  "Total",
                  "Status",
                  "Payment",
                  "Date",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wide"
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
                : data?.data?.map((order: Order) => (
                    <tr
                      key={order.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono font-medium text-xs">
                        {order.orderNumber}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{order.user?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {order.user?.email}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {order.items?.length} items
                      </td>
                      <td className="px-4 py-3 font-semibold text-primary">
                        {formatPrice(order.total)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-medium px-2.5 py-1.5 rounded-full ${STATUS_COLORS[order.status]}`}
                        >
                          {order.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded-full ${
                            order.paymentStatus === "paid"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : order.paymentStatus === "failed"
                                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {formatDateTime(order.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setNewStatus(order.status);
                          }}
                          className="flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
                        >
                          <Eye className="h-3.5 w-3.5" />
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
        totalPages={data?.pagination?.totalPages || 1}
        onPageChange={setPage}
      />

      {/* Status Modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-bold text-lg mb-1">Update Order Status</h2>
            <p className="text-sm text-muted-foreground mb-6">
              {selectedOrder.orderNumber}
            </p>

            <div className="space-y-4">
              {/* Customer info */}
              <div className="bg-muted/50 rounded-xl p-4 text-sm space-y-1">
                <p>
                  <span className="text-muted-foreground">Customer:</span>{" "}
                  <span className="font-medium">
                    {selectedOrder.user?.name}
                  </span>
                </p>
                <p>
                  <span className="text-muted-foreground">Email:</span>{" "}
                  {selectedOrder.user?.email}
                </p>
                <p>
                  <span className="text-muted-foreground">Phone:</span>{" "}
                  {selectedOrder.user?.phone ||
                    (selectedOrder.deliveryAddress as any)?.phone}
                </p>
                <p>
                  <span className="text-muted-foreground">Total:</span>{" "}
                  <span className="font-bold text-primary">
                    {formatPrice(selectedOrder.total)}
                  </span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  New Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {STATUSES.filter(Boolean).map((s) => (
                    <option key={s} value={s}>
                      {s
                        .replace("_", " ")
                        .replace(/^\w/, (c) => c.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Note (optional)
                </label>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Out for delivery, driver: Jean"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() =>
                    statusMutation.mutate({
                      id: selectedOrder.id,
                      status: newStatus,
                      note,
                    })
                  }
                  disabled={
                    statusMutation.isPending ||
                    newStatus === selectedOrder.status
                  }
                  className="flex-1 bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {statusMutation.isPending ? "Updating..." : "Update Status"}
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-5 py-3 border border-border rounded-xl hover:bg-muted transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
