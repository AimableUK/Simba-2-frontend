"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
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
  ShoppingBag,
  LogOut,
  Bell,
  ChevronRight,
} from "lucide-react";
import { useSession, signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { useAdminSocket } from "@/hooks/useSocket";
import { toast } from "sonner";

const NAV_ITEMS = [
  { label: "Dashboard", href: "dashboard", icon: LayoutDashboard },
  { label: "Products", href: "products", icon: Package },
  { label: "Orders", href: "orders", icon: ShoppingCart },
  { label: "Users", href: "users", icon: Users },
  { label: "Blog Posts", href: "blogs", icon: FileText },
  { label: "Messages", href: "contacts", icon: MessageSquare },
  { label: "Banners", href: "banners", icon: ImageIcon },
  { label: "Settings", href: "settings", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const locale = useLocale();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState(0);

  useAdminSocket({
    onNewOrder: (data) => {
      setNotifications((n) => n + 1);
      toast(`🛒 New order: ${data.orderNumber}`, {
        description: `RWF ${data.total?.toLocaleString()}`,
      });
    },
    onNewContact: (data) => {
      setNotifications((n) => n + 1);
      toast(`📩 New message from ${data.name}`, { description: data.subject });
    },
  });

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.replace(`/${locale}/auth/sign-in`);
      return;
    }
    const role = (session?.user as any)?.role;
    if (
      !isPending &&
      session?.user &&
      !["admin", "super_admin", "poster"].includes(role)
    ) {
      router.replace(`/${locale}`);
    }
  }, [session, isPending, router, locale]);

  if (isPending || !session?.user)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );

  const role = (session.user as any)?.role;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <Link href={`/${locale}`} className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <ShoppingBag className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm leading-none">Simba Market</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Admin Panel
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

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV_ITEMS.filter((item) => {
            if (item.href === "users" || item.href === "settings")
              return role === "super_admin";
            if (item.href === "products" || item.href === "blogs")
              return ["poster", "admin", "super_admin"].includes(role);
            return ["admin", "super_admin"].includes(role);
          }).map(({ label, href, icon: Icon }) => {
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
          })}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-border">
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
          <button
            onClick={() =>
              signOut({
                fetchOptions: { onSuccess: () => router.push(`/${locale}`) },
              })
            }
            className="flex items-center gap-2 w-full text-sm text-muted-foreground hover:text-destructive transition-colors px-2 py-1.5 rounded-lg hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur border-b border-border flex items-center justify-between px-4 h-14">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <button className="relative p-2 hover:bg-muted rounded-lg transition-colors">
              <Bell className="h-5 w-5" />
              {notifications > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                  {notifications > 9 ? "9+" : notifications}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 sm:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
