"use client";
import { useState, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Sparkles, X, Loader2 } from "lucide-react";
import { searchApi } from "@/lib/api";
import { formatPrice, getImageUrl } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

interface SearchResult {
  reply: string;
  products: any[];
}

export function ConversationalSearch({ branchId }: { branchId?: string }) {
  const t = useTranslations("search");
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const EXAMPLES = [
    "Do you have fresh milk?",
    "I need something for breakfast",
    "Cold drinks please",
    "Fresh vegetables",
  ];

  const handleSearch = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setOpen(true);
    try {
      const res = await searchApi.search(q, branchId);
      setResult(res.data);
    } catch {
      setResult({
        reply: "Sorry, search is unavailable right now.",
        products: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch(query);
    if (e.key === "Escape") {
      setOpen(false);
      setResult(null);
    }
  };

  const clear = () => {
    setQuery("");
    setResult(null);
    setOpen(false);
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Search Input */}
      <div className="relative flex items-center">
        <div className="absolute left-4 flex items-center gap-1.5 text-primary">
          <Sparkles className="h-4 w-4" />
          <span className="text-xs font-semibold hidden sm:block">
            {t("poweredBy")}
          </span>
        </div>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => result && setOpen(true)}
          placeholder={t("placeholder")}
          className="w-full pl-32 pr-24 py-4 rounded-2xl border-2 border-primary/30 bg-background focus:outline-none focus:border-primary text-sm shadow-sm transition-all"
        />
        {query && (
          <button
            onClick={clear}
            className="absolute right-14 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={() => handleSearch(query)}
          disabled={loading || !query.trim()}
          className="absolute right-2 bg-primary text-primary-foreground p-2.5 rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Example queries */}
      {!open && !result && (
        <div className="flex flex-wrap gap-2 mt-3">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => {
                setQuery(ex);
                handleSearch(ex);
              }}
              className="text-xs bg-muted hover:bg-primary/10 hover:text-primary px-3 py-1.5 rounded-full transition-colors border border-border"
            >
              {ex}
            </button>
          ))}
        </div>
      )}

      {/* Results dropdown */}
      <AnimatePresence>
        {open && (result || loading) && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-xl z-50 overflow-hidden max-h-[80vh] overflow-y-auto"
          >
            {loading ? (
              <div className="flex items-center gap-3 p-6 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span>{t("searching")}</span>
              </div>
            ) : result ? (
              <div className="p-4">
                {/* AI reply */}
                <div className="flex items-start gap-3 mb-4 p-3 bg-primary/5 border border-primary/20 rounded-xl">
                  <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm text-foreground leading-relaxed">
                    {result.reply}
                  </p>
                </div>

                {result.products.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {t("noResults")}
                  </p>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground mb-3 font-medium">
                      {t("results", { count: result.products.length })}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {result.products.slice(0, 6).map((product: any) => (
                        <Link
                          key={product.id}
                          href={`/${locale}/product/${product.slug}`}
                          onClick={clear}
                          className="flex flex-col gap-2 p-2 rounded-xl border border-border hover:border-primary/40 hover:bg-muted/30 transition-all"
                        >
                          <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                            <Image
                              src={getImageUrl(product.images?.[0])}
                              alt={product.name}
                              fill
                              className="object-contain p-1"
                              sizes="120px"
                            />
                          </div>
                          <div>
                            <p className="text-xs font-medium line-clamp-2 leading-tight">
                              {product.name}
                            </p>
                            <p className="text-xs text-primary font-bold mt-0.5">
                              {formatPrice(product.price)}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
