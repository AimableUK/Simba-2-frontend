"use client";

import { useLocale, useTranslations } from "next-intl";
import { motion, useInView, type Variants } from "framer-motion";
import { useRef, useState } from "react";
import {
  ScrollText,
  ChevronRight,
  ShoppingBag,
  CreditCard,
  Shield,
  AlertTriangle,
  Scale,
  RefreshCw,
  Mail,
} from "lucide-react";

//  Animation helpers
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      delay: i * 0.07,
    },
  }),
};

function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  return (
    <motion.div
      ref={ref}
      variants={fadeUp}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      custom={delay}
      className={className}
    >
      {children}
    </motion.div>
  );
}

//  Section definitions — keys never change across locales
const SECTIONS = [
  { key: "acceptance", icon: ScrollText },
  { key: "purchases", icon: ShoppingBag },
  { key: "payments", icon: CreditCard },
  { key: "liability", icon: Shield },
  { key: "prohibited", icon: AlertTriangle },
  { key: "disputes", icon: Scale },
  { key: "changes", icon: RefreshCw },
  { key: "contact", icon: Mail },
] as const;

// Sections that have bullet point lists in the JSON
const SECTIONS_WITH_POINTS = new Set(["purchases", "prohibited", "liability"]);

//  Content section component
function ContentSection({
  sectionKey,
  icon: Icon,
  index,
  isActive,
  onVisible,
  t,
}: {
  sectionKey: string;
  icon: React.ElementType;
  index: number;
  isActive: boolean;
  onVisible: (key: string) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: false, margin: "-40% 0px -40% 0px" });

  if (inView) onVisible(sectionKey);

  return (
    <motion.section
      ref={ref}
      id={sectionKey}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        duration: 0.5,
        delay: index * 0.04,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      }}
      className="scroll-mt-24 pb-12 border-b border-border last:border-0 last:pb-0"
    >
      {/* Section header */}
      <div className="mb-4 flex items-center gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
            isActive ? "bg-primary text-white" : "bg-primary/10 text-primary"
          }`}
        >
          <Icon size={17} />
        </div>
        <h2 className="font-display text-xl font-bold text-foreground">
          {t(`sections.${sectionKey}.heading`)}
        </h2>
      </div>

      {/* Body */}
      <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
        {t(`sections.${sectionKey}.body`)}
      </p>

      {/* Bullet points (only some sections) */}
      {SECTIONS_WITH_POINTS.has(sectionKey) && (
        <ul className="space-y-2 mt-3">
          {Array.from({ length: 4 }, (_, i) => i).map((i) => (
            <li
              key={i}
              className="flex items-start gap-2.5 text-sm text-muted-foreground"
            >
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              {t(`sections.${sectionKey}.points.${i}`)}
            </li>
          ))}
        </ul>
      )}
    </motion.section>
  );
}

//  Page
export default function TermsOfServicePage() {
  const t = useTranslations("terms");
  const locale = useLocale();
  const [activeSection, setActiveSection] = useState<string>(SECTIONS[0].key);

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/*  Hero  */}
      <section className="relative overflow-hidden bg-primary py-20 px-6 text-white">
        {/* Subtle diagonal stripe texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, white 0px, white 1px, transparent 1px, transparent 12px)",
          }}
        />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -top-16 right-20 h-48 w-48 rounded-full bg-white/5" />

        <div className="relative mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.75, rotate: -6 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.55, type: "spring", bounce: 0.3 }}
            className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15"
          >
            <ScrollText size={28} />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-white/60"
          >
            {t("hero.eyebrow")}
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-4 font-display text-4xl font-bold md:text-5xl"
          >
            {t("hero.title")}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22 }}
            className="max-w-xl text-base text-white/75"
          >
            {t("hero.subtitle")}
          </motion.p>

          {/* Meta strip */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 flex flex-wrap gap-6 text-sm text-white/60"
          >
            <span>{t("hero.effective")}</span>
            <span>·</span>
            <span>{t("hero.jurisdiction")}</span>
          </motion.div>
        </div>
      </section>

      {/*  Acceptance banner  */}
      <div className="border-b border-amber-200 bg-amber-50 px-6 py-4 dark:border-amber-900/40 dark:bg-amber-950/20">
        <div className="mx-auto max-w-4xl flex items-start gap-3">
          <AlertTriangle
            size={17}
            className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
          />
          <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
            {t("banner")}
          </p>
        </div>
      </div>

      {/*  Sidebar + Content  */}
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="flex flex-col gap-10 md:flex-row">
          {/* Sticky sidebar TOC */}
          <aside className="md:w-56 shrink-0">
            <div className="md:sticky md:top-24 space-y-0.5">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground px-3">
                {t("toc")}
              </p>
              {SECTIONS.map((s, i) => {
                const Icon = s.icon;
                const isActive = activeSection === s.key;
                return (
                  <motion.a
                    key={s.key}
                    href={`#${s.key}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 + 0.1 }}
                    onClick={(e) => {
                      e.preventDefault();
                      document
                        .getElementById(s.key)
                        ?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Icon size={14} className="shrink-0" />
                    <span className="truncate">
                      {t(`sections.${s.key}.nav`)}
                    </span>
                    {isActive && (
                      <ChevronRight size={13} className="ml-auto shrink-0" />
                    )}
                  </motion.a>
                );
              })}
            </div>
          </aside>

          {/* Content */}
          <div className="flex-1 space-y-0 divide-y divide-border">
            {SECTIONS.map((s, i) => (
              <div key={s.key} className="py-10 first:pt-0">
                <ContentSection
                  sectionKey={s.key}
                  icon={s.icon}
                  index={i}
                  isActive={activeSection === s.key}
                  onVisible={setActiveSection}
                  t={t}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/*  Agreement footer  */}
      <section className="bg-primary/5 border-t border-primary/10 px-6 py-14">
        <Reveal className="mx-auto max-w-4xl text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Scale size={24} className="text-primary" />
          </div>
          <h2 className="mb-3 font-display text-2xl font-bold">
            {t("agreement.heading")}
          </h2>
          <p className="mb-6 mx-auto max-w-lg text-sm text-muted-foreground leading-relaxed">
            {t("agreement.body")}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href={`${locale}/contact`}
              className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              {t("agreement.ctaContact")}
            </a>
            <a
              href={`${locale}/privacy-policy`}
              className="rounded-full border border-border bg-background px-6 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary/30"
            >
              {t("agreement.ctaPrivacy")}
            </a>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
