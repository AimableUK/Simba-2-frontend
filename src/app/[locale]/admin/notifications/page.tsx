"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { useNotificationStore } from "@/store";
import { formatDateTime } from "@/lib/utils";
import { resolveLocalizedPath } from "@/lib/utils";

export default function AdminNotificationsPage() {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations();
  const items = useNotificationStore((s) => s.items);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const clear = useNotificationStore((s) => s.clear);

  const unread = useMemo(() => items.filter((i) => !i.read).length, [items]);

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("nav.notifications")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {unread} {t("nav.unread")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => markAllRead()}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            <CheckCheck className="h-4 w-4" />
            {t("nav.markAllRead")}
          </button>
          <button
            type="button"
            onClick={() => clear()}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            {t("common.clear")}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <Bell className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              {t("nav.noNotifications")}
            </p>
          </div>
        ) : (
          items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                markRead(item.id);
                if (item.link) router.push(resolveLocalizedPath(item.link, locale));
              }}
              className="w-full text-left rounded-2xl border border-border bg-card p-5 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold">{item.title}</p>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatDateTime(item.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {item.message}
                  </p>
                  {item.link && (
                    <span className="mt-2 inline-block text-xs font-medium text-primary">
                      {t("nav.viewMore")}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      <div className="text-sm text-muted-foreground">
        <Link href={`/${locale}/admin/account`} className="text-primary hover:underline">
          {t("nav.accountCenter")}
        </Link>
      </div>
    </div>
  );
}
