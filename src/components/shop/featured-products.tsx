"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { productApi, categoryApi } from "@/lib/api";
import {
  ProductCard,
  ProductCardSkeleton,
} from "@/components/product/product-card";
import { cn, getImageUrl } from "@/lib/utils";
import Image from "next/image";

function SectionHeader({
  title,
  desc,
  href,
}: {
  title: string;
  desc?: string;
  href: string;
}) {
  const t = useTranslations("home");
  return (
    <div className="flex items-end justify-between mb-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">
          {title}
        </h2>
        {desc && <p className="text-sm text-muted-foreground mt-1">{desc}</p>}
      </div>
      <Link
        href={href}
        className="flex items-center gap-1 text-sm font-medium text-primary hover:gap-2 transition-all"
      >
        {t("viewAll")} <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

//  Featured Products

export function FeaturedProducts() {
  const t = useTranslations("home");
  const locale = useLocale();

  const { data: products, isLoading } = useQuery({
    queryKey: ["featured-products"],
    queryFn: () => productApi.featured().then((r) => r.data),
  });

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <SectionHeader
        title={t("featured")}
        desc={t("featuredDesc")}
        href={`/${locale}/shop?featured=true`}
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
        {isLoading
          ? Array.from({ length: 10 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))
          : products?.map((p: any) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}

//  Top Products

export function TopProducts() {
  const t = useTranslations("home");
  const locale = useLocale();

  const { data: products, isLoading } = useQuery({
    queryKey: ["top-products"],
    queryFn: () => productApi.top().then((r) => r.data),
  });

  return (
    <section className="bg-muted/50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <SectionHeader
          title={t("topProducts")}
          desc={t("topProductsDesc")}
          href={`/${locale}/shop?sort=salesCount`}
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {isLoading
            ? Array.from({ length: 10 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))
            : products?.map((p: any) => <ProductCard key={p.id} product={p} />)}
        </div>
      </div>
    </section>
  );
}

//  Recommended Products

export function RecommendedProducts() {
  const t = useTranslations("home");
  const locale = useLocale();

  const { data: products, isLoading } = useQuery({
    queryKey: ["recommended-products"],
    queryFn: () => productApi.recommendations().then((r) => r.data),
  });

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <SectionHeader
        title={t("recommended")}
        desc={t("recommendedDesc")}
        href={`/${locale}/shop`}
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
        {isLoading
          ? Array.from({ length: 10 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))
          : products?.map((p: any) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}

//  Category Grid

export function CategoryGrid() {
  const t = useTranslations("home");
  const locale = useLocale();

  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryApi.list().then((r) => r.data),
    staleTime: 1000 * 60 * 10,
  });

  const COLORS = [
    "from-orange-500/20 to-orange-100/20",
    "from-blue-500/20 to-blue-100/20",
    "from-green-500/20 to-green-100/20",
    "from-purple-500/20 to-purple-100/20",
    "from-red-500/20 to-red-100/20",
    "from-yellow-500/20 to-yellow-100/20",
    "from-pink-500/20 to-pink-100/20",
    "from-teal-500/20 to-teal-100/20",
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <SectionHeader
        title={t("categories")}
        desc={t("categoriesDesc")}
        href={`/${locale}/shop`}
      />
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square skeleton rounded-2xl" />
            ))
          : categories?.slice(0, 8).map((cat: any, i: number) => (
              <Link
                key={cat.id}
                href={`/${locale}/shop?category=${cat.slug}`}
                className={cn(
                  "group aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 p-3 text-center hover:border-primary border border-border transition-all bg-card hover:shadow-md",
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center text-xl",
                    `bg-gradient-to-br ${COLORS[i % COLORS.length]}`,
                  )}
                >
                  {cat.image ? (
                    <Image
                      src={getImageUrl(cat.image)}
                      alt={cat.name}
                      width={32}
                      height={32}
                      className="object-cover rounded-lg"
                    />
                  ) : (
                    <span>🛒</span>
                  )}
                </div>
                <span className="text-[10px] sm:text-xs font-medium text-foreground group-hover:text-primary transition-colors leading-tight line-clamp-2">
                  {cat.name}
                </span>
              </Link>
            ))}
      </div>
    </section>
  );
}
