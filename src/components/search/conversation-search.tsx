"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Sparkles,
  X,
  Loader2,
  MapPin,
  ExternalLink,
  Send,
  Bot,
  User as UserIcon,
  Navigation,
  Phone,
  Clock,
  ChevronUp,
  ChevronDown,
  ShoppingCart,
  Heart,
  Package,
  Tag,
  CheckCheck,
  ShoppingBag,
} from "lucide-react";
import { formatPrice, getImageUrl } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { searchApi } from "@/lib/api";

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

//  Utils

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

//  Product Card

function ProductCard({ p, locale }: { p: any; locale: string }) {
  return (
    <Link
      href={`/${locale}/product/${p.slug}`}
      className="group flex-none w-32 sm:w-36 bg-card border border-border rounded-xl overflow-hidden hover:border-primary/60 hover:shadow-sm transition-all"
    >
      <div className="relative aspect-square bg-muted/60">
        <Image
          src={getImageUrl(p.images?.[0])}
          alt={p.name}
          fill
          className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
          sizes="144px"
        />
        {p.stock === 0 && (
          <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
            <span className="text-[9px] font-bold text-destructive bg-background border border-destructive/30 px-1.5 py-0.5 rounded-full">
              Out of stock
            </span>
          </div>
        )}
      </div>
      <div className="p-2">
        <p className="text-[11px] font-semibold line-clamp-2 leading-tight group-hover:text-primary transition-colors">
          {p.name}
        </p>
        <p className="text-xs text-primary font-bold mt-1.5">
          {formatPrice(p.price)}
        </p>
        {p.stock > 0 && (
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
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
    <div className="mt-2">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory -mx-1 px-1">
        {products.slice(0, 10).map((p) => (
          <div key={p.id} className="snap-start">
            <ProductCard p={p} locale={locale} />
          </div>
        ))}
      </div>
    </div>
  );
}

//  Branch Map

function BranchMapPanel({ branches }: { branches: any[] }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [mapOpen, setMapOpen] = useState(true);

  if (!branches?.length) return null;
  const active = branches[activeIdx];
  const hasCoords =
    Number.isFinite(active?.lat) && Number.isFinite(active?.lng);
  const mapSrc = hasCoords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${active.lng - 0.006},${active.lat - 0.006},${active.lng + 0.006},${active.lat + 0.006}&layer=mapnik&marker=${active.lat},${active.lng}`
    : "";

  return (
    <div className="mt-2 rounded-xl border border-border bg-background overflow-hidden">
      {/* Branch grid */}
      <div className="p-2 grid grid-cols-2 gap-1.5">
        {branches.map((b, i) => (
          <button
            key={b.slug || b.id || i}
            onClick={() => {
              setActiveIdx(i);
              setMapOpen(true);
            }}
            className={`text-left px-2.5 py-2 rounded-lg border text-xs transition-all ${
              activeIdx === i
                ? "border-primary bg-primary/8 text-primary"
                : "border-border hover:border-primary/40 text-muted-foreground"
            }`}
          >
            <p className="font-semibold truncate">
              {b.name?.replace("Simba Supermarket ", "").replace("Simba ", "")}
            </p>
            <p className="text-[10px] mt-0.5 opacity-70">
              {b.district || b.address?.split(",")[0]}
            </p>
            {b.distanceKm != null && (
              <p className="text-[10px] mt-0.5 text-primary/80 font-medium">
                {b.distanceKm} km · ~{b.drivingMinutes}min
              </p>
            )}
            {b.isOpenNow != null && (
              <span
                className={`inline-block text-[9px] font-bold mt-0.5 px-1.5 py-px rounded-full ${
                  b.isOpenNow
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {b.isOpenNow ? "Open" : "Closed"}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Map toggle */}
      <button
        onClick={() => setMapOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 border-t border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors font-medium"
      >
        <span className="flex items-center gap-1.5">
          <MapPin className="h-3 w-3" />
          {active?.name?.replace("Simba Supermarket ", "") || "View map"}
        </span>
        {mapOpen ? (
          <ChevronUp className="h-3.5 w-3.5" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5" />
        )}
      </button>

      <AnimatePresence>
        {mapOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            {hasCoords ? (
              <iframe
                key={`${active?.slug}-${activeIdx}`}
                src={mapSrc}
                width="100%"
                height="190"
                className="block border-0 w-full"
                title={`Map: ${active?.name}`}
                loading="lazy"
                referrerPolicy="no-referrer"
                allowFullScreen
              />
            ) : (
              <div className="h-[100px] flex items-center justify-center text-xs text-muted-foreground border-t border-border">
                No coordinates available
              </div>
            )}

            {/* Footer */}
            <div className="p-2.5 border-t border-border flex items-center justify-between gap-2">
              <div className="min-w-0">
                {active?.phone && (
                  <a
                    href={`tel:${active.phone}`}
                    className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    <Phone className="h-3 w-3 shrink-0" />
                    {active.phone}
                  </a>
                )}
                {active?.hours && (
                  <p className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                    <Clock className="h-2.5 w-2.5" />
                    {active.hours}
                  </p>
                )}
              </div>
              <div className="flex gap-1.5 shrink-0">
                {active?.directionsUrl && (
                  <a
                    href={active.directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[11px] bg-muted border border-border px-2.5 py-1.5 rounded-lg hover:bg-muted/80 transition-colors font-medium"
                  >
                    <Navigation className="h-3 w-3" />
                    Directions
                  </a>
                )}
                {hasCoords && (
                  <a
                    href={`https://www.google.com/maps?q=${active.lat},${active.lng}`}
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

//  Nearest Branch

function NearestBranchCard({ data }: { data: any }) {
  const branch = data?.nearest;
  if (!branch) return null;
  const hasCoords = Number.isFinite(branch.lat) && Number.isFinite(branch.lng);

  return (
    <div className="mt-2 rounded-xl border border-primary/30 bg-primary/5 overflow-hidden">
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-bold">
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
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {branch.isOpenNow ? "Open" : "Closed"}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
          {branch.distanceKm != null && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-primary" />
              {branch.distanceKm} km
            </span>
          )}
          {branch.drivingMinutes != null && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />~{branch.drivingMinutes} min drive
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-2.5">
          {branch.directionsUrl && (
            <a
              href={branch.directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              <Navigation className="h-3 w-3" />
              Directions
            </a>
          )}
          {branch.phone && (
            <a
              href={`tel:${branch.phone}`}
              className="flex items-center gap-1.5 text-xs border border-border bg-background px-3 py-1.5 rounded-lg hover:border-primary/40 transition-colors"
            >
              <Phone className="h-3 w-3" />
              Call
            </a>
          )}
        </div>
      </div>
      {hasCoords && (
        <iframe
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${branch.lng - 0.005},${branch.lat - 0.005},${branch.lng + 0.005},${branch.lat + 0.005}&layer=mapnik&marker=${branch.lat},${branch.lng}`}
          width="100%"
          height="160"
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

//  Cart / Wishlist

function CartDisplay({ cart }: { cart: any }) {
  if (!cart?.items?.length)
    return (
      <div className="mt-2 border border-border rounded-xl p-3 text-center">
        <ShoppingBag className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
        <p className="text-xs text-muted-foreground">Cart is empty</p>
      </div>
    );
  return (
    <div className="mt-2 border border-border rounded-xl overflow-hidden">
      <div className="px-3 py-2 border-b border-border flex items-center justify-between">
        <span className="text-xs font-bold flex items-center gap-1.5">
          <ShoppingCart className="h-3.5 w-3.5 text-primary" />
          Cart · {cart.items.length} items
        </span>
        <span className="text-xs text-primary font-bold">
          {formatPrice(cart.total)}
        </span>
      </div>
      <div className="divide-y divide-border max-h-36 overflow-y-auto">
        {cart.items.map((item: any) => (
          <div
            key={item.productId}
            className="px-3 py-2 flex items-center justify-between gap-2 text-xs"
          >
            <p className="font-medium truncate flex-1">{item.name}</p>
            <span className="text-muted-foreground">×{item.quantity}</span>
            <span className="font-bold text-primary">
              {formatPrice(item.subtotal)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function WishlistDisplay({ items }: { items: any[] }) {
  if (!items?.length)
    return (
      <div className="mt-2 border border-border rounded-xl p-3 text-center">
        <Heart className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
        <p className="text-xs text-muted-foreground">Wishlist is empty</p>
      </div>
    );
  return (
    <div className="mt-2 border border-border rounded-xl overflow-hidden">
      <div className="px-3 py-2 border-b border-border">
        <span className="text-xs font-bold flex items-center gap-1.5">
          <Heart className="h-3.5 w-3.5 text-rose-500" />
          Wishlist · {items.length} items
        </span>
      </div>
      <div className="divide-y divide-border max-h-36 overflow-y-auto">
        {items.map((item: any) => (
          <div
            key={item.productId}
            className="px-3 py-2 flex items-center gap-2"
          >
            <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-muted shrink-0">
              <Image
                src={getImageUrl(item.images?.[0])}
                alt={item.name || ""}
                fill
                className="object-contain p-0.5"
                sizes="32px"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium truncate">{item.name}</p>
              <p className="text-xs text-primary font-bold">
                {formatPrice(item.price)}
              </p>
            </div>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                item.inStock
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {item.inStock ? "In stock" : "Out"}
            </span>
          </div>
        ))}
      </div>
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

  // Deduplicate: keep only the LAST result per toolName so we never render
  // duplicate product grids when the AI retried the same tool call.
  const dedupedMap = new Map<string, ToolResult>();
  for (const tr of toolResults) {
    dedupedMap.set(tr.toolName, tr); // later entries overwrite earlier ones
  }
  const deduped = Array.from(dedupedMap.values());

  return (
    <div className="space-y-1.5 mt-0.5">
      {deduped.map((tr, i) => {
        const r = tr.result;

        if (tr.toolName === "get_products" && r.products?.length)
          return (
            <ProductScroll key={i} products={r.products} locale={locale} />
          );

        if (tr.toolName === "get_branches" && r.branches?.length)
          return <BranchMapPanel key={i} branches={r.branches} />;

        if (tr.toolName === "find_nearest_branch")
          return <NearestBranchCard key={i} data={r} />;

        if (tr.toolName === "get_cart") return <CartDisplay key={i} cart={r} />;

        if (tr.toolName === "get_wishlist")
          return <WishlistDisplay key={i} items={r.items || []} />;

        if (tr.toolName === "get_promotions" && r.promotions?.length)
          return (
            <div key={i} className="mt-2 space-y-1.5">
              {r.promotions.map((promo: any, j: number) => (
                <div
                  key={j}
                  className="px-3 py-2.5 rounded-xl border border-primary/20 bg-primary/5"
                >
                  <div className="flex items-center gap-2">
                    <Tag className="h-3.5 w-3.5 text-primary shrink-0" />
                    <p className="text-xs font-bold">{promo.title}</p>
                    {promo.discountPercent && (
                      <span className="ml-auto text-[10px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                        -{promo.discountPercent}%
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {promo.description}
                  </p>
                </div>
              ))}
            </div>
          );

        if (tr.toolName === "check_branch_stock" && r.productName)
          return (
            <div
              key={i}
              className={`mt-2 flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-xs font-medium ${
                r.available
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-300"
                  : "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300"
              }`}
            >
              <Package className="h-3.5 w-3.5 shrink-0" />
              <span>
                <strong>{r.productName}</strong>{" "}
                {r.available
                  ? `available at ${r.branchName} (${r.stock} units)`
                  : `out of stock at ${r.branchName}`}
              </span>
            </div>
          );

        if (tr.toolName === "add_to_cart" && !r.success)
          return (
            <p key={i} className="text-xs text-destructive mt-1">
              ⚠ {r.error}
            </p>
          );

        return null;
      })}
    </div>
  );
}

//  Typing Indicator

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
        <Bot className="h-3 w-3 text-white" />
      </div>
      <div className="px-3.5 py-2.5 bg-muted/70 border border-border/60 rounded-xl rounded-bl-sm">
        <div className="flex items-center gap-1">
          {[0, 0.2, 0.4].map((delay, i) => (
            <motion.span
              key={i}
              animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
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
    </div>
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
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={`flex items-end gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar */}
      <div className="w-6 shrink-0 mb-0.5">
        {showAvatar && !isUser && (
          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
            <Bot className="h-3 w-3 text-white" />
          </div>
        )}
        {showAvatar && isUser && (
          <div className="w-6 h-6 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center">
            <UserIcon className="h-3 w-3 text-primary" />
          </div>
        )}
      </div>

      {/* Content */}
      <div
        className={`flex flex-col gap-1 min-w-0 ${
          isUser ? "items-end max-w-[76%]" : "items-start max-w-[82%]"
        }`}
      >
        <div
          className={`px-3.5 py-2.5 text-sm leading-relaxed break-words ${
            isUser
              ? "bg-primary text-primary-foreground rounded-2xl rounded-br-[5px]"
              : "bg-muted/70 border border-border/60 text-foreground rounded-2xl rounded-bl-[5px]"
          }`}
        >
          <p className="whitespace-pre-wrap">{msg.content}</p>
        </div>

        {!isUser && msg.toolResults && (
          <div className="w-full max-w-full">
            <ToolResultRenderer toolResults={msg.toolResults} locale={locale} />
          </div>
        )}

        {isLastInGroup && (
          <div
            className={`flex items-center gap-1 px-0.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
          >
            <span className="text-[10px] text-muted-foreground/50">
              {formatTime(msg.timestamp)}
            </span>
            {isUser && <CheckCheck className="h-2.5 w-2.5 text-primary/40" />}
          </div>
        )}
      </div>
    </motion.div>
  );
}

//  Suggestion Chips

const SUGGESTIONS = [
  "Fresh milk under 700 RWF",
  "Nearest branch",
  "Cheapest juice",
  "Breakfast items",
  "Promotions",
  "Vegetables",
];

//  Main Component

export function ConversationalSearch({ branchId }: { branchId?: string }) {
  const t = useTranslations("search");
  const locale = useLocale();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const requestSeq = useRef(0);

  //  Group messages for avatar/timestamp logic
  const groupedMessages = useMemo(() => {
    return messages.map((msg, idx) => {
      const next = messages[idx + 1];
      const isLastInGroup = !next || next.role !== msg.role || msg.loading;
      return { msg, isLastInGroup, showAvatar: isLastInGroup };
    });
  }, [messages]);

  //  Auto-scroll — scrolls ONLY the chat panel, never the page
  const scrollToBottom = useCallback((smooth = true) => {
    const el = scrollRef.current;
    if (!el) return;
    // Use scrollTop on the container — never scrollIntoView which moves the page
    el.scrollTo({
      top: el.scrollHeight,
      behavior: smooth ? "smooth" : "instant",
    });
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => scrollToBottom(true), 60);
  }, [messages.length, loading, open, scrollToBottom]);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        scrollToBottom(false); // instant on open
        inputRef.current?.focus();
      }, 150);
    }
  }, [open, scrollToBottom]);

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

  //  Send
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
      setOpen(true);

      const needsLocation =
        /branch|branches|location|near me|nearest|nearby|map|address|directions?/i.test(
          text,
        );
      const location = needsLocation ? await getBrowserLocation() : null;

      // Build full history then trim to last 12 turns to prevent Groq 400 context overflow
      const fullHistory = [...messages, userMsg]
        .filter((m) => !m.loading)
        .map((m) => ({ role: m.role, content: m.content }));
      const trimmedHistory = fullHistory.slice(-12);

      try {
        // Use the agent route so we get full multi-turn AI + tools
        const res = await fetch("/api/agent", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: trimmedHistory,
            ...(branchId && { branchId }),
            ...(location && { location }),
          }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (currentRequest !== requestSeq.current) return;

        const assistantMsg: Message = {
          id: Date.now().toString() + "a",
          role: "assistant",
          content:
            data.reply || "Sorry, I couldn't process that. Please try again.",
          toolResults: data.toolResults,
          timestamp: new Date(),
        };

        setMessages((prev) =>
          prev.filter((m) => !m.loading).concat(assistantMsg),
        );
      } catch {
        if (currentRequest !== requestSeq.current) return;
        setMessages((prev) =>
          prev
            .filter((m) => !m.loading)
            .concat({
              id: Date.now().toString() + "e",
              role: "assistant",
              content:
                "Sorry, I'm having trouble connecting. Please try again!",
              timestamp: new Date(),
            }),
        );
      } finally {
        if (currentRequest === requestSeq.current) setLoading(false);
      }
    },
    [branchId, getBrowserLocation, loading, messages],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      send(input);
    }
    if (e.key === "Escape") setOpen(false);
  };

  const clear = () => {
    setMessages([]);
    setInput("");
    setOpen(false);
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/*  Search bar  */}
      <div className="relative flex items-center">
        <div className="absolute left-4 flex items-center gap-1.5 pointer-events-none">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold text-primary hidden sm:block">
            AI Search
          </span>
        </div>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => hasMessages && setOpen(true)}
          placeholder={t("placeholder")}
          className="w-full pl-28 pr-14 py-4 rounded-2xl border-2 border-primary/25 bg-background focus:outline-none focus:border-primary text-sm shadow-sm transition-all placeholder:text-muted-foreground/60"
        />
        {hasMessages && (
          <button
            onClick={clear}
            className="absolute right-14 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={() => {
            if (input.trim()) send(input);
            else setOpen((v) => !v);
          }}
          disabled={loading}
          className="absolute right-2 bg-primary text-primary-foreground p-2.5 rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all active:scale-95"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>

      {/*  Suggestion chips (when no history yet)  */}
      {!hasMessages && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-2 mt-3"
        >
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="text-xs bg-muted hover:bg-primary/10 hover:text-primary border border-border px-3 py-1.5 rounded-full transition-all"
            >
              {s}
            </button>
          ))}
        </motion.div>
      )}

      {/*  Chat panel  */}
      <AnimatePresence>
        {open && hasMessages && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-2xl shadow-black/10 z-50 flex flex-col overflow-hidden"
            style={{ maxHeight: "82vh" }}
          >
            {/* Panel header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <Sparkles className="h-3 w-3 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold leading-none">
                    Simba AI Search
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {loading
                      ? "Typing..."
                      : `${messages.filter((m) => m.role === "assistant").length} replies`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-4 py-4 space-y-2 scroll-smooth min-h-[120px]"
            >
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
              <AnimatePresence>
                {loading && <TypingIndicator key="typing" />}
              </AnimatePresence>
              <div aria-hidden className="h-2" />
            </div>

            {/* Inline input (so user can continue chatting without dismissing) */}
            <div className="px-3.5 py-3 border-t border-border bg-background/50 shrink-0">
              <div className="flex items-center gap-2 bg-muted/50 border border-border rounded-xl pl-3.5 pr-2 py-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 transition-all">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={loading ? "Simba is typing..." : "Follow up..."}
                  disabled={loading}
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50 disabled:opacity-50"
                />
                <button
                  onClick={() => send(input)}
                  disabled={!input.trim() || loading}
                  className="w-7 h-7 bg-primary text-white rounded-lg flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shrink-0"
                >
                  {loading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Send className="h-3 w-3" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
