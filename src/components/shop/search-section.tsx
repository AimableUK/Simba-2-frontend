"use client";

import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";
import { ConversationalSearch } from "../search/conversation-search";

export function SearchSection() {
  const t = useTranslations("search");

  return (
    <section className="py-10 bg-background border-b border-border">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-3">
            <Sparkles className="h-4 w-4" />
            {t("poweredBy")}
          </div>
          <h2 className="text-xl font-bold">{t("title")}</h2>
        </div>
        <ConversationalSearch />
      </div>
    </section>
  );
}
