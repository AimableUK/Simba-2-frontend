"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { branchApi } from "@/lib/api";
import { formatPrice, getImageUrl } from "@/lib/utils";
import { toast } from "sonner";
import Image from "next/image";
import { Pagination } from "@/components/common/pagination";
import { Skeleton } from "@/components/common/skeletons";
import { Search, AlertTriangle } from "lucide-react";

export default function BranchStockPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<{
    productId: string;
    stock: number;
  } | null>(null);
  const [newStock, setNewStock] = useState("");

  const { data: dashData } = useQuery({
    queryKey: ["branch-dashboard"],
    queryFn: () => branchApi.dashboard().then((r) => r.data),
  });

  const branchId = dashData?.branch?.id;

  const { data, isLoading } = useQuery({
    queryKey: ["branch-stock-admin", branchId, page, search],
    queryFn: () =>
      branchApi.stock(branchId!, { page, limit: 20 }).then((r) => r.data),
    enabled: !!branchId,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: {
      productId: string;
      stock?: number;
      isActive?: boolean;
    }) => branchApi.updateStock(payload),
    onSuccess: () => {
      toast.success("Stock updated");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["branch-stock-admin"] });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || "Failed"),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Stock Management</h1>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search products..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {[
                  "Product",
                  "Category",
                  "Price",
                  "Branch Stock",
                  "Status",
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
                ? Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <Skeleton className="h-4 w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                : data?.data?.map((item: any) => (
                    <tr
                      key={item.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0">
                            <Image
                              src={getImageUrl(item.product.images?.[0])}
                              alt={item.product.name}
                              fill
                              className="object-contain p-0.5"
                              sizes="40px"
                            />
                          </div>
                          <p className="font-medium text-sm truncate max-w-[160px]">
                            {item.product.name}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {item.product.category?.name}
                      </td>
                      <td className="px-4 py-3 font-semibold text-primary">
                        {formatPrice(item.product.price)}
                      </td>
                      <td className="px-4 py-3">
                        {editing?.productId === item.productId ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={newStock}
                              onChange={(e) => setNewStock(e.target.value)}
                              className="w-20 px-2 py-1 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                              min="0"
                            />
                            <button
                              onClick={() =>
                                updateMutation.mutate({
                                  productId: item.productId,
                                  stock: parseInt(newStock) || 0,
                                })
                              }
                              disabled={updateMutation.isPending}
                              className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:bg-primary/90 disabled:opacity-50"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditing(null)}
                              className="text-xs border border-border px-3 py-1.5 rounded-lg hover:bg-muted"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <span
                            className={`font-semibold ${item.stock === 0 ? "text-destructive" : item.stock <= 10 ? "text-yellow-600 dark:text-yellow-400" : "text-foreground"}`}
                          >
                            {item.stock}
                            {item.stock <= 10 && item.stock > 0 && (
                              <AlertTriangle className="h-3.5 w-3.5 inline ml-1 text-yellow-500" />
                            )}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-medium px-2.5 py-1 rounded-full ${item.isActive ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-muted text-muted-foreground"}`}
                        >
                          {item.isActive ? "Active" : "Hidden"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditing({
                                productId: item.productId,
                                stock: item.stock,
                              });
                              setNewStock(String(item.stock));
                            }}
                            className="text-xs text-primary hover:underline font-medium"
                          >
                            Update
                          </button>
                          <button
                            onClick={() =>
                              updateMutation.mutate({
                                productId: item.productId,
                                isActive: !item.isActive,
                              })
                            }
                            className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                          >
                            {item.isActive ? "Hide" : "Show"}
                          </button>
                        </div>
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
    </div>
  );
}
