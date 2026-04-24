"use client";

import { Globe } from "lucide-react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const LOCALES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "rw", label: "Kinyarwanda", flag: "🇷🇼" },
  { code: "sw", label: "Kiswahili", flag: "🇹🇿" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
];

const LanguageSwitcherV1 = ({
  userOpen,
  setUserOpen,
}: {
  userOpen?: boolean;
  setUserOpen?: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();

  const [langOpen, setLangOpen] = useState(false);

  const switchLocale = (newLocale: string) => {
    setLangOpen(false);
    const segments = pathname.split("/");
    segments[1] = newLocale;
    router.push(segments.join("/"));
  };

  return (
    <>
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
                    locale === l.code && "text-primary font-semibold bg-accent",
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

      {/* Click outside to close dropdowns */}
      {(langOpen || userOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setLangOpen(false);
            setUserOpen?.(false);
          }}
        />
      )}
    </>
  );
};

export default LanguageSwitcherV1;
