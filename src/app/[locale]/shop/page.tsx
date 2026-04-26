"use client";

import { useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { SlidersHorizontal, X, ChevronRight, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { productApi, categoryApi } from "@/lib/api";
import {
  ProductCard,
  ProductCardSkeleton,
} from "@/components/product/product-card";
import { cn } from "@/lib/utils";

const SORT_OPTIONS = [
  { value: "createdAt-desc", label: "Newest First" },
  { value: "salesCount-desc", label: "Most Popular" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating-desc", label: "Highest Rated" },
];

export default function ShopPage() {
  const t = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);

  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const sort = searchParams.get("sort") || "createdAt";
  const order = searchParams.get("order") || "desc";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const featured = searchParams.get("featured") || "";
  const inStock = searchParams.get("inStock") || "";

  const [localMin, setLocalMin] = useState(minPrice);
  const [localMax, setLocalMax] = useState(maxPrice);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryApi.list().then((r) => r.data),
  });

  const queryParams = {
    page,
    limit: 20,
    search,
    category,
    sort,
    order,
    featured: featured || undefined,
    inStock: inStock || undefined,
    minPrice: minPrice || undefined,
    maxPrice: maxPrice || undefined,
  };

  const { data, isLoading } = useQuery({
    queryKey: ["products", queryParams],
    queryFn: () => productApi.list(queryParams).then((r) => r.data),
  });

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    setPage(1);
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearFilters = () => {
    setLocalMin("");
    setLocalMax("");
    router.push(pathname);
    setPage(1);
  };

  const hasFilters =
    search || category || minPrice || maxPrice || featured || inStock;

  const currentSort = `${sort}-${order}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row sm:items-center justify-between mb-4">
        <div>
          <h1 className="text-lg md:text-2xl font-bold text-foreground">
            {search
              ? `Results for "${search}"`
              : category
                ? `${category.replace(/-/g, " ")}`
                : t("allProducts")}
          </h1>
          {data?.pagination && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {t("showing", {
                from: (page - 1) * 20 + 1,
                to: Math.min(page * 20, data.pagination.total),
                total: data.pagination.total,
              })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive border border-border rounded-full px-3 py-1.5 transition-colors"
            >
              <X className="w-3 h-3" /> Clear filters
            </button>
          )}
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="flex items-center gap-2 text-sm font-medium border border-border rounded-full px-4 py-2 hover:border-primary hover:text-primary transition-colors md:hidden"
          >
            <SlidersHorizontal className="w-4 h-4" /> Filters
          </button>
          {/* Sort */}
          <select
            value={currentSort}
            onChange={(e) => {
              const [s, o] = e.target.value.split("-");
              const params = new URLSearchParams(searchParams.toString());
              params.set("sort", s);
              params.set("order", o);
              router.push(`${pathname}?${params.toString()}`);
            }}
            className="text-sm border border-border rounded-full px-4 py-2 bg-card focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar filters - desktop */}
        <aside className="hidden md:block w-56 flex-shrink-0 space-y-5">
          {/* Categories */}
          <div className="bg-card border border-border rounded-2xl p-4">
            <h3 className="font-semibold text-sm mb-3">{t("filter")}</h3>
            <div className="space-y-1">
              <button
                onClick={() => updateParam("category", "")}
                className={cn(
                  "w-full text-left text-sm px-3 py-2 rounded-lg transition-colors",
                  !category
                    ? "bg-primary text-white font-medium"
                    : "hover:bg-accent text-foreground",
                )}
              >
                All Categories
              </button>
              {categories?.map((cat: any) => (
                <button
                  key={cat.id}
                  onClick={() => updateParam("category", cat.slug)}
                  className={cn(
                    "w-full text-left text-sm px-3 py-2 rounded-lg transition-colors",
                    category === cat.slug
                      ? "bg-primary text-white font-medium"
                      : "hover:bg-accent text-foreground",
                  )}
                >
                  {cat.name}
                  <span className="ml-auto float-right text-xs opacity-60">
                    {cat._count?.products || 0}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Price range */}
          <div className="bg-card border border-border rounded-2xl p-4">
            <h3 className="font-semibold text-sm mb-3">Price Range</h3>
            <div className="space-y-2">
              <input
                type="number"
                placeholder="Min (RWF)"
                value={localMin}
                onChange={(e) => setLocalMin(e.target.value)}
                className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="number"
                placeholder="Max (RWF)"
                value={localMax}
                onChange={(e) => setLocalMax(e.target.value)}
                className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                onClick={() => {
                  updateParam("minPrice", localMin);
                  updateParam("maxPrice", localMax);
                }}
                className="w-full py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 transition-colors"
              >
                Apply
              </button>
            </div>
          </div>

          {/* Quick filters */}
          <div className="bg-card border border-border rounded-2xl p-4">
            <h3 className="font-semibold text-sm mb-3">Quick Filters</h3>
            <div className="space-y-2">
              {[
                { label: "Featured", key: "featured", value: "true" },
                { label: "In Stock", key: "inStock", value: "true" },
              ].map((f) => (
                <label
                  key={f.key}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={searchParams.get(f.key) === f.value}
                    onChange={(e) =>
                      updateParam(f.key, e.target.checked ? f.value : "")
                    }
                    className="rounded border-border accent-primary"
                  />
                  <span className="text-sm">{f.label}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Mobile filters */}
        <AnimatePresence>
          {filtersOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden fixed inset-0 z-50 bg-card overflow-y-auto"
            >
              <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card">
                <h2 className="font-semibold">Filters</h2>
                <button onClick={() => setFiltersOpen(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <h3 className="font-medium mb-2 text-sm">Categories</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {categories?.map((cat: any) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          updateParam("category", cat.slug);
                          setFiltersOpen(false);
                        }}
                        className={cn(
                          "text-sm px-3 py-2 rounded-xl border transition-colors",
                          category === cat.slug
                            ? "bg-primary text-white border-primary"
                            : "border-border hover:border-primary",
                        )}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => setFiltersOpen(false)}
                  className="w-full py-3 bg-primary text-white rounded-full font-medium"
                >
                  Apply
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Products grid */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {Array.from({ length: 20 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : data?.data?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="font-semibold text-lg text-foreground">
                {t("noResults")}
              </h3>
              <p className="text-muted-foreground text-sm mt-1">
                Try different search terms or filters
              </p>
              <button
                onClick={clearFilters}
                className="mt-4 px-6 py-2.5 bg-primary text-white rounded-full text-sm font-medium"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {data?.data?.map((p: any) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>

              {/* Pagination */}
              {data?.pagination && data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="flex flex-row whitespace-nowrap px-4 py-2 border border-border rounded-full text-sm disabled:opacity-40 hover:border-primary transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <div className="flex gap-1">
                    {Array.from(
                      { length: Math.min(5, data.pagination.totalPages) },
                      (_, i) => {
                        const p =
                          Math.max(
                            1,
                            Math.min(data.pagination.totalPages - 4, page - 2),
                          ) + i;
                        return (
                          <button
                            key={p}
                            onClick={() => {
                              setPage(p);
                              window.scrollTo({
                                top: 0,
                                behavior: "auto",
                              });
                            }}
                            className={cn(
                              "w-9 h-9 rounded-full text-sm font-medium transition-colors",
                              p === page
                                ? "bg-primary text-white"
                                : "border border-border hover:border-primary",
                            )}
                          >
                            {p}
                          </button>
                        );
                      },
                    )}
                  </div>
                  <button
                    onClick={() =>
                      setPage((p) =>
                        Math.min(data.pagination.totalPages, p + 1),
                      )
                    }
                    disabled={page === data.pagination.totalPages}
                    className="flex flex-row whitespace-nowrap px-4 py-2 border border-border rounded-full text-sm disabled:opacity-40 hover:border-primary transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
