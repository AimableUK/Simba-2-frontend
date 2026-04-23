"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShoppingBag,
  ClipboardList,
  Package,
  LogOut,
  Home,
  BarChart2,
} from "lucide-react";
import { useSession, signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { useAdminSocket } from "@/hooks/useSocket";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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

  const role = (session?.user as any)?.role as string;

  useAdminSocket({
    onNewOrder: (data) => {
      qc.invalidateQueries({ queryKey: ["branch-dashboard"] });
      toast(`🛒 New pick-up order: ${data.orderNumber}`);
    },
  });

  useEffect(() => {
    if (isPending) return;
    if (!session?.user) {
      router.replace(`/${locale}/auth/sign-in`);
      return;
    }
    if (
      !["branch_staff", "branch_manager", "admin", "super_admin"].includes(role)
    ) {
      router.replace(`/${locale}`);
    }
  }, [session, isPending, role, router, locale]);

  if (isPending || !session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const NAV = [
    {
      href: `/${locale}/branch-dashboard`,
      icon: BarChart2,
      label: "Dashboard",
      exact: true,
    },
    {
      href: `/${locale}/branch-dashboard/orders`,
      icon: ClipboardList,
      label: "Orders",
    },
    {
      href: `/${locale}/branch-dashboard/stock`,
      icon: Package,
      label: "Stock",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-56 bg-card border-r border-border flex-col shrink-0 hidden lg:flex">
        <div className="p-5 border-b border-border">
          <Link href={`/${locale}`} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <ShoppingBag className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm leading-none">Branch Panel</p>
              <p className="text-xs text-muted-foreground capitalize mt-0.5">
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
                  "flex items-center gap-3 mx-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors mb-0.5",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" /> {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
              {session.user.name?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">
                {session.user.name}
              </p>
            </div>
          </div>
          <Link
            href={`/${locale}`}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors mb-2"
          >
            <Home className="h-3.5 w-3.5" /> Back to Store
          </Link>
          <button
            onClick={() =>
              signOut({
                fetchOptions: { onSuccess: () => router.push(`/${locale}`) },
              })
            }
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-destructive transition-colors w-full"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden sticky top-0 z-30 bg-background border-b border-border px-4 py-3 flex items-center justify-between">
          <Link href={`/${locale}`} className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            <span className="font-bold text-sm">Branch Panel</span>
          </Link>
          <div className="flex gap-3 text-xs">
            {NAV.map(({ href, label, exact }) => {
              const active = exact
                ? pathname === href
                : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "font-medium transition-colors",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
