"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  Search,
  Menu,
  X,
  Globe,
  Heart,
  User,
  LogOut,
  Settings,
  Package,
  ChevronDown,
  Bell,
} from "lucide-react";
import { useCartStore, useUIStore } from "@/store";
import { useSession, signOut } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";
import { categoryApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { routing } from "@/i18n/routing";
import { useNotifications } from "@/hooks/useSocket";
import { ThemeSwitcherV1 } from "@/lib/theme-switcher-v1";

const LOCALES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "rw", label: "Kinyarwanda", flag: "🇷🇼" },
  { code: "sw", label: "Kiswahili", flag: "🇹🇿" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
];

export function Navbar() {
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const { openCart } = useCartStore();
  const itemCount = useCartStore((s) => s.getItemCount());
  const {
    searchOpen,
    mobileMenuOpen,
    toggleSearch,
    openMobileMenu,
    closeMobileMenu,
  } = useUIStore();
  const isAdminRoute = pathname.includes("/admin");

  const [searchQuery, setSearchQuery] = useState("");
  const [langOpen, setLangOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const user = session?.user as any;
  useNotifications(user?.id);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryApi.list().then((r) => r.data),
    staleTime: 1000 * 60 * 10,
  });

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  const switchLocale = (newLocale: string) => {
    setLangOpen(false);
    const segments = pathname.split("/");
    segments[1] = newLocale;
    router.push(segments.join("/"));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(
        `/${locale}/shop?search=${encodeURIComponent(searchQuery.trim())}`,
      );
      toggleSearch();
      setSearchQuery("");
    }
  };

  const isAdmin =
    user?.role && ["admin", "super_admin", "poster"].includes(user.role);

  if (isAdminRoute) return null;

  return (
    <>
      {/* Top bar */}
      <div className="bg-primary text-primary-foreground text-xs py-1.5 px-4 text-center hidden md:block">
        🛒 Free delivery on orders over RWF 50,000 - Kigali only
      </div>

      <header
        className={cn(
          "sticky top-0 z-50 w-full transition-all duration-300",
          scrolled
            ? "bg-background/95 backdrop-blur-sm shadow-md border-b border-border"
            : "bg-background border-b border-border",
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center h-16 gap-4">
            {/* Logo */}
            <Link
              href={`/${locale}`}
              className="flex items-center gap-2 flex-shrink-0"
            >
              <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <div className="hidden sm:block">
                <div className="font-bold text-base leading-tight text-foreground">
                  Simba
                </div>
                <div className="text-[10px] text-muted-foreground leading-tight uppercase tracking-wider">
                  Super Market
                </div>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1 flex-1 ml-4">
              <Link
                href={`/${locale}`}
                className="px-3 py-2 rounded-md text-sm font-medium text-foreground/80 hover:text-primary hover:bg-accent transition-colors"
              >
                {t("home")}
              </Link>

              {/* Categories dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setCatOpen(true)}
                onMouseLeave={() => setCatOpen(false)}
              >
                <button className="px-3 py-2 rounded-md text-sm font-medium text-foreground/80 hover:text-primary hover:bg-accent transition-colors flex items-center gap-1">
                  {t("categories")} <ChevronDown className="w-3 h-3" />
                </button>
                <AnimatePresence>
                  {catOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="absolute top-full left-0 mt-1 w-56 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50"
                    >
                      {categories?.map((cat: any) => (
                        <Link
                          key={cat.id}
                          href={`/${locale}/shop?category=${cat.slug}`}
                          onClick={() => setCatOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent hover:text-primary transition-colors"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                          {cat.name}
                        </Link>
                      ))}
                      <div className="border-t border-border">
                        <Link
                          href={`/${locale}/shop`}
                          onClick={() => setCatOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-primary font-medium hover:bg-accent transition-colors"
                        >
                          {t("shop")} →
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Link
                href={`/${locale}/branches`}
                className="px-3 py-2 rounded-md text-sm font-medium text-foreground/80 hover:text-primary hover:bg-accent transition-colors"
              >
                {t("branches")}
              </Link>
              <Link
                href={`/${locale}/blog`}
                className="px-3 py-2 rounded-md text-sm font-medium text-foreground/80 hover:text-primary hover:bg-accent transition-colors"
              >
                {t("blog")}
              </Link>
              <Link
                href={`/${locale}/contact`}
                className="px-3 py-2 rounded-md text-sm font-medium text-foreground/80 hover:text-primary hover:bg-accent transition-colors"
              >
                {t("contact")}
              </Link>
            </nav>

            {/* Desktop search bar */}
            <form
              onSubmit={handleSearch}
              className="hidden md:flex flex-1 max-w-xs xl:max-w-sm"
            >
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={t("searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-muted border border-border rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
            </form>

            {/* Actions */}
            <div className="flex items-center gap-1 ml-auto lg:ml-0">
              {/* Mobile search */}
              <button
                onClick={toggleSearch}
                className="md:hidden p-2 rounded-lg hover:bg-accent text-foreground/70 hover:text-primary transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Theme */}
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 rounded-lg hover:bg-accent text-foreground/70 hover:text-primary transition-colors"
                aria-label={
                  theme === "dark" ? tCommon("lightMode") : tCommon("darkMode")
                }
              >
                <ThemeSwitcherV1 />
              </button>

              {/* Language */}
              <div className="relative">
                <button
                  onClick={() => setLangOpen(!langOpen)}
                  className="p-2 rounded-lg hover:bg-accent text-foreground/70 hover:text-primary transition-colors flex items-center gap-1"
                >
                  <Globe className="w-5 h-5" />
                  <span className="hidden sm:inline text-xs uppercase font-medium">
                    {locale}
                  </span>
                </button>
                <AnimatePresence>
                  {langOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-44 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50"
                    >
                      {LOCALES.map((l) => (
                        <button
                          key={l.code}
                          onClick={() => switchLocale(l.code)}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent transition-colors",
                            locale === l.code &&
                              "text-primary font-semibold bg-accent",
                          )}
                        >
                          <span>{l.flag}</span>
                          {l.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Wishlist */}
              {user && (
                <Link
                  href={`/${locale}/account/wishlist`}
                  className="hidden sm:flex p-2 rounded-lg hover:bg-accent text-foreground/70 hover:text-primary transition-colors"
                >
                  <Heart className="w-5 h-5" />
                </Link>
              )}

              {/* Cart */}
              <button
                onClick={openCart}
                className="relative p-2 rounded-lg hover:bg-accent text-foreground/70 hover:text-primary transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                    {itemCount > 9 ? "9+" : itemCount}
                  </span>
                )}
              </button>

              {/* User */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserOpen(!userOpen)}
                    className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full hover:bg-accent transition-colors"
                  >
                    <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {user.name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <span className="hidden sm:inline text-sm font-medium text-foreground max-w-[80px] truncate">
                      {user.name?.split(" ")[0]}
                    </span>
                    <ChevronDown className="w-3 h-3 text-muted-foreground" />
                  </button>
                  <AnimatePresence>
                    {userOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute right-0 top-full mt-2 w-52 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50"
                      >
                        <div className="px-4 py-3 border-b border-border">
                          <p className="text-sm font-semibold text-foreground">
                            {user.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </p>
                        </div>
                        <div className="py-1">
                          <Link
                            href={`/${locale}/account/profile`}
                            onClick={() => setUserOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-accent transition-colors"
                          >
                            <User className="w-4 h-4 text-muted-foreground" />{" "}
                            {t("account")}
                          </Link>
                          <Link
                            href={`/${locale}/account/orders`}
                            onClick={() => setUserOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-accent transition-colors"
                          >
                            <Package className="w-4 h-4 text-muted-foreground" />{" "}
                            {t("orders")}
                          </Link>
                          {isAdmin && (
                            <Link
                              href={`/${locale}/admin`}
                              onClick={() => setUserOpen(false)}
                              className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-accent transition-colors text-primary font-medium"
                            >
                              <Settings className="w-4 h-4" /> {t("admin")}
                            </Link>
                          )}
                        </div>
                        <div className="py-1 border-t border-border">
                          <button
                            onClick={async () => {
                              setUserOpen(false);
                              await signOut();
                              router.refresh();
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-accent transition-colors text-destructive"
                          >
                            <LogOut className="w-4 h-4" /> {t("signOut")}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  href={`/${locale}/auth/sign-in`}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-full hover:bg-primary/90 transition-colors"
                >
                  {t("signIn")}
                </Link>
              )}

              {/* Mobile menu */}
              <button
                onClick={openMobileMenu}
                className="lg:hidden p-2 rounded-lg hover:bg-accent text-foreground/70 transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile search bar */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-border overflow-hidden"
            >
              <form onSubmit={handleSearch} className="p-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    ref={searchRef}
                    type="text"
                    placeholder={t("searchPlaceholder")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 text-sm bg-muted border border-border rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={toggleSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Mobile menu drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 lg:hidden"
              onClick={closeMobileMenu}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.25 }}
              className="fixed left-0 top-0 h-full w-72 bg-card border-r border-border shadow-2xl z-50 lg:hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold">S</span>
                  </div>
                  <span className="font-bold text-foreground">
                    Simba Super Market
                  </span>
                </div>
                <button
                  onClick={closeMobileMenu}
                  className="p-1 rounded-lg hover:bg-accent"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                {[
                  { href: `/${locale}`, label: t("home") },
                  { href: `/${locale}/shop`, label: t("shop") },
                  { href: `/${locale}/branches`, label: t("branches") },
                  { href: `/${locale}/blog`, label: t("blog") },
                  { href: `/${locale}/contact`, label: t("contact") },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobileMenu}
                    className="block px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-accent hover:text-primary transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}

                <div className="pt-2">
                  <p className="px-4 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t("categories")}
                  </p>
                  {categories?.slice(0, 6).map((cat: any) => (
                    <Link
                      key={cat.id}
                      href={`/${locale}/shop?category=${cat.slug}`}
                      onClick={closeMobileMenu}
                      className="block px-4 py-2 rounded-lg text-sm hover:bg-accent hover:text-primary transition-colors"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </nav>

              <div className="p-4 border-t border-border space-y-2">
                {user ? (
                  <>
                    <div className="flex items-center gap-3 px-2 py-2">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {user.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        closeMobileMenu();
                        await signOut();
                        router.refresh();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-accent rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> {t("signOut")}
                    </button>
                  </>
                ) : (
                  <Link
                    href={`/${locale}/auth/sign-in`}
                    onClick={closeMobileMenu}
                    className="block w-full text-center px-4 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-full hover:bg-primary/90 transition-colors"
                  >
                    {t("signIn")}
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Click outside to close dropdowns */}
      {(langOpen || userOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setLangOpen(false);
            setUserOpen(false);
          }}
        />
      )}
    </>
  );
}
