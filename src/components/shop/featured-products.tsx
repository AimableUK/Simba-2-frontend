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

const CATEGORY_IMAGES: Record<string, string> = {
  // "Food & Groceries" — brown paper bag with vegetables
  food: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80&fit=crop",
  groceries:
    "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80&fit=crop",

  // "Beverages" — two glasses with red liquid
  beverage:
    "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&q=80&fit=crop",
  drink:
    "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&q=80&fit=crop",
  juice:
    "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&q=80&fit=crop",

  // "Alcoholic Drinks" — bottles of liquor
  alcohol:
    "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400&q=80&fit=crop",
  wine: "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400&q=80&fit=crop",
  beer: "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400&q=80&fit=crop",
  spirit:
    "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400&q=80&fit=crop",
  liquor:
    "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400&q=80&fit=crop",

  // "Household" — dining room
  household:
    "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=400&q=80&fit=crop",
  house:
    "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=400&q=80&fit=crop",
  home: "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=400&q=80&fit=crop",
  cleaning:
    "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=400&q=80&fit=crop",

  // "Personal Care" — hand brushes
  personal:
    "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&q=80&fit=crop",
  care: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&q=80&fit=crop",
  hygiene:
    "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&q=80&fit=crop",
  beauty:
    "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&q=80&fit=crop",

  // "Toys & Games" — small toy with red hat
  toy: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80&fit=crop",
  game: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80&fit=crop",
  kid: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80&fit=crop",
  children:
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80&fit=crop",

  // "Electronics" — Sony headphones
  electronic:
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80&fit=crop",
  tech: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80&fit=crop",
  gadget:
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80&fit=crop",
  phone:
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80&fit=crop",

  // "Fresh Produce" — colourful chili peppers
  fresh:
    "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&q=80&fit=crop",
  produce:
    "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&q=80&fit=crop",
  vegetable:
    "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&q=80&fit=crop",
  fruit:
    "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&q=80&fit=crop",
};

function getCategoryImage(name: string): string | null {
  const lower = name.toLowerCase();
  const match = Object.keys(CATEGORY_IMAGES).find((kw) => lower.includes(kw));
  return match ? CATEGORY_IMAGES[match] : null;
}

// Fallback gradients when no keyword matches
const FALLBACK_GRADIENTS = [
  "from-orange-500 to-amber-400",
  "from-blue-500 to-cyan-400",
  "from-emerald-500 to-green-400",
  "from-violet-500 to-purple-400",
  "from-rose-500 to-pink-400",
  "from-yellow-500 to-lime-400",
  "from-fuchsia-500 to-pink-400",
  "from-teal-500 to-cyan-400",
];

export function CategoryGrid() {
  const t = useTranslations("home");
  const locale = useLocale();

  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryApi.list().then((r) => r.data),
    staleTime: 1000 * 60 * 10,
  });

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
          : categories?.slice(0, 8).map((cat: any, i: number) => {
              // Priority: DB image → keyword match → gradient fallback
              const imageUrl = cat.image
                ? getImageUrl(cat.image)
                : getCategoryImage(cat.name);

              return (
                <Link
                  key={cat.id}
                  href={`/${locale}/shop?category=${cat.slug}`}
                  className="group relative aspect-square rounded-2xl overflow-hidden border border-border hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10"
                >
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={cat.name}
                      fill
                      sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 12.5vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      unoptimized
                    />
                  ) : (
                    <div
                      className={cn(
                        "absolute inset-0 bg-gradient-to-br",
                        FALLBACK_GRADIENTS[i % FALLBACK_GRADIENTS.length],
                      )}
                    />
                  )}

                  {/* Persistent dark overlay for readability */}
                  <div className="absolute inset-0 bg-black/45 transition-opacity duration-300 group-hover:bg-black/30" />

                  {/* Bottom gradient for name legibility */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

                  {/* Category name */}
                  <span className="absolute bottom-0 inset-x-0 px-2 pb-2 pt-4 text-center text-[10px] sm:text-xs font-semibold text-white leading-tight line-clamp-2">
                    {cat.name}
                  </span>
                </Link>
              );
            })}
      </div>
    </section>
  );
}
