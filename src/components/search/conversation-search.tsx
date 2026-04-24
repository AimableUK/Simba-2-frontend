"use client";
import { useState, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Sparkles,
  X,
  Loader2,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { searchApi } from "@/lib/api";
import { formatPrice, getImageUrl } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

interface SearchResult {
  reply: string;
  products: any[];
}

//  Embedded Google Maps for branch results

function BranchesMap({ branches }: { branches: any[] }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const active = branches[activeIdx];

  if (!branches?.length || !active?.lat) return null;

  const mapsUrl = `https://www.google.com/maps/embed/v1/place?key=AIzaSyB_placeholder&q=${active.lat},${active.lng}&zoom=15`;
  // Use staticmap-style fallback that works without API key
  const staticUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${active.lng - 0.005},${active.lat - 0.005},${active.lng + 0.005},${active.lat + 0.005}&layer=mapnik&marker=${active.lat},${active.lng}`;

  return (
    <div className="mt-3 rounded-xl overflow-hidden border border-border">
      {/* Branch selector tabs */}
      {branches.length > 1 && (
        <div className="flex overflow-x-auto bg-muted/50 border-b border-border">
          {branches.slice(0, 5).map((b, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className={`shrink-0 px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap border-b-2 ${
                activeIdx === i
                  ? "border-primary text-primary bg-background"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {b.name?.replace("Simba Supermarket ", "") || b.address}
            </button>
          ))}
        </div>
      )}

      {/* Map iframe */}
      <div className="relative">
        <iframe
          src={staticUrl}
          width="100%"
          height="200"
          className="block border-0"
          title={active.name}
          loading="lazy"
        />
        <a
          href={`https://www.google.com/maps?q=${active.lat},${active.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-2 right-2 bg-background/90 backdrop-blur border border-border text-xs font-medium px-2.5 py-1.5 rounded-lg flex items-center gap-1 hover:bg-primary hover:text-white hover:border-primary transition-all shadow"
        >
          <ExternalLink className="h-3 w-3" /> Open in Maps
        </a>
      </div>

      {/* Branch info */}
      <div className="p-3 bg-background">
        <p className="font-semibold text-sm">{active.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
          <MapPin className="h-3 w-3 shrink-0" /> {active.address}
        </p>
        {active.phone && (
          <p className="text-xs text-muted-foreground mt-0.5">
            📞 {active.phone}
          </p>
        )}
      </div>
    </div>
  );
}

//  Product grid

function ProductGrid({
  products,
  locale,
}: {
  products: any[];
  locale: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 mt-3">
      {products.slice(0, 6).map((p) => (
        <Link
          key={p.id}
          href={`/${locale}/product/${p.slug}`}
          className="group flex flex-col bg-background border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-all"
        >
          <div className="relative aspect-square bg-muted">
            <Image
              src={getImageUrl(p.images?.[0])}
              alt={p.name}
              fill
              className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
              sizes="140px"
            />
          </div>
          <div className="p-2">
            <p className="text-xs font-medium line-clamp-2 group-hover:text-primary transition-colors leading-tight">
              {p.name}
            </p>
            <p className="text-xs text-primary font-bold mt-1">
              {formatPrice(p.price)}
            </p>
            <p
              className={`text-[10px] mt-0.5 ${p.stock > 0 ? "text-green-600" : "text-destructive"}`}
            >
              {p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}

//  Main component

export function ConversationalSearch({ branchId }: { branchId?: string }) {
  const t = useTranslations("search");
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const EXAMPLES = [
    "Do you have fresh milk?",
    "I need something for breakfast",
    "Where are your branches?",
    "Fresh vegetables",
    "Cold drinks",
  ];

  const handleSearch = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setOpen(true);
    setBranches([]);

    // Check if it's a branch / location query
    const isBranchQuery = /branch|location|kigali|where|address|map/i.test(q);

    try {
      if (isBranchQuery) {
        // Fetch branches from backend
        const API_BASE =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
        const res = await fetch(`${API_BASE}/branches`);
        const data = await res.json();
        setBranches(data || []);
        setResult({
          reply: `Here are all ${data.length} Simba Supermarket branches in Kigali. Click a branch tab to see it on the map.`,
          products: [],
        });
      } else {
        const res = await searchApi.search(q, branchId);
        setResult(res.data);
      }
    } catch {
      setResult({
        reply: "Search is unavailable right now. Please try again.",
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
      setBranches([]);
    }
  };

  const clear = () => {
    setQuery("");
    setResult(null);
    setBranches([]);
    setOpen(false);
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Input */}
      <div className="relative flex items-center">
        <div className="absolute left-4 flex items-center gap-1.5 text-primary pointer-events-none">
          <Sparkles className="h-4 w-4" />
          <span className="text-xs font-semibold hidden sm:block">
            AI Search
          </span>
        </div>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => result && setOpen(true)}
          placeholder={t("placeholder")}
          className="w-full pl-28 pr-24 py-4 rounded-2xl border-2 border-primary/30 bg-background focus:outline-none focus:border-primary text-sm shadow-sm transition-all"
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

      {/* Example chips */}
      {!open && (
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
                {/* AI reply bubble */}
                <div className="flex items-start gap-3 mb-4 p-3 bg-primary/5 border border-primary/20 rounded-xl">
                  <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm text-foreground leading-relaxed">
                    {result.reply}
                  </p>
                </div>

                {/* Branch map */}
                {branches.length > 0 && <BranchesMap branches={branches} />}

                {/* Product results */}
                {result.products.length > 0 && (
                  <>
                    <p className="text-xs text-muted-foreground font-medium mb-2">
                      {t("results", { count: result.products.length })}
                    </p>
                    <ProductGrid products={result.products} locale={locale} />
                  </>
                )}

                {result.products.length === 0 && branches.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {t("noResults")}
                  </p>
                )}

                <button
                  onClick={clear}
                  className="mt-4 w-full text-xs text-muted-foreground hover:text-foreground py-2 border-t border-border transition-colors"
                >
                  Close search
                </button>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
