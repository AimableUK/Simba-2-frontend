"use client";

import { useState } from "react";
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
import { formatPrice, getImageUrl } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { searchApi } from "@/lib/api";

interface SearchResult {
  reply: string;
  products: any[];
  branches?: any[];
}

//  Map embed
function BranchMap({ branch }: { branch: any }) {
  if (!branch?.lat || !branch?.lng)
    return (
      <div className="h-[200px] bg-muted rounded-xl flex items-center justify-center border border-border mt-1">
        <div className="text-center">
          <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">
            No coordinates available
          </p>
        </div>
      </div>
    );

  // Use OSM without sandbox restriction so tiles can load
  const bbox = `${branch.lng - 0.005},${branch.lat - 0.005},${branch.lng + 0.005},${branch.lat + 0.005}`;
  const osmSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${branch.lat},${branch.lng}`;

  return (
    <div className="mt-2 rounded-xl overflow-hidden border border-border">
      <iframe
        key={branch.slug}
        src={osmSrc}
        width="100%"
        height="220"
        className="block border-0 w-full"
        title={`Map: ${branch.name}`}
        loading="lazy"
        referrerPolicy="no-referrer"
        allowFullScreen
      />
      <div className="p-3 bg-background flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate">{branch.name}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{branch.address}</span>
          </p>
        </div>
        <a
          href={`https://www.google.com/maps?q=${branch.lat},${branch.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 flex items-center gap-1.5 text-xs bg-primary text-primary-foreground px-3 py-2 rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          <ExternalLink className="h-3 w-3" /> Google Maps
        </a>
      </div>
    </div>
  );
}

function BranchesPanel({ branches }: { branches: any[] }) {
  const [activeIdx, setActiveIdx] = useState(0);
  if (!branches.length) return null;
  return (
    <div className="mt-3">
      {/* Branch list */}
      <div className="grid grid-cols-2 gap-1.5 mb-3">
        {branches.map((b, i) => (
          <button
            key={b.slug}
            onClick={() => setActiveIdx(i)}
            className={`text-left p-2.5 rounded-xl border text-xs transition-all ${
              activeIdx === i
                ? "border-primary bg-primary/5 text-primary"
                : "border-border hover:border-primary/40 text-muted-foreground hover:text-foreground"
            }`}
          >
            <p className="font-medium truncate">
              {b.name.replace("Simba Supermarket ", "")}
            </p>
            <p className="text-[10px] mt-0.5 opacity-70">{b.district}</p>
          </button>
        ))}
      </div>
      {/* Map of selected branch */}
      <BranchMap branch={branches[activeIdx]} />
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

export function ConversationalSearch({ branchId }: { branchId?: string }) {
  const t = useTranslations("search");
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const EXAMPLES = [
    "Fresh milk",
    "Where are your branches?",
    "Branches near me",
    "Cold drinks",
    "Breakfast items",
    "Vegetables",
  ];

  const getBrowserLocation = () =>
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
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }),
        () => resolve(null),
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 },
      );
    });

  const handleSearch = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setOpen(true);
    setBranches([]);
    setResult(null);

    const isBranchQuery =
      /branch|branches|location|kigali|where|address|map|near me|nearest|nearby/i.test(
        q,
      );

    try {
      const location =
        isBranchQuery &&
        /near me|nearest|nearby/i.test(q)
          ? await getBrowserLocation()
          : null;
      const response = await searchApi.search(q, {
        branchId,
        ...(location || {}),
      });
      const data = response.data || {};
      const list = Array.isArray(data.branches) ? data.branches : [];
      const products = Array.isArray(data.products) ? data.products : [];

      setBranches(list);
      setResult({
        reply:
          data.reply ||
          (list.length
            ? `Here are ${list.length} Simba Supermarket branches.`
            : products.length
              ? `Found ${products.length} product${products.length === 1 ? "" : "s"} for "${q}".`
              : `No results found for "${q}".`),
        products,
        branches: list,
      });
    } catch (err: any) {
      console.error("Search error:", err);
      setResult({
        reply: `Search error: ${err.message}. Please try again.`,
        products: [],
      });
    } finally {
      setLoading(false);
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
      <div className="relative flex items-center">
        <div className="absolute left-4 flex items-center gap-1.5 text-primary pointer-events-none">
          <Sparkles className="h-4 w-4" />
          <span className="text-xs font-semibold hidden sm:block">Search</span>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch(query);
            if (e.key === "Escape") clear();
          }}
          placeholder={t("placeholder")}
          className="w-full pl-24 pr-14 py-4 rounded-2xl border-2 border-primary/30 bg-background focus:outline-none focus:border-primary text-sm shadow-sm transition-all"
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

      {/* Results */}
      <AnimatePresence>
        {open && (result || loading) && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-xl z-50"
            style={{
              maxHeight: "85vh",
              overflowY: "auto",
              overflowX: "hidden",
            }}
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

                {/* Branches with maps */}
                {(result.branches?.length || branches.length) > 0 && (
                  <BranchesPanel branches={result.branches || branches} />
                )}

                {/* Products */}
                {result.products.length > 0 && (
                  <>
                    <p className="text-xs text-muted-foreground font-medium mb-2 mt-1">
                      {result.products.length} result
                      {result.products.length !== 1 ? "s" : ""}
                    </p>
                    <ProductGrid products={result.products} locale={locale} />
                  </>
                )}

                <button
                  onClick={clear}
                  className="mt-4 w-full text-xs text-muted-foreground hover:text-foreground py-2 border-t border-border transition-colors"
                >
                  Close
                </button>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
