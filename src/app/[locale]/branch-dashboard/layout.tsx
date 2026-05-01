"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShoppingBag,
  ClipboardList,
  Package,
  LogOut,
  Home,
  BarChart2,
  Bell,
  CheckCheck,
  Check,
  X,
  Clock,
  Menu,
} from "lucide-react";
import { useSession, signOut } from "@/lib/auth-client";
import { cn, resolveLocalizedPath } from "@/lib/utils";
import { useAdminSocket, useNotifications } from "@/hooks/useSocket";
import { useNotificationStore } from "@/store";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { branchApi } from "@/lib/api";
import { ThemeSwitcherV1 } from "@/lib/theme-switcher-v1";
import LanguageSwitcherV1 from "@/components/common/LanguageSwitcherV1";

export default function BranchDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const locale = useLocale();
  const pathname = usePathname();
  const qc = useQueryClient();
  const t = useTranslations("branchDashboard");
  const tNav = useTranslations("nav");
  const resolvedLocale = locale || pathname.split("/")[1] || "en";
  const role = (session?.user as any)?.role as string;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [time, setTime] = useState(new Date());
  const notifications = useNotificationStore((s) => s.items);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const clear = useNotificationStore((s) => s.clear);
  useNotifications(session?.user?.id);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useAdminSocket({
    onNewOrder: (data) => {
      qc.invalidateQueries({ queryKey: ["branch-dashboard"] });
      toast(t("newPickupOrder", { number: data.orderNumber }));
    },
  });

  useEffect(() => {
    if (isPending) return;
    if (!session?.user) {
      router.replace(`/${resolvedLocale}/auth/sign-in`);
      return;
    }
    if (
      !["branch_staff", "branch_manager", "admin", "super_admin"].includes(role)
    ) {
      router.replace(`/${resolvedLocale}`);
    }
  }, [session, isPending, role, router, resolvedLocale]);

  if (isPending || !session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const NAV = [
    {
      href: `/${resolvedLocale}/branch-dashboard`,
      icon: BarChart2,
      label: role === "branch_staff" ? t("overview") : t("dashboard"),
      exact: true,
    },
    {
      href: `/${resolvedLocale}/branch-dashboard/orders`,
      icon: ClipboardList,
      label: role === "branch_staff" ? t("assignedOrders") : t("orders"),
    },
    {
      href: `/${resolvedLocale}/branch-dashboard/stock`,
      icon: Package,
      label: t("stock"),
    },
  ];

  const resolveLink = (link?: string) =>
    link ? resolveLocalizedPath(link, resolvedLocale) : undefined;

  const getInviteToken = (link?: string) =>
    link?.match(/branch-invites\/([^/?#]+)/)?.[1] || null;

  const handleInviteAction = async (
    notificationId: string,
    token: string,
    action: "accept" | "decline",
  ) => {
    try {
      const res = await branchApi.respondInvite(token, action);
      markRead(notificationId);
      setNotifOpen(false);
      toast.success(
        action === "accept" ? t("inviteAccepted") : t("inviteDeclined"),
      );
      if (action === "accept") {
        const nextRole = res.data?.role;
        if (nextRole === "branch_staff" || nextRole === "branch_manager") {
          router.push(`/${resolvedLocale}/branch-dashboard`);
        } else if (res.data?.branch?.slug) {
          router.push(
            `/${resolvedLocale}/admin/branches/${res.data.branch.slug}`,
          );
        }
      }
      qc.invalidateQueries({ queryKey: ["branch-dashboard"] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || t("failed"));
    }
  };

  const notificationsPopover = (
    <div className="relative">
      <button
        type="button"
        onClick={() => setNotifOpen((v) => !v)}
        className="relative flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
        aria-label={t("notifications")}
      >
        <Bell className="h-4 w-4" />
        <span className="hidden sm:inline">{t("notifications")}</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {notifOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-1rem))] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <CheckCheck className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">{t("notifications")}</p>
            </div>
            <button
              type="button"
              onClick={() => markAllRead()}
              className="text-xs font-medium text-primary hover:underline"
            >
              {t("markAllRead")}
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                {t("noNotifications")}
              </div>
            ) : (
              notifications.slice(0, 8).map((item) => {
                const token = getInviteToken(item.link);
                const localizedLink = resolveLink(item.link);

                if (item.type === "branch_invite" && token) {
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "border-b border-border/60 px-4 py-3 last:border-0",
                        !item.read && "bg-primary/5",
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <Bell className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{item.title}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {item.message}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleInviteAction(item.id, token, "accept")
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                            >
                              <Check className="h-3.5 w-3.5" />
                              {t("acceptInvite")}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleInviteAction(item.id, token, "decline")
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-muted"
                            >
                              <X className="h-3.5 w-3.5" />
                              {t("declineInvite")}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      markRead(item.id);
                      setNotifOpen(false);
                      if (localizedLink) router.push(localizedLink);
                    }}
                    className={cn(
                      "w-full border-b border-border/60 px-4 py-3 text-left last:border-0 hover:bg-muted/60 transition-colors",
                      !item.read && "bg-primary/5",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Bell className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium line-clamp-1">
                          {item.title}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                          {item.message}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
          <div className="flex items-center justify-between border-t border-border bg-muted/40 px-4 py-3">
            <button
              type="button"
              onClick={() => {
                setNotifOpen(false);
                clear();
              }}
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              {t("clearNotifications")}
            </button>
            <button
              type="button"
              onClick={() => {
                setNotifOpen(false);
                router.push(
                  role === "admin" || role === "super_admin"
                    ? `/${resolvedLocale}/admin/notifications`
                    : `/${resolvedLocale}/branch-dashboard/orders`,
                );
              }}
              className="text-xs font-medium text-primary hover:underline"
            >
              {t("viewAllNotifications")}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-card lg:flex">
        <div className="border-b border-border p-5">
          <Link href={`/${resolvedLocale}`} className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <ShoppingBag className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold leading-none">
                {t("panelTitle")}
              </p>
              <p className="mt-0.5 text-xs capitalize text-muted-foreground">
                {role?.replace("_", " ")}
              </p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 py-4">
          {NAV.map(({ href, icon: Icon, label, exact }) => {
            const active = exact
              ? pathname === href
              : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "mx-3 mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <Link href={`/${locale}/admin/profile`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
                {session.user.name?.[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {session.user.name}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {role?.replace("_", " ")}
                </p>
              </div>
            </div>
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur border-b border-border flex items-center justify-between px-4 h-14">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground ml-3">
            <Clock className="h-4 w-4" />
            <span className="font-mono">
              {time.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <LanguageSwitcherV1 />
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((v) => !v)}
                className="relative p-2 hover:bg-muted rounded-lg transition-colors"
                aria-label={tNav("notifications")}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-1rem))] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
                  <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <p className="text-sm font-semibold">
                      {tNav("notifications")}
                    </p>
                    <button
                      type="button"
                      onClick={() => markAllRead()}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      {tNav("markAllRead")}
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                        {tNav("noNotifications")}
                      </div>
                    ) : (
                      notifications.slice(0, 6).map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => {
                            markRead(n.id);
                            setNotifOpen(false);
                            if (n.link) router.push(n.link);
                          }}
                          className={cn(
                            "w-full border-b border-border/60 px-4 py-3 text-left last:border-0 hover:bg-muted/60 transition-colors",
                            !n.read && "bg-primary/5",
                          )}
                        >
                          <p className="text-sm font-medium truncate">
                            {n.title}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                            {n.message}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                  <div className="flex items-center justify-between border-t border-border bg-muted/40 px-4 py-3">
                    <button
                      type="button"
                      onClick={() => {
                        setNotifOpen(false);
                        clear();
                      }}
                      className="text-xs font-medium text-muted-foreground hover:text-foreground"
                    >
                      {tNav("clearNotifications")}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNotifOpen(false);
                        router.push(`/${locale}/admin/notifications`);
                      }}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      {tNav("viewMore")}
                    </button>
                  </div>
                </div>
              )}
            </div>
            <ThemeSwitcherV1 />
          </div>
        </header>

        <main className="flex-1 min-w-0 overflow-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
