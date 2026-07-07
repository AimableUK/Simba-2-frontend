"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useLocale } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Send,
  Loader2,
  ShoppingCart,
  MapPin,
  Heart,
  Bot,
  User as UserIcon,
  Sparkles,
  RefreshCw,
  ExternalLink,
  CheckCheck,
  Clock,
  Navigation,
  Package,
  Tag,
  Phone,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { useQueryClient } from "@tanstack/react-query";
import { formatPrice, getImageUrl } from "@/lib/utils";
import { toast } from "sonner";

//  Types

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolResults?: ToolResult[];
  loading?: boolean;
  timestamp: Date;
}

interface ToolResult {
  toolName: string;
  args: any;
  result: any;
}

//  Utility

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

//  Product Card (horizontal scroll, inside chat bubble)

function ProductCard({ p, locale }: { p: any; locale: string }) {
  return (
    <Link
      href={`/${locale}/product/${p.slug}`}
      className="group flex-none w-36 bg-background border border-border rounded-2xl overflow-hidden hover:border-primary/60 hover:shadow-md transition-all duration-200"
    >
      <div className="relative aspect-square bg-muted/60">
        <Image
          src={getImageUrl(p.images?.[0])}
          alt={p.name}
          fill
          className="object-contain p-2.5 group-hover:scale-105 transition-transform duration-300"
          sizes="144px"
        />
        {p.stock === 0 && (
          <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
            <span className="text-[10px] font-semibold text-destructive bg-background border border-destructive/30 px-2 py-0.5 rounded-full">
              Out of stock
            </span>
          </div>
        )}
      </div>
      <div className="p-2.5">
        <p className="text-[11px] font-semibold line-clamp-2 leading-tight group-hover:text-primary transition-colors">
          {p.name}
        </p>
        <p className="text-xs text-primary font-bold mt-1.5">
          {formatPrice(p.price)}
        </p>
        {p.stock > 0 && (
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">
            {p.stock} in stock
          </p>
        )}
      </div>
    </Link>
  );
}

function ProductScroll({
  products,
  locale,
}: {
  products: any[];
  locale: string;
}) {
  if (!products?.length) return null;
  return (
    <div className="-mx-1 mt-2.5">
      <div className="flex gap-2 overflow-x-auto pb-2 px-1 scrollbar-hide snap-x snap-mandatory">
        {products.slice(0, 10).map((p) => (
          <div key={p.id} className="snap-start">
            <ProductCard p={p} locale={locale} />
          </div>
        ))}
      </div>
      {products.length > 10 && (
        <p className="text-[10px] text-muted-foreground mt-1 px-1">
          Showing 10 of {products.length} results
        </p>
      )}
    </div>
  );
}

//  Branch Map Card

function BranchCard({
  branch,
  isActive,
  onClick,
}: {
  branch: any;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-left px-3 py-2 rounded-xl border text-xs transition-all w-full ${
        isActive
          ? "border-primary bg-primary/8 text-primary"
          : "border-border hover:border-primary/40 text-muted-foreground hover:text-foreground"
      }`}
    >
      <p className="font-semibold truncate">
        {branch.name?.replace("Simba Supermarket ", "").replace("Simba ", "")}
      </p>
      <p className="text-[10px] mt-0.5 opacity-75 truncate">
        {branch.district || branch.address}
      </p>
      {branch.distanceKm != null && (
        <p className="text-[10px] mt-0.5 font-medium text-primary/80">
          {branch.distanceKm} km · ~{branch.drivingMinutes} min
        </p>
      )}
      {branch.isOpenNow != null && (
        <span
          className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-1 ${
            branch.isOpenNow
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          }`}
        >
          {branch.isOpenNow ? "Open now" : "Closed"}
        </span>
      )}
    </button>
  );
}

