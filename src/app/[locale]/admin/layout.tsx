"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  FileText,
  MessageSquare,
  Image as ImageIcon,
  Settings,
  Menu,
  X,
  ChevronRight,
  Clock,
  MapPin,
  Bell,
  User,
} from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { useNotificationStore } from "@/store";
import { ThemeSwitcherV1 } from "@/lib/theme-switcher-v1";
import LanguageSwitcherV1 from "@/components/common/LanguageSwitcherV1";
import Image from "next/image";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const locale = useLocale();
  const pathname = usePathname();
  const tLayout = useTranslations("admin.layout");
  const tMenu = useTranslations("admin.menu");
  const tNav = useTranslations("nav");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [time, setTime] = useState(new Date());
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const resolvedLocale = locale || pathname.split("/")[1] || "en";
  const adminPath = pathname.replace(/^\/(en|fr|rw|sw)(?=\/|$)/, "") || "/";

  const NAV_ITEMS = [
    {
      label: tMenu("dashboard"),
      href: "dashboard",
      icon: LayoutDashboard,
      roles: ["admin", "super_admin"],
    },
    {
      label: tMenu("products"),
      href: "products",
      icon: Package,
      roles: ["admin", "super_admin"],
    },
    {
      label: tMenu("orders"),
      href: "orders",
      icon: ShoppingCart,
      roles: ["admin", "super_admin"],
    },
    {
      label: tMenu("branches"),
      href: "branches",
      icon: MapPin,
      roles: ["admin", "super_admin", "branch_manager"],
    },
    {
      label: tMenu("users"),
      href: "users",
      icon: Users,
      roles: ["admin", "super_admin", "branch_manager"],
    },
    {
      label: tMenu("blogs"),
      href: "blogs",
      icon: FileText,
      roles: ["poster", "admin", "super_admin"],
    },
    {
      label: tMenu("messages"),
      href: "contacts",
      icon: MessageSquare,
      roles: ["admin", "super_admin"],
    },
    {
      label: tMenu("banners"),
      href: "banners",
      icon: ImageIcon,
      roles: ["admin", "super_admin"],
    },
    {
      label: tMenu("settings"),
      href: "settings",
      icon: Settings,
      roles: ["admin", "super_admin", "branch_manager"],
    },
    {
      label: tNav("account"),
      href: "account",
      icon: User,
      roles: ["user", "poster", "admin", "super_admin", "branch_manager", "branch_staff"],
    },
    {
      label: tNav("orders"),
      href: "my-orders",
      icon: ShoppingCart,
      roles: ["user", "poster", "admin", "super_admin", "branch_manager", "branch_staff"],
    },
    {
      label: tNav("notifications"),
      href: "notifications",
      icon: Bell,
      roles: ["user", "poster", "admin", "super_admin", "branch_manager", "branch_staff"],
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.replace(`/${resolvedLocale}/auth/sign-in`);
      return;
    }
  }, [session, isPending, router, resolvedLocale]);

  const role = (session?.user as any)?.role || "user";
  const routeKey =
    adminPath === "/admin"
      ? ""
      : adminPath.replace(/^\/admin\//, "").split("/")[0];
  const allowedRoutes =
    role === "super_admin"
      ? null
      : role === "admin"
        ? new Set([
            "",
            "dashboard",
            "products",
            "orders",
            "branches",
            "users",
            "blogs",
            "contacts",
            "banners",
            "account",
            "my-orders",
            "notifications",
            "profile",
            "settings",
            "branch-invites",
          ])
        : role === "branch_manager"
          ? new Set([
              "",
              "branches",
              "users",
              "settings",
              "account",
              "my-orders",
              "notifications",
              "profile",
              "branch-invites",
              "branch-dashboard",
            ])
          : role === "poster"
            ? new Set([
                "",
                "blogs",
                "account",
                "my-orders",
                "notifications",
                "profile",
                "branch-invites",
              ])
          : new Set([
              "",
              "account",
              "my-orders",
              "notifications",
              "profile",
              "branch-invites",
            ]);

  const roleFallback =
    role === "admin" || role === "super_admin"
      ? "/dashboard"
      : role === "branch_manager"
        ? "/branches"
      : role === "poster"
        ? "/blogs"
      : role === "branch_staff"
          ? "/branch-dashboard"
          : "/account";
  const unauthorized =
    !!session?.user &&
    allowedRoutes !== null &&
    !allowedRoutes.has(routeKey);

  useEffect(() => {
    if (unauthorized && resolvedLocale) {
      router.replace(
        role === "branch_staff"
          ? `/${resolvedLocale}/branch-dashboard`
          : `/${resolvedLocale}/admin${roleFallback}`,
      );
    }
  }, [unauthorized, resolvedLocale, role, roleFallback, router]);

  if (isPending || !session?.user)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (unauthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col transition-transform duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <Link href={`/${locale}`} className="flex items-center gap-2.5">
            <div className="flex items-center justify-center">
            <Image
              src="/simbalogo.png"
              alt="Simba Super Market logo"
              width={35}
              height={35}
            />
          </div>
          <div>
            <p className="font-bold text-sm leading-none">{tLayout("appName")}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {tLayout("panel")}
            </p>
          </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV_ITEMS.filter((item) => item.roles.includes(role)).map(
            ({ label, href, icon: Icon }) => {
              const fullPath = `/${locale}/admin/${href}`;
              const active = pathname.includes(`/admin/${href}`);
              return (
                <Link
                  key={href}
                  href={fullPath}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 mx-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors mb-0.5",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                  {active && <ChevronRight className="h-3 w-3 ml-auto" />}
                </Link>
              );
            },
          )}
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

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden lg:pl-64">
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
            <Link
              href={`/${locale}/admin/notifications`}
              className="relative p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
            <ThemeSwitcherV1 />
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
