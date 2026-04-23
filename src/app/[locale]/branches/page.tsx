"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { MapPin, Clock, Star, ChevronRight, Phone } from "lucide-react";
import { branchApi } from "@/lib/api";
import { Skeleton } from "@/components/common/skeletons";

export default function BranchesPage() {
  const t = useTranslations("branches");
  const locale = useLocale();

  const { data: branches, isLoading } = useQuery({
    queryKey: ["branches"],
    queryFn: () => branchApi.list().then((r) => r.data),
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary/5 border-b border-border py-14">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">{t("title")}</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {t("subtitle")}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {branches?.map((branch: any) => (
              <Link
                key={branch.id}
                href={`/${locale}/branches/${branch.slug}`}
                className="group block"
              >
                <div className="bg-card border border-border rounded-2xl p-5 hover:border-primary/50 hover:shadow-md transition-all duration-200">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                      <span className="font-medium">
                        {branch.rating > 0 ? branch.rating.toFixed(1) : "New"}
                      </span>
                      {branch.reviewCount > 0 && (
                        <span className="text-muted-foreground">
                          ({branch.reviewCount})
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="font-bold text-base mb-1 group-hover:text-primary transition-colors">
                    {branch.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    {branch.address}
                  </p>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {branch.openTime} – {branch.closeTime}
                    </span>
                    {branch.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {branch.phone}
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2.5 py-1 rounded-full font-medium">
                      Open
                    </span>
                    <span className="flex items-center gap-1 text-xs text-primary font-medium">
                      {t("selectBranch")} <ChevronRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