function BranchMapPanel({ branches }: { branches: any[] }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [collapsed, setCollapsed] = useState(false);

  if (!branches?.length) return null;
  const active = branches[activeIdx];
  const hasCoords =
    Number.isFinite(active?.lat) && Number.isFinite(active?.lng);
  const mapSrc = hasCoords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${active.lng - 0.006},${active.lat - 0.006},${active.lng + 0.006},${active.lat + 0.006}&layer=mapnik&marker=${active.lat},${active.lng}`
    : "";

  return (
    <div className="mt-2.5 rounded-2xl border border-border bg-background overflow-hidden">
      {/* Branch selector grid */}
      <div className="p-2.5 grid grid-cols-2 gap-1.5">
        {branches.map((b, i) => (
          <BranchCard
            key={b.slug || b.id || i}
            branch={b}
            isActive={activeIdx === i}
            onClick={() => {
              setActiveIdx(i);
              setCollapsed(false);
            }}
          />
        ))}
      </div>

      {/* Map toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center justify-between px-3 py-2 border-t border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <MapPin className="h-3 w-3" />
          {active?.name?.replace("Simba Supermarket ", "") || "Map"}
        </span>
        {collapsed ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronUp className="h-3.5 w-3.5" />
        )}
      </button>

      {/* Map */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            {hasCoords ? (
              <iframe
                key={active?.slug || activeIdx}
                src={mapSrc}
                width="100%"
                height="200"
                className="block border-0 w-full"
                title={`Map: ${active?.name}`}
                loading="lazy"
                referrerPolicy="no-referrer"
                allowFullScreen
              />
            ) : (
              <div className="h-[120px] flex items-center justify-center text-center text-muted-foreground text-xs border-t border-border">
                <div>
                  <MapPin className="h-6 w-6 mx-auto mb-1 opacity-40" />
                  No coordinates for this branch yet
                </div>
              </div>
            )}

            {/* Footer row */}
            <div className="p-2.5 border-t border-border flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                {active?.phone && (
                  <a
                    href={`tel:${active.phone}`}
                    className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Phone className="h-3 w-3 shrink-0" />
                    <span className="truncate">{active.phone}</span>
                  </a>
                )}
                {active?.hours && (
                  <p className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                    <Clock className="h-2.5 w-2.5 shrink-0" />
                    {active.hours}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {active?.directionsUrl && (
                  <a
                    href={active.directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[11px] bg-muted hover:bg-muted/80 border border-border px-2.5 py-1.5 rounded-lg transition-colors font-medium"
                  >
                    <Navigation className="h-3 w-3" />
                    Directions
                  </a>
                )}
                {hasCoords && (
                  <a
                    href={
                      active.mapUrl ||
                      `https://www.google.com/maps?q=${active.lat},${active.lng}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[11px] bg-primary text-primary-foreground px-2.5 py-1.5 rounded-lg hover:bg-primary/90 transition-colors font-medium"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Maps
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

//  Nearest Branch Card

function NearestBranchCard({ data }: { data: any }) {
  const branch = data?.nearest;
  if (!branch) return null;

  return (
    <div className="mt-2.5 rounded-2xl border border-primary/30 bg-primary/5 overflow-hidden">
      <div className="px-3.5 py-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-bold text-foreground">
              {branch.name?.replace("Simba Supermarket ", "")}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {branch.address}
            </p>
          </div>
          {branch.isOpenNow != null && (
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                branch.isOpenNow
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {branch.isOpenNow ? "Open" : "Closed"}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 mt-2.5 text-xs text-muted-foreground">
          {branch.distanceKm != null && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-primary" />
              {branch.distanceKm} km away
            </span>
          )}
          {branch.drivingMinutes != null && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />~{branch.drivingMinutes} min drive
            </span>
          )}
          {branch.walkingMinutes != null && (
            <span className="flex items-center gap-1">
              ~{branch.walkingMinutes} min walk
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mt-3">
          {branch.directionsUrl && (
            <a
              href={branch.directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-xl hover:bg-primary/90 transition-colors font-medium"
            >
              <Navigation className="h-3 w-3" /> Get directions
            </a>
          )}
          {branch.phone && (
            <a
              href={`tel:${branch.phone}`}
              className="flex items-center gap-1.5 text-xs border border-border bg-background px-3 py-1.5 rounded-xl hover:border-primary/40 transition-colors"
            >
              <Phone className="h-3 w-3" /> Call
            </a>
          )}
        </div>
      </div>

      {/* Mini map */}
      {Number.isFinite(branch.lat) && Number.isFinite(branch.lng) && (
        <iframe
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${branch.lng - 0.005},${branch.lat - 0.005},${branch.lng + 0.005},${branch.lat + 0.005}&layer=mapnik&marker=${branch.lat},${branch.lng}`}
          width="100%"
          height="170"
          className="block border-0 w-full border-t border-border"
          title={`Map: ${branch.name}`}
          loading="lazy"
          referrerPolicy="no-referrer"
          allowFullScreen
        />
      )}
    </div>
  );
}

//  Cart Display

function CartDisplay({ cart }: { cart: any }) {
  if (!cart?.items?.length)
    return (
      <div className="mt-2 bg-background border border-border rounded-2xl p-4 text-center">
        <ShoppingBag className="h-7 w-7 text-muted-foreground mx-auto mb-1.5" />
        <p className="text-xs text-muted-foreground font-medium">
          Your cart is empty
        </p>
      </div>
    );

  return (
    <div className="mt-2 bg-background border border-border rounded-2xl overflow-hidden">
      <div className="px-3.5 py-2.5 border-b border-border flex items-center justify-between">
        <span className="text-xs font-bold flex items-center gap-1.5">
          <ShoppingCart className="h-3.5 w-3.5 text-primary" />
          Cart · {cart.itemCount || cart.items.length} item
          {(cart.itemCount || cart.items.length) !== 1 ? "s" : ""}
        </span>
        <span className="text-xs text-primary font-bold">
          {formatPrice(cart.total)}
        </span>
      </div>
      <div className="divide-y divide-border max-h-44 overflow-y-auto">
        {cart.items.map((item: any) => (
          <div
            key={item.productId}
            className="px-3.5 py-2.5 flex items-center justify-between gap-2"
          >
            <p className="text-xs font-medium truncate flex-1">{item.name}</p>
            <div className="flex items-center gap-2 shrink-0 text-xs">
              <span className="text-muted-foreground">×{item.quantity}</span>
              <span className="font-bold text-primary">
                {formatPrice(item.subtotal)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

//  Wishlist Display

function WishlistDisplay({ items }: { items: any[] }) {
  if (!items?.length)
    return (
      <div className="mt-2 bg-background border border-border rounded-2xl p-4 text-center">
        <Heart className="h-7 w-7 text-muted-foreground mx-auto mb-1.5" />
        <p className="text-xs text-muted-foreground font-medium">
          Your wishlist is empty
        </p>
      </div>
    );

  return (
    <div className="mt-2 bg-background border border-border rounded-2xl overflow-hidden">
      <div className="px-3.5 py-2.5 border-b border-border">
        <span className="text-xs font-bold flex items-center gap-1.5">
          <Heart className="h-3.5 w-3.5 text-rose-500" />
          Wishlist · {items.length} item{items.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="divide-y divide-border max-h-44 overflow-y-auto">
        {items.map((item: any) => (
          <div
            key={item.productId}
            className="px-3.5 py-2.5 flex items-center gap-3"
          >
            <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-muted shrink-0">
              <Image
                src={getImageUrl(item.images?.[0])}
                alt={item.name || ""}
                fill
                className="object-contain p-0.5"
                sizes="36px"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold truncate">{item.name}</p>
              <p className="text-xs text-primary font-bold mt-0.5">
                {formatPrice(item.price)}
              </p>
            </div>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                item.inStock
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "bg-red-100 text-red-700 dark:bg-red-900/30"
              }`}
            >
              {item.inStock ? "In stock" : "Out of stock"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

//  Promotions Display

function PromotionsDisplay({ promotions }: { promotions: any[] }) {
  if (!promotions?.length) return null;
  return (
    <div className="mt-2 space-y-2">
      {promotions.map((promo: any, i: number) => (
        <div
          key={i}
          className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-3"
        >
          <div className="flex items-center gap-2 mb-1">
            <Tag className="h-3.5 w-3.5 text-primary" />
            <p className="text-xs font-bold text-foreground">{promo.title}</p>
            {promo.discountPercent && (
              <span className="ml-auto text-[10px] font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                -{promo.discountPercent}%
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">
            {promo.description}
          </p>
          {promo.validUntil && (
            <p className="text-[10px] text-muted-foreground mt-1">
              Valid until {promo.validUntil}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

//  Tool Result Renderer

function ToolResultRenderer({
  toolResults,
  locale,
}: {
  toolResults: ToolResult[];
  locale: string;
}) {
  if (!toolResults?.length) return null;

  return (
    <div className="space-y-1.5">
      {toolResults.map((tr, i) => {
        const r = tr.result;

        if (tr.toolName === "get_products" && r.products?.length) {
          return (
            <ProductScroll key={i} products={r.products} locale={locale} />
          );
        }

        if (tr.toolName === "get_branches" && r.branches?.length) {
          return <BranchMapPanel key={i} branches={r.branches} />;
        }

        if (tr.toolName === "find_nearest_branch") {
          return <NearestBranchCard key={i} data={r} />;
        }

        if (tr.toolName === "get_cart") {
          return <CartDisplay key={i} cart={r} />;
        }

        if (tr.toolName === "get_wishlist") {
          return <WishlistDisplay key={i} items={r.items || []} />;
        }

        if (tr.toolName === "get_promotions" && r.promotions?.length) {
          return <PromotionsDisplay key={i} promotions={r.promotions} />;
        }

        if (tr.toolName === "add_to_cart") {
          return r.success ? null : (
            <p key={i} className="text-xs text-destructive mt-1">
              ⚠ {r.error || "Could not add to cart."}
            </p>
          );
        }

        if (tr.toolName === "add_to_wishlist") {
          return r.success ? null : (
            <p key={i} className="text-xs text-destructive mt-1">
              ⚠ {r.error || "Could not save to wishlist."}
            </p>
          );
        }

        if (
          tr.toolName === "check_branch_stock" &&
          r.productName &&
          r.branchName
        ) {
          return (
            <div
              key={i}
              className={`mt-2 flex items-center gap-2.5 px-3.5 py-3 rounded-2xl border text-xs font-medium ${
                r.available
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-300"
                  : "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300"
              }`}
            >
              <Package className="h-4 w-4 shrink-0" />
              <span>
                <strong>{r.productName}</strong>{" "}
                {r.available
                  ? `is available at ${r.branchName} (${r.stock} units)`
                  : `is out of stock at ${r.branchName}`}
              </span>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}

//  Typing Indicator

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      className="flex items-end gap-2"
    >
      <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0">
        <Bot className="h-3.5 w-3.5 text-white" />
      </div>
      <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-muted/70 border border-border/60">
        <div className="flex items-center gap-1">
          {[0, 0.18, 0.36].map((delay, i) => (
            <motion.span
              key={i}
              animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay,
                ease: "easeInOut",
              }}
              className="w-1.5 h-1.5 rounded-full bg-muted-foreground/70 block"
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

//  Message Bubble

function MessageBubble({
  msg,
  locale,
  isLastInGroup,
  showAvatar,
}: {
  msg: Message;
  locale: string;
  isLastInGroup: boolean;
  showAvatar: boolean;
}) {
  const isUser = msg.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`flex items-end gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar - only on last message in a group */}
      <div className="w-7 shrink-0 mb-0.5">
        {showAvatar && !isUser && (
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
            <Bot className="h-3.5 w-3.5 text-white" />
          </div>
        )}
        {showAvatar && isUser && (
          <div className="w-7 h-7 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center">
            <UserIcon className="h-3.5 w-3.5 text-primary" />
          </div>
        )}
      </div>

      {/* Bubble + tool results */}
      <div
        className={`flex flex-col gap-1.5 min-w-0 ${
          isUser ? "items-end max-w-[78%]" : "items-start max-w-[84%]"
        }`}
      >
        <div
          className={`px-4 py-2.5 text-sm leading-relaxed break-words ${
            isUser
              ? "bg-primary text-primary-foreground rounded-2xl rounded-br-[6px]"
              : "bg-muted/70 border border-border/60 text-foreground rounded-2xl rounded-bl-[6px]"
          }`}
        >
          <p className="whitespace-pre-wrap">{msg.content}</p>
        </div>

        {/* Tool results (products, branches, cart, etc.) */}
        {!isUser && msg.toolResults && (
          <div className="w-full max-w-full">
            <ToolResultRenderer toolResults={msg.toolResults} locale={locale} />
          </div>
        )}

        {/* Timestamp on last message in group */}
        {isLastInGroup && (
          <div
            className={`flex items-center gap-1 px-1 ${isUser ? "flex-row-reverse" : "flex-row"}`}
          >
            <span className="text-[10px] text-muted-foreground/60">
              {formatTime(msg.timestamp)}
            </span>
            {isUser && <CheckCheck className="h-3 w-3 text-primary/50" />}
          </div>
        )}
      </div>
    </motion.div>
  );
}

//  Date Divider

function DateDivider({ date }: { date: Date }) {
  const label = (() => {
    const today = new Date();
    const d = new Date(date);
    if (d.toDateString() === today.toDateString()) return "Today";
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString([], {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  })();

  return (
    <div className="flex items-center gap-3 py-1">
      <div className="flex-1 h-px bg-border/60" />
      <span className="text-[10px] text-muted-foreground/60 font-medium px-2">
        {label}
      </span>
      <div className="flex-1 h-px bg-border/60" />
    </div>
  );
}

//  Quick Actions

const BASE_QUICK_ACTIONS = [
  { label: "🛒 My cart", message: "Show me my cart" },
  { label: "❤️ Wishlist", message: "Show my wishlist" },
  { label: "📍 Branches", message: "Where are your branches?" },
  { label: "🥛 Dairy", message: "What dairy products do you have?" },
  { label: "🔥 Deals", message: "Any deals or promotions right now?" },
  { label: "🗺️ Nearest", message: "Find my nearest branch" },
];

//  Main Component

export function SimbaAgent() {
  const locale = useLocale();
  const { data: session } = useSession();
  const qc = useQueryClient();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      role: "assistant",
      content: `${getGreeting()}! 👋 I'm Simba, your personal shopping assistant at Simba Super Market.\n\nI can help you find products, check prices, locate branches, manage your cart & wishlist, and more. What can I do for you today?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const requestSeq = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  //  Group messages for avatar/timestamp display
  const groupedMessages = useMemo(() => {
    return messages.map((msg, idx) => {
      const next = messages[idx + 1];
      const isLastInGroup = !next || next.role !== msg.role || msg.loading;
      return { msg, isLastInGroup, showAvatar: isLastInGroup };
    });
  }, [messages]);

  //  Auto-scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (isNearBottom || loading) {
      setTimeout(
        () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
        60,
      );
    }
  }, [messages.length, loading]);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "instant" });
        inputRef.current?.focus();
      }, 150);
    }
  }, [open]);

  //  Location helper
  const getBrowserLocation = useCallback(
    () =>
      new Promise<{ lat: number; lng: number } | null>((resolve) => {
        if (
          typeof navigator === "undefined" ||
          !navigator.geolocation ||
          !window.isSecureContext
        ) {
          resolve(null);
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (pos) =>
            resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => resolve(null),
          { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 },
        );
      }),
    [],
  );

  //  Send message
  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;
      const currentRequest = ++requestSeq.current;

      const userMsg: Message = {
        id: Date.now().toString() + "u",
        role: "user",
        content: text.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setLoading(true);

      // Get location for branch-related queries
      const needsLocation =
        /branch|branches|location|near me|nearest|nearby|map|address|directions?/i.test(
          text,
        );
      const location = needsLocation ? await getBrowserLocation() : null;

      // Full conversation history (no loading messages, no timestamps)
      const history = [...messages, userMsg]
        .filter((m) => !m.loading)
        .map((m) => ({ role: m.role, content: m.content }));

      try {
        const res = await fetch("/api/agent", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: history,
            ...(location && { location }),
          }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (currentRequest !== requestSeq.current) return;

        // Refresh cart if it was modified
        const cartModified = data.toolResults?.some((tr: any) =>
          ["add_to_cart", "remove_from_cart", "clear_cart"].includes(
            tr.toolName,
          ),
        );
        if (cartModified) {
          qc.invalidateQueries({ queryKey: ["cart"] });
          toast.success("Cart updated!");
        }

        const assistantMsg: Message = {
          id: Date.now().toString() + "a",
          role: "assistant",
          content:
            data.reply ||
            "I'm sorry, I couldn't process that. Please try again.",
          toolResults: data.toolResults,
          timestamp: new Date(),
        };

        setMessages((prev) =>
          prev.filter((m) => !m.loading).concat(assistantMsg),
        );
      } catch (err) {
        if (currentRequest !== requestSeq.current) return;
        setMessages((prev) =>
          prev
            .filter((m) => !m.loading)
            .concat({
              id: Date.now().toString() + "e",
              role: "assistant",
              content:
                "Sorry, I'm having a bit of trouble right now. Please try again in a moment! 🙏",
              timestamp: new Date(),
            }),
        );
      } finally {
        if (currentRequest === requestSeq.current) setLoading(false);
      }
    },
    [getBrowserLocation, loading, messages, qc],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: Date.now().toString(),
        role: "assistant",
        content: "Chat cleared! Fresh start - what can I help you with? 😊",
        timestamp: new Date(),
      },
    ]);
  };

  //  Unread badge (counts messages since chat was closed)
  const [lastSeenCount, setLastSeenCount] = useState(1);
  const unreadCount = open ? 0 : Math.max(0, messages.length - lastSeenCount);
  useEffect(() => {
    if (open) setLastSeenCount(messages.length);
  }, [open, messages.length]);

  return (
    <>
      {/*  Floating trigger button  */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-primary text-white rounded-2xl shadow-xl shadow-primary/25 flex items-center justify-center"
          >
            <Sparkles className="h-5 w-5" />
            {/* Online dot */}
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-background" />
            {/* Unread badge */}
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -left-2 min-w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1"
              >
                {unreadCount}
              </motion.span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/*  Chat window  */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16, originX: 1, originY: 1 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed bottom-6 right-6 z-50 w-[370px] sm:w-[410px] h-[640px] bg-card border border-border/80 rounded-3xl shadow-2xl shadow-black/15 flex flex-col overflow-hidden"
          >
            {/*  Header  */}
            <div className="flex items-center gap-3 px-4 py-3.5 bg-primary text-white shrink-0">
              {/* Bot avatar */}
              <div className="relative">
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                  <Sparkles className="h-4.5 w-4.5 text-white" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-primary" />
              </div>
              {/* Name + status */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm leading-none">
                  Simba Assistant
                </p>
                <p className="text-white/65 text-[11px] mt-0.5">
                  {loading ? "Typing..." : "Online · Simba Super Market"}
                </p>
              </div>
              {/* Actions */}
              <div className="flex items-center gap-0.5">
                <button
                  onClick={clearChat}
                  title="Clear chat"
                  className="p-2 hover:bg-white/15 rounded-xl transition-colors"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 hover:bg-white/15 rounded-xl transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/*  Messages  */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1.5 scroll-smooth"
            >
              <DateDivider date={messages[0]?.timestamp || new Date()} />

              {groupedMessages.map(({ msg, isLastInGroup, showAvatar }) =>
                msg.loading ? (
                  <TypingIndicator key={msg.id} />
                ) : (
                  <MessageBubble
                    key={msg.id}
                    msg={msg}
                    locale={locale}
                    isLastInGroup={isLastInGroup!}
                    showAvatar={showAvatar!}
                  />
                ),
              )}

              {/* Loading bubble */}
              <AnimatePresence>
                {loading && <TypingIndicator key="typing" />}
              </AnimatePresence>

              <div ref={bottomRef} className="h-1" />
            </div>

            {/*  Quick action chips  */}
            <div className="px-3.5 pt-2 pb-1.5 border-t border-border shrink-0">
              <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
                {BASE_QUICK_ACTIONS.map((a) => (
                  <button
                    key={a.label}
                    onClick={() => send(a.message)}
                    disabled={loading}
                    className="shrink-0 text-[11px] font-medium bg-muted hover:bg-primary/10 hover:text-primary border border-border/80 px-2.5 py-1.5 rounded-full transition-all whitespace-nowrap disabled:opacity-40"
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            {/*  Input bar  */}
            <div className="px-3.5 pb-4 pt-2 shrink-0">
              <div className="flex items-center gap-2 bg-muted/50 border border-border rounded-2xl pl-4 pr-2 py-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    loading
                      ? "Simba is typing..."
                      : session?.user
                        ? "Message Simba..."
                        : "Ask about products, branches..."
                  }
                  disabled={loading}
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50 disabled:opacity-50"
                />
                <button
                  onClick={() => send(input)}
                  disabled={!input.trim() || loading}
                  className="w-8 h-8 bg-primary text-white rounded-xl flex items-center justify-center hover:bg-primary/90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
                >
                  {loading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>

              {!session?.user && (
                <p className="text-[10px] text-muted-foreground text-center mt-1.5">
                  <Link
                    href={`/${locale}/auth/sign-in`}
                    className="text-primary hover:underline font-medium"
                    onClick={() => setOpen(false)}
                  >
                    Sign in
                  </Link>{" "}
                  to manage your cart & wishlist
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
