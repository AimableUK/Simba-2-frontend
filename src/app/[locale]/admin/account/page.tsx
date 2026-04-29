"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "@/lib/auth-client";
import { User, Package, Bell, ShieldCheck, ArrowRight } from "lucide-react";

export default function AdminAccountPage() {
  const locale = useLocale();
  const t = useTranslations();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role || "user";

  const items = [
    {
      href: `/${locale}/account/profile`,
      icon: User,
      title: t("nav.account"),
      desc: t("common.profile"),
    },
    {
      href: `/${locale}/admin/my-orders`,
      icon: Package,
      title: t("nav.orders"),
      desc: t("admin.orders.title"),
    },
    {
      href: `/${locale}/admin/notifications`,
      icon: Bell,
      title: t("nav.notifications"),
      desc: t("nav.recentNotifications"),
    },
    ...(role !== "user"
      ? [
          {
            href: `/${locale}/admin/dashboard`,
            icon: ShieldCheck,
            title: t("nav.admin"),
            desc: t("admin.dashboard.title"),
          },
        ]
      : []),
  ];

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("nav.accountCenter")}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("nav.recentNotifications")}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {items.map(({ href, icon: Icon, title, desc }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 hover:border-primary/40 transition-colors"
          >
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{title}</p>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
