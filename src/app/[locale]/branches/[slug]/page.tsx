"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import { useParams } from "next/navigation";
import Link from "next/link";
import { MapPin, Clock, Star, Phone, ArrowLeft, ExternalLink } from "lucide-react";
import { branchApi } from "@/lib/api";
import { Skeleton } from "@/components/common/skeletons";
import { formatDate } from "@/lib/utils";

function buildMapUrl(branch: any) {
  if (branch?.lat != null && branch?.lng != null) {
    return `https://www.google.com/maps?q=${branch.lat},${branch.lng}&z=16&output=embed`;
  }

  const query = [branch?.name, branch?.address, branch?.district]
    .filter(Boolean)
    .join(", ");
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=16&output=embed`;
}

export default function BranchDetailPage() {
  const t = useTranslations("branches");
  const locale = useLocale();
  const { slug } = useParams();

  const { data: branch, isLoading } = useQuery({
    queryKey: ["branch", slug],
    queryFn: () => branchApi.get(slug as string).then((r) => r.data),
  });

  const mapUrl = useMemo(() => buildMapUrl(branch), [branch]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-[420px] rounded-3xl" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!branch) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">{t("branchNotFound")}</p>
        <Link
          href={`/${locale}/branches`}
          className="mt-4 inline-flex items-center gap-2 text-primary hover:underline"
        >
          <ArrowLeft size={16} strokeWidth={2.25} /> {t("title")}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-primary/5">
        <div className="container mx-auto px-4 py-10">
          <Link
            href={`/${locale}/branches`}
            className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft size={16} strokeWidth={2.25} /> {t("backToBranches")}
          </Link>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {branch.district}
                </span>
                <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                  {branch.reviewCount} {t("reviewCount")}
                </span>
              </div>

              <div>
                <h1 className="text-3xl font-bold sm:text-4xl">{branch.name}</h1>
                <p className="mt-2 flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span>{branch.address}</span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {branch.openTime} - {branch.closeTime}
                </span>
                {branch.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-4 w-4" />
                    {branch.phone}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  {branch.rating > 0 ? branch.rating.toFixed(1) : t("new")}
                </span>
              </div>
            </div>

            <a
              href={mapUrl.replace("&output=embed", "")}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 self-start rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              {t("map")}
            </a>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5 md:col-span-2">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">{t("map")}</h2>
                <p className="text-sm text-muted-foreground">
                  {branch.address}
                </p>
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-border bg-muted">
              <iframe
                title={`${branch.name} map`}
                src={mapUrl}
                className="h-[360px] w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-lg font-bold">{t("openTime")}</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-xl bg-muted/40 p-3">
                <p className="text-muted-foreground">{t("openTime")}</p>
                <p className="font-semibold">{branch.openTime}</p>
              </div>
              <div className="rounded-xl bg-muted/40 p-3">
                <p className="text-muted-foreground">{t("closeTime")}</p>
                <p className="font-semibold">{branch.closeTime}</p>
              </div>
              <div className="rounded-xl bg-muted/40 p-3">
                <p className="text-muted-foreground">{t("rating")}</p>
                <p className="font-semibold">
                  {branch.rating > 0 ? branch.rating.toFixed(1) : t("new")}
                </p>
              </div>
              <div className="rounded-xl bg-muted/40 p-3">
                <p className="text-muted-foreground">{t("reviewCount")}</p>
                <p className="font-semibold">{branch.reviewCount}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">{t("reviewBranch")}</h2>
              <p className="text-sm text-muted-foreground">
                {branch.reviews?.length ? `${branch.reviews.length} ${t("reviewCount")}` : t("noReviews")}
              </p>
            </div>
          </div>

          {branch.reviews?.length ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {branch.reviews.map((review: any) => (
                <article
                  key={review.id}
                  className="rounded-2xl border border-border bg-background p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                        {review.user?.name?.[0]?.toUpperCase() || "U"}
                      </div>
                      <div>
                        <p className="font-medium">{review.user?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(review.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${i < review.rating ? "fill-primary text-primary" : "text-muted-foreground"}`}
                        />
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="mt-3 text-sm text-muted-foreground">
                      {review.comment}
                    </p>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
              {t("noReviews")}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
