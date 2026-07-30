"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { productApi, branchApi } from "@/lib/api";
import { formatPrice, getImageUrl } from "@/lib/utils";
import { TableRowSkeleton } from "@/components/common/skeletons";
import { Pagination } from "@/components/common/pagination";
import Image from "next/image";
import { useSession } from "@/lib/auth-client";

export default function BranchProductsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role as string;
  const resolvedLocale = locale || pathname.split("/")[1] || "en";

  useEffect(() => {
    if (role !== "branch_manager") {
      router.replace(`/${resolvedLocale}/branch-dashboard`);
    }
  }, [role, resolvedLocale, router]);

  const t = useTranslations("branchDashboard");
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data: dashData } = useQuery({
    queryKey: ["branch-dashboard"],
    queryFn: () => branchApi.dashboard().then((r) => r.data),
  });

  const branchId = dashData?.branch?.id;

  const { data, isLoading } = useQuery({
    queryKey: ["branch-products", branchId, page, search],
    queryFn: () =>
      productApi.adminList({
        page,
        limit: 20,
        search: search || undefined,
        branchId,
      }).then((r) => r.data),
    enabled: !!branchId,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("products", { default: "Products" })}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {dashData?.branch?.name
            ? `${t("productsForBranch", { default: "Products for" })} ${dashData.branch.name}`
            : t("loading", { default: "Loading..." })}
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder={t("searchPlaceholder", { default: "Search products..." })}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {[
                  t("image", { default: "Image" }),
                  t("cols.name", { default: "Product" }),
                  t("category", { default: "Category" }),
                  t("cols.price", { default: "Price" }),
                  t("stock", { default: "Stock" }),
                  t("status", { default: "Status" }),
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
                    <TableRowSkeleton key={i} cols={6} />
                  ))
                : data?.data?.map((product: any) => (
                    <tr
                      key={product.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="w-10 h-10 rounded-lg border border-border bg-muted overflow-hidden">
                          {product.images?.[0] ? (
                            <Image
                              src={getImageUrl(product.images[0])}
                              alt={product.name}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                              {product.name?.[0]?.toUpperCase() || "?"}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{product.name}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {product.category?.name || "-"}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {formatPrice(product.price)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded-full ${
                            product.branchStock?.stock && product.branchStock.stock > 0
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          }`}
                        >
                          {product.branchStock?.stock ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded-full ${
                            product.branchStock?.isActive !== false
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {product.branchStock?.isActive !== false
                            ? t("active", { default: "Active" })
                            : t("inactive", { default: "Inactive" })}
                        </span>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      {data?.pagination && (
        <Pagination
          page={page}
          totalPages={data.pagination.totalPages || 1}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
