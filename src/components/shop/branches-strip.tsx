"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { MapPin, ChevronRight, Clock } from "lucide-react";
import { branchApi } from "@/lib/api";
import { Skeleton } from "@/components/common/skeletons";

export function BranchesStrip() {
  const t = useTranslations("home");
  const tBranch = useTranslations("branches");
  const locale = useLocale();

  const { data: branches, isLoading } = useQuery({
    queryKey: ["branches"],
    queryFn: () => branchApi.list().then((r) => r.data),
  });

  return (
    <section className="py-12 bg-muted/30 border-y border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">{tBranch("title")}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {tBranch("subtitle")}
            </p>
          </div>
          <Link
            href={`/${locale}/branches`}
            className="flex items-center gap-1.5 text-sm text-primary font-medium hover:underline shrink-0"
          >
            {t("viewAll")} <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-2xl" />
              ))
            : branches?.slice(0, 5).map((branch: any) => (
                <Link
                  key={branch.id}
                  href={`/${locale}/branches/${branch.slug}`}
                  className="group bg-card border border-border rounded-2xl p-4 hover:border-primary/50 hover:shadow-sm transition-all"
                >
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <p className="font-semibold text-xs leading-tight group-hover:text-primary transition-colors">
                    {branch.name.replace("Simba Supermarket ", "")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3 shrink-0" />
                    {branch.openTime}-{branch.closeTime}
                  </p>
                </Link>
              ))}
        </div>
      </div>
    </section>
  );
}
