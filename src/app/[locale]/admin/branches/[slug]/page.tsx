"use client";

import { use, useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import {
  ArrowLeft,
  Clock,
  MapPin,
  Phone,
  Users,
  Package,
  Search,
  AlertTriangle,
  Save,
} from "lucide-react";
import { branchApi } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import { formatPrice, getImageUrl } from "@/lib/utils";
import { Pagination } from "@/components/common/pagination";
import { Skeleton } from "@/components/common/skeletons";

export default function AdminBranchDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const qc = useQueryClient();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("admin.branchDetail");
  const { data: session } = useSession();
  const role = (session?.user as any)?.role as string;
  const canEditStock =
    role === "admin" || role === "super_admin" || role === "branch_manager";
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<{
    productId: string;
    stock: number;
  } | null>(null);
  const [newStock, setNewStock] = useState("");

  const { data: branch, isLoading: branchLoading } = useQuery({
    queryKey: ["admin-branch", resolvedParams.slug],
    queryFn: () => branchApi.get(resolvedParams.slug).then((r) => r.data),
  });
  const branchId = branch?.id;

  const { data: managerScope } = useQuery({
    queryKey: ["branch-manager-scope", role],
    queryFn: () => branchApi.dashboard().then((r) => r.data),
    enabled: role === "branch_manager",
  });

  useEffect(() => {
    if (
      role === "branch_manager" &&
      managerScope?.branch?.slug &&
      branch?.slug &&
      managerScope.branch.slug !== branch.slug
    ) {
      router.replace(`/${locale}/admin/branches/${managerScope.branch.slug}`);
    }
  }, [branch?.slug, locale, managerScope?.branch?.slug, role, router]);

  const { data: stockData, isLoading: stockLoading } = useQuery({
    queryKey: ["admin-branch-stock", branchId, page, search],
    queryFn: () =>
      branchApi.stock(branchId!, { page, limit: 20, search }).then((r) => r.data),
    enabled: !!branchId,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: {
      branchId: string;
      productId: string;
      stock?: number;
      isActive?: boolean;
    }) => branchApi.updateStock(payload),
    onSuccess: () => {
      toast.success(t("stockUpdated"));
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["admin-branch-stock"] });
      qc.invalidateQueries({ queryKey: ["admin-branch"] });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || "Failed"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => router.push(`/${locale}/admin/branches`)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backToBranches")}
        </button>
      </div>

      {branchLoading ? (
        <Skeleton className="h-40 rounded-2xl" />
      ) : (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-5 w-5 text-primary" />
                <h1 className="text-2xl font-bold">{branch?.name}</h1>
              </div>
              <p className="text-sm text-muted-foreground">{branch?.address}</p>
              <div className="flex flex-wrap gap-3 mt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {branch?.openTime} - {branch?.closeTime}
                </span>
                {branch?.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-4 w-4" />
                    {branch.phone}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  {(branch?.staff?.length || 0)} {t("staff")}
                </span>
                <span className="flex items-center gap-1.5">
                  <Package className="h-4 w-4" />
                  {(stockData?.pagination?.total || 0)} {t("products")}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                {branch?.district}
              </span>
              {!branch?.isActive && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                {t("inactive")}
                </span>
              )}
              <Link
                href={`/${locale}/admin/branches/${branch?.slug}/team`}
                className="text-xs p-3 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                {t("team")}
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(branch?.staff || []).map((member: any) => (
              <span
                key={member.id}
                className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  member.role === "branch_manager"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400"
                }`}
              >
                {member.user?.name} · {member.role.replace("_", " ")}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={t("searchPlaceholder")}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {[t("cols.product"), t("cols.category"), t("cols.price"), t("cols.stock"), t("cols.status"), t("cols.actions")].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {stockLoading || branchLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <Skeleton className="h-4 w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                : stockData?.data?.map((item: any) => (
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
                          <p className="font-medium text-sm truncate max-w-[180px]">
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
                                  branchId: branchId!,
                                  productId: item.productId,
                                  stock: parseInt(newStock) || 0,
                                })
                              }
                              disabled={updateMutation.isPending || !canEditStock}
                              className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:bg-primary/90 disabled:opacity-50"
                            >
                              {t("save")}
                            </button>
                            <button
                              onClick={() => setEditing(null)}
                              className="text-xs border border-border px-3 py-1.5 rounded-lg hover:bg-muted"
                            >
                              {t("cancel")}
                            </button>
                          </div>
                        ) : (
                          <span
                            className={`font-semibold ${
                              item.stock === 0
                                ? "text-destructive"
                                : item.stock <= 10
                                  ? "text-yellow-600 dark:text-yellow-400"
                                  : "text-foreground"
                            }`}
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
                          className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                            item.isActive
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {item.isActive ? t("active") : t("hidden")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {canEditStock && (
                            <>
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
                                {t("update")}
                              </button>
                              <button
                                onClick={() =>
                                updateMutation.mutate({
                                    branchId: branchId!,
                                    productId: item.productId,
                                    isActive: !item.isActive,
                                  })
                                }
                                className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                              >
                                {item.isActive ? t("hide") : t("show")}
                              </button>
                            </>
                          )}
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
        totalPages={stockData?.pagination?.totalPages || 1}
        onPageChange={setPage}
      />
    </div>
  );
}
