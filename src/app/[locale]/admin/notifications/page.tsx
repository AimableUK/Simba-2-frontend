"use client";

import { useMemo, useEffect, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, CheckCheck, Trash2, Package, UserPlus } from "lucide-react";
import { useNotificationStore } from "@/store";
import { formatDateTime } from "@/lib/utils";
import { resolveLocalizedPath } from "@/lib/utils";
import type { AppNotification } from "@/store";

// Map notification type -> destination path (locale-prefixed at call site)
function resolveNotificationPath(
  item: AppNotification,
  locale: string,
): string | null {
  // Explicit link always wins (e.g. branch_invite already carries /admin/branch-invites/:token)
  if (item.link) return resolveLocalizedPath(item.link, locale);

  // Order notifications carry orderId
  if (
    (item.type === "order_placed" || item.type === "order_status") &&
    (item as any).orderId
  ) {
    return `/${locale}/admin/my-orders/${(item as any).orderId}`;
  }

  return null;
}

// Icon per notification type
function NotificationIcon({ type }: { type: string }) {
  if (
    type === "branch_invite" ||
    type === "branch_invite_accepted" ||
    type === "branch_invite_declined"
  ) {
    return <UserPlus className="h-5 w-5 text-primary" />;
  }
  if (type === "order_placed" || type === "order_status") {
    return <Package className="h-5 w-5 text-primary" />;
  }
  return <Bell className="h-5 w-5 text-primary" />;
}

export default function AdminNotificationsPage() {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations();
  const items = useNotificationStore((s) => s.items);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const clear = useNotificationStore((s) => s.clear);

  const unread = useMemo(() => items.filter((i) => !i.read).length, [items]);

  // Auto-mark currently visible unread notifications as read after 2.5 s
  useEffect(() => {
    if (unread === 0) return;

    const unreadIds = items.filter((i) => !i.read).map((i) => i.id);
    const timer = setTimeout(() => {
      unreadIds.forEach((id) => markRead(id));
    }, 2500);

    return () => clearTimeout(timer);
    // Only run once on mount for the IDs that were unread at that point
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClick = useCallback(
    (item: AppNotification) => {
      markRead(item.id);
      const path = resolveNotificationPath(item, locale);
      if (path) router.push(path);
    },
    [locale, markRead, router],
  );

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
          items.map((item) => {
            const path = resolveNotificationPath(item, locale);
            const isClickable = !!path;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleClick(item)}
                disabled={!isClickable}
                className={`w-full text-left rounded-2xl border bg-card p-5 transition-colors ${
                  item.read
                    ? "border-border opacity-70"
                    : "border-primary/30 bg-primary/[0.02]"
                } ${
                  isClickable
                    ? "hover:border-primary/50 cursor-pointer"
                    : "cursor-default"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                      item.read ? "bg-muted" : "bg-primary/10"
                    }`}
                  >
                    <NotificationIcon type={item.type} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p
                        className={`font-semibold ${item.read ? "" : "text-foreground"}`}
                      >
                        {item.title}
                      </p>
                      <div className="flex items-center gap-2 shrink-0">
                        {!item.read && (
                          <span className="h-2 w-2 rounded-full bg-primary" />
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(item.createdAt)}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {item.message}
                    </p>
                    {isClickable && (
                      <span className="mt-2 inline-block text-xs font-medium text-primary">
                        {t("nav.viewMore")} →
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      <div className="text-sm text-muted-foreground">
        <Link
          href={`/${locale}/admin/account`}
          className="text-primary hover:underline"
        >
          {t("nav.accountCenter")}
        </Link>
      </div>
    </div>
  );
}
