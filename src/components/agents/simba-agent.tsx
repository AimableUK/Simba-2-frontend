"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useLocale } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  ShoppingCart,
  MapPin,
  Star,
  Heart,
  Trash2,
  Plus,
  Minus,
  Bot,
  User as UserIcon,
  Sparkles,
  ChevronDown,
  Package,
  RefreshCw,
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
}

interface ToolResult {
  toolName: string;
  args: any;
  result: any;
}

//  Tool result renderers

function ProductGrid({
  products,
  locale,
}: {
  products: any[];
  locale: string;
}) {
  if (!products?.length) return null;
  return (
    <div className="grid grid-cols-2 gap-2 mt-3">
      {products.slice(0, 6).map((p) => (
        <Link
          key={p.id}
          href={`/${locale}/product/${p.slug}`}
          className="group bg-background border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-all"
        >
          <div className="relative aspect-square bg-muted">
            <Image
              src={getImageUrl(p.images?.[0])}
              alt={p.name}
              fill
              className="object-contain p-2"
              sizes="120px"
            />
          </div>
          <div className="p-2">
            <p className="text-xs font-medium line-clamp-1 group-hover:text-primary transition-colors">
              {p.name}
            </p>
            <p className="text-xs text-primary font-bold mt-0.5">
              {formatPrice(p.price)}
            </p>
            <p
              className={`text-[10px] mt-0.5 ${p.stock > 0 ? "text-green-600 dark:text-green-400" : "text-destructive"}`}
            >
              {p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}

function BranchMap({ branches }: { branches: any[] }) {
  if (!branches?.length) return null;
  return (
    <div className="mt-3 space-y-2">
      {branches.map((b) => (
        <div
          key={b.slug}
          className="bg-background border border-border rounded-xl p-3 flex items-start gap-3"
        >
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
            <MapPin className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-xs">
              {b.name?.replace("Simba Supermarket ", "")}
            </p>
            <p className="text-[11px] text-muted-foreground">{b.address}</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[10px] text-muted-foreground">
                {b.hours}
              </span>
              {b.rating > 0 && (
                <span className="flex items-center gap-0.5 text-[10px]">
                  <Star className="h-2.5 w-2.5 fill-primary text-primary" />
                  {b.rating.toFixed(1)}
                </span>
              )}
              {b.lat && b.lng && (
                <a
                  href={`https://www.google.com/maps?q=${b.lat},${b.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-primary hover:underline"
                >
                  Open map ↗
                </a>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CartDisplay({ cart }: { cart: any }) {
  if (!cart?.items?.length)
    return (
      <div className="mt-2 bg-background border border-border rounded-xl p-3 text-center">
        <ShoppingCart className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
        <p className="text-xs text-muted-foreground">Your cart is empty</p>
      </div>
    );
  return (
    <div className="mt-2 bg-background border border-border rounded-xl overflow-hidden">
      <div className="px-3 py-2 border-b border-border flex items-center justify-between">
        <span className="text-xs font-semibold">
          Your Cart ({cart.items.length} items)
        </span>
        <span className="text-xs text-primary font-bold">
          {formatPrice(cart.total)}
        </span>
      </div>
      <div className="divide-y divide-border max-h-40 overflow-y-auto">
        {cart.items.map((item: any) => (
          <div
            key={item.productId}
            className="px-3 py-2 flex items-center justify-between gap-2"
          >
            <p className="text-xs font-medium truncate flex-1">{item.name}</p>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] text-muted-foreground">
                x{item.quantity}
              </span>
              <span className="text-xs font-bold text-primary">
                {formatPrice(item.subtotal)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WishlistDisplay({ items }: { items: any[] }) {
  if (!items?.length)
    return (
      <div className="mt-2 bg-background border border-border rounded-xl p-3 text-center">
        <Heart className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
        <p className="text-xs text-muted-foreground">Your wishlist is empty</p>
      </div>
    );
  return (
    <div className="mt-2 bg-background border border-border rounded-xl overflow-hidden">
      <div className="px-3 py-2 border-b border-border">
        <span className="text-xs font-semibold">
          Wishlist ({items.length} items)
        </span>
      </div>
      <div className="divide-y divide-border max-h-40 overflow-y-auto">
        {items.map((item: any) => (
          <div
            key={item.productId}
            className="px-3 py-2 flex items-center gap-2"
          >
            <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-muted shrink-0">
              <Image
                src={getImageUrl(item.images?.[0])}
                alt={item.name}
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
              className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${item.inStock ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30"}`}
            >
              {item.inStock ? "In stock" : "Out of stock"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ToolResultRenderer({
  toolResults,
  locale,
}: {
  toolResults: ToolResult[];
  locale: string;
}) {
  if (!toolResults?.length) return null;

  return (
    <div className="space-y-1">
      {toolResults.map((tr, i) => {
        const r = tr.result;

        if (tr.toolName === "get_products" && r.products?.length) {
          return <ProductGrid key={i} products={r.products} locale={locale} />;
        }
        if (tr.toolName === "get_branches" && r.branches?.length) {
          return <BranchMap key={i} branches={r.branches} />;
        }
        if (tr.toolName === "get_cart") {
          return <CartDisplay key={i} cart={r} />;
        }
        if (tr.toolName === "get_wishlist") {
          return <WishlistDisplay key={i} items={r.items || []} />;
        }
        if (tr.toolName === "add_to_cart") {
          if (r.success) return null; // silent success
          return (
            <p key={i} className="text-xs text-destructive mt-1">
              {r.error}
            </p>
          );
        }
        return null;
      })}
    </div>
  );
}

//  Message bubble

function MessageBubble({ msg, locale }: { msg: Message; locale: string }) {
  const isUser = msg.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
          isUser ? "bg-primary/10" : "bg-primary"
        }`}
      >
        {isUser ? (
          <UserIcon className="h-3.5 w-3.5 text-primary" />
        ) : (
          <Bot className="h-3.5 w-3.5 text-white" />
        )}
      </div>

      {/* Content */}
      <div
        className={`max-w-[85%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}
      >
        <div
          className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-sm"
              : "bg-muted/60 text-foreground rounded-tl-sm"
          }`}
        >
          {msg.loading ? (
            <div className="flex items-center gap-1.5 py-0.5">
              {[0, 0.15, 0.3].map((delay, i) => (
                <motion.div
                  key={i}
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay }}
                  className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full"
                />
              ))}
            </div>
          ) : (
            <p className="whitespace-pre-wrap">{msg.content}</p>
          )}
        </div>

        {/* Tool results rendered below the bubble */}
        {!isUser && msg.toolResults && (
          <div className="w-full">
            <ToolResultRenderer toolResults={msg.toolResults} locale={locale} />
          </div>
        )}
      </div>
    </motion.div>
  );
}

//  Quick action chips

const QUICK_ACTIONS = [
  { label: "🛒 My cart", message: "Show me my cart" },
  { label: "❤️ My wishlist", message: "Show my wishlist" },
  { label: "📍 Branches", message: "Where are your branches in Kigali?" },
  { label: "🥛 Fresh items", message: "What fresh products do you have?" },
  {
    label: "➕ Wishlist → Cart",
    message: "Add all my wishlist items to my cart",
  },
];

//  Main Agent component

export function SimbaAgent() {
  const locale = useLocale();
  const { data: session } = useSession();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "0",
      role: "assistant",
      content: `Hi! 👋 I'm Simba, your shopping assistant. I can help you find products, check your cart & wishlist, show branches, and more.\n\nWhat can I do for you today?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        inputRef.current?.focus();
      }, 100);
    }
  }, [open, messages.length]);

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;

      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content: text,
      };
      const loadingMsg: Message = {
        id: Date.now().toString() + "l",
        role: "assistant",
        content: "",
        loading: true,
      };

      setMessages((prev) => [...prev, userMsg, loadingMsg]);
      setInput("");
      setLoading(true);

      // Build history for API (exclude loading messages)
      const history = [...messages, userMsg]
        .filter((m) => !m.loading)
        .map((m) => ({ role: m.role, content: m.content }));

      try {
        // Use credentials:'include' so the Next.js API route receives all cookies
        // and can forward them to the backend for auth
        const res = await fetch("/api/agent", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history }),
        });

        const data = await res.json();

        // If cart was modified, refresh cart query
        const cartModified = data.toolResults?.some((tr: any) =>
          ["add_to_cart", "remove_from_cart", "clear_cart"].includes(
            tr.toolName,
          ),
        );
        if (cartModified) {
          qc.invalidateQueries({ queryKey: ["cart"] });
        }

        const assistantMsg: Message = {
          id: Date.now().toString() + "a",
          role: "assistant",
          content:
            data.reply ||
            "I'm sorry, I couldn't process that. Please try again.",
          toolResults: data.toolResults,
        };

        setMessages((prev) =>
          prev.filter((m) => !m.loading).concat(assistantMsg),
        );
      } catch {
        setMessages((prev) =>
          prev
            .filter((m) => !m.loading)
            .concat({
              id: Date.now().toString() + "e",
              role: "assistant",
              content:
                "Sorry, I'm having trouble connecting. Please try again in a moment.",
            }),
        );
      } finally {
        setLoading(false);
      }
    },
    [loading, messages, qc],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
        content: "Chat cleared! How can I help you? 😊",
      },
    ]);
  };

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-primary text-white rounded-2xl shadow-lg shadow-primary/30 flex items-center justify-center"
          >
            <Bot className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-background" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-50 w-[360px] sm:w-[400px] h-[600px] bg-card border border-border rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 bg-primary text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-bold text-sm leading-none">
                    Simba Assistant
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                    <span className="text-white/70 text-[11px]">
                      Online · Powered by AI
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={clearChat}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                  title="Clear chat"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-4">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} locale={locale} />
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Quick actions */}
            <div className="px-3.5 py-2 border-t border-border shrink-0">
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                {QUICK_ACTIONS.map((a) => (
                  <button
                    key={a.label}
                    onClick={() => send(a.message)}
                    disabled={loading}
                    className="shrink-0 text-[11px] font-medium bg-muted hover:bg-primary/10 hover:text-primary border border-border px-2.5 py-1.5 rounded-full transition-colors whitespace-nowrap disabled:opacity-40"
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="px-3.5 pb-4 pt-2 shrink-0">
              <div className="flex items-center gap-2 bg-muted/50 border border-border rounded-2xl px-4 py-2.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    session?.user
                      ? "Ask me anything..."
                      : "Ask about products, branches..."
                  }
                  disabled={loading}
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60 disabled:opacity-50"
                />
                <button
                  onClick={() => send(input)}
                  disabled={!input.trim() || loading}
                  className="w-8 h-8 bg-primary text-white rounded-xl flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
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
