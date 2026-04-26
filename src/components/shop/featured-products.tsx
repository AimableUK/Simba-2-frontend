"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { categoryApi } from "@/lib/api";
import { cn } from "@/lib/utils";
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

const CATEGORY_IMAGE_MAP: { keywords: string[]; photoId: string }[] = [
  {
    keywords: ["fruit", "veg", "produce", "fresh", "salad", "green"],
    photoId: "1542838132-92c53300491e", // colorful fresh market vegetables
  },
  {
    keywords: [
      "meat",
      "butch",
      "beef",
      "chicken",
      "pork",
      "lamb",
      "fish",
      "seafood",
    ],
    photoId: "1529692076929-c3d9b6e47c06", // raw steak on dark background
  },
  {
    keywords: ["frozen", "ice", "freeze"],
    photoId: "1608686207856-001b71d4eb0e", // frozen food / ice crystals
  },
  {
    keywords: [
      "wine",
      "spirit",
      "alcohol",
      "beer",
      "beverage",
      "drink",
      "liquor",
      "whisky",
      "champagne",
    ],
    photoId: "1510812431401-41d2bd2722f3", // wine bottles on shelf
  },
  {
    keywords: [
      "furniture",
      "sofa",
      "couch",
      "chair",
      "table",
      "bed",
      "living",
      "bedroom",
      "decor",
    ],
    photoId: "1555041469-a586c61ea9bc", // modern living room sofa
  },
  {
    keywords: [
      "electron",
      "gadget",
      "tech",
      "phone",
      "laptop",
      "computer",
      "tv",
      "camera",
      "device",
    ],
    photoId: "1498049794561-7780e7231661", // electronics / tech devices
  },
  {
    keywords: [
      "utensil",
      "ornament",
      "kitchen",
      "cookware",
      "tool",
      "pot",
      "pan",
      "cutlery",
      "crockery",
    ],
    photoId: "1556909114-f6e7ad7d3136", // kitchen utensils
  },
  {
    keywords: [
      "homecare",
      "home care",
      "clean",
      "detergent",
      "laundry",
      "hygiene",
      "household",
    ],
    photoId: "1585771724684-38269d6639fd", // cleaning products
  },
  {
    keywords: [
      "baby",
      "infant",
      "toddler",
      "child",
      "kid",
      "diaper",
      "toy",
      "nappy",
    ],
    photoId: "1515488042361-ee00e41557a4", // baby products / cute baby
  },
  {
    keywords: [
      "gym",
      "sport",
      "fitness",
      "workout",
      "exercise",
      "weight",
      "yoga",
      "running",
      "athletic",
    ],
    photoId: "1534438327276-14e5300c3a48", // gym equipment
  },
  {
    keywords: [
      "health",
      "beauty",
      "cosmetic",
      "skin",
      "makeup",
      "perfume",
      "hair",
      "lotion",
      "cream",
    ],
    photoId: "1596462502278-27bfdc403348", // beauty / makeup cosmetics
  },
  {
    keywords: [
      "baker",
      "bread",
      "pastry",
      "cake",
      "biscuit",
      "cookie",
      "muffin",
      "flour",
    ],
    photoId: "1509440159596-0249088772ff", // fresh bread in bakery
  },
];

// Fallback gradient colors (index-based, used when no keyword matches)
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

function getCategoryImage(name: string): string | null {
  const lower = name.toLowerCase();
  const match = CATEGORY_IMAGE_MAP.find((entry) =>
    entry.keywords.some((kw) => lower.includes(kw)),
  );
  if (!match) return null;
  return `https://images.unsplash.com/photo-${match.photoId}?w=400&q=80&fit=crop&crop=center`;
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
              const unsplashUrl = getCategoryImage(cat.name);
              return (
                <Link
                  key={cat.id}
                  href={`/${locale}/shop?category=${cat.slug}`}
                  className="group relative aspect-square rounded-2xl overflow-hidden border border-border hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10"
                >
                  {/* Background: Unsplash image OR gradient fallback */}
                  {unsplashUrl ? (
                    <Image
                      src={unsplashUrl}
                      alt={cat.name}
                      fill
                      sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 12.5vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      unoptimized // Unsplash already optimises via their CDN params
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
