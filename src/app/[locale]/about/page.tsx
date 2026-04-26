"use client";

import { useTranslations } from "next-intl";
import { motion, useInView, type Variants } from "framer-motion";
import { useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ShoppingCart,
  Award,
  Users,
  Heart,
  Star,
  MapPin,
  Coffee,
  Gamepad2,
  Globe,
  Factory,
} from "lucide-react";

//  Icon maps - keyed to stable `key` fields in the JSON (never translated)
const valueIcons: Record<string, React.ElementType> = {
  respect: Users,
  service: Heart,
  excellence: Star,
};

const serviceIcons: Record<string, React.ElementType> = {
  supermarket: ShoppingCart,
  coffee: Coffee,
  arcade: Gamepad2,
  online: Globe,
  bakery: Factory,
};

// Branch names are proper nouns - identical in every locale
const BRANCHES = [
  "Simba Centenary",
  "Simba Gishushu",
  "Simba Kimironko",
  "Simba Kicukiro",
  "Simba Kigali Height",
  "Simba UTC",
  "Simba Gacuriro",
  "Simba Gikondo",
  "Simba Sonatube",
  "Simba Kisimenti",
  "Simba Rebero",
];

const COFFEE_BRANCHES = [
  "Simba Centenary",
  "Simba Gishushu",
  "Simba UTC",
  "Simba Gacuriro",
  "Simba Kisimenti",
];

//  Animation helpers
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      delay: i * 0.08,
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
  const inView = useInView(ref, { once: true, margin: "-60px" });
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

//  Timeline row
function TimelineItem({
  year,
  label,
  desc,
  index,
  total,
}: {
  year: string;
  label: string;
  desc: string;
  index: number;
  total: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -24 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      }}
      className="relative flex gap-6 md:gap-10"
    >
      <div className="flex w-[88px] shrink-0 flex-col items-end">
        <span className="font-display text-2xl font-bold text-primary leading-none pt-1">
          {year}
        </span>
      </div>
      <div className="relative flex flex-col items-center">
        <div className="z-10 mt-1.5 h-4 w-4 shrink-0 rounded-full border-2 border-primary bg-background ring-4 ring-primary/10" />
        {index < total - 1 && (
          <div
            className="mt-1 w-px grow bg-border"
            style={{ minHeight: "56px" }}
          />
        )}
      </div>
      <div className="pb-10 pt-0.5">
        <Badge
          variant="secondary"
          className="mb-1.5 text-xs font-semibold uppercase tracking-wide"
        >
          {label}
        </Badge>
        <p className="text-sm leading-relaxed text-muted-foreground max-w-sm">
          {desc}
        </p>
      </div>
    </motion.div>
  );
}

//  Page
export default function AboutPage() {
  const t = useTranslations("about");

  // next-intl returns typed arrays via .raw() - use it for list data
  const valueKeys = ["respect", "service", "excellence"] as const;
  const serviceKeys = [
    "supermarket",
    "coffee",
    "arcade",
    "online",
    "bakery",
  ] as const;
  const milestoneYears = [
    "2007",
    "2008",
    "2013",
    "2014",
    "2015",
    "2016",
    "2019",
    "2020",
    "2023",
    "2024",
  ] as const;
  const categoryKeys = [
    "fruitsVeg",
    "meats",
    "frozen",
    "winesSpirits",
    "furniture",
    "electronics",
    "utensils",
    "homecare",
    "baby",
    "gym",
    "healthBeauty",
    "bakery",
  ] as const;
  const awardYears = ["2013", "2014", "2015", "2020"] as const;

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/*  Hero  */}
      <section className="relative overflow-hidden bg-primary py-24 px-6 text-white">
        <div className="pointer-events-none absolute -top-32 -right-32 h-[520px] w-[520px] rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -top-16 -right-16 h-[360px] w-[360px] rounded-full border border-white/10" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-64 w-64 -translate-x-1/2 translate-y-1/2 rounded-full border border-white/10" />
        <div className="relative mx-auto max-w-4xl">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-white/70"
          >
            {t("hero.eyebrow")}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08 }}
            className="mb-6 font-display text-5xl font-bold leading-tight tracking-tight md:text-6xl"
          >
            {t("hero.title_line1")}
            <br />
            {t("hero.title_line2")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.16 }}
            className="max-w-2xl text-lg leading-relaxed text-white/80"
          >
            {t("hero.subtitle")}
          </motion.p>
        </div>
      </section>

      {/*  Origin  */}
      <section className="mx-auto max-w-4xl px-6 py-20">
        <Reveal>
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">
            {t("origin.eyebrow")}
          </p>
          <h2 className="mb-6 font-display text-3xl font-bold md:text-4xl">
            {t("origin.heading")}
          </h2>
        </Reveal>
        <Reveal
          delay={1}
          className="space-y-4 text-muted-foreground leading-relaxed"
        >
          {/* next-intl supports rich text via t.rich() for <strong> tags */}
          <p>
            {t.rich("origin.paragraph1", {
              strong: (chunks) => (
                <strong className="text-foreground">{chunks}</strong>
              ),
            })}
          </p>
          <p>
            {t.rich("origin.paragraph2", {
              strong: (chunks) => (
                <strong className="text-foreground">{chunks}</strong>
              ),
            })}
          </p>
        </Reveal>
      </section>

      <Separator className="mx-auto max-w-4xl px-6" />

      {/*  Values  */}
      <section className="mx-auto max-w-4xl px-6 py-20">
        <Reveal>
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">
            {t("values.eyebrow")}
          </p>
          <h2 className="mb-10 font-display text-3xl font-bold md:text-4xl">
            {t("values.heading")}
          </h2>
        </Reveal>
        <div className="grid gap-6 md:grid-cols-3">
          {valueKeys.map((key, i) => {
            const Icon = valueIcons[key] ?? Users;
            return (
              <Reveal key={key} delay={i}>
                <div className="group rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-lg">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                    <Icon size={22} />
                  </div>
                  <h3 className="mb-2 font-semibold text-foreground">
                    {t(`values.items.${key}.title`)}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {t(`values.items.${key}.body`)}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      <Separator className="mx-auto max-w-4xl px-6" />

      {/*  Milestones  */}
      <section className="mx-auto max-w-4xl px-6 py-20">
        <Reveal>
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">
            {t("milestones.eyebrow")}
          </p>
          <h2 className="mb-14 font-display text-3xl font-bold md:text-4xl">
            {t("milestones.heading")}
          </h2>
        </Reveal>
        <div className="relative">
          <div className="absolute left-[88px] top-0 hidden h-full w-px bg-border md:block" />
          <div className="space-y-0">
            {milestoneYears.map((year, i) => (
              <TimelineItem
                key={year}
                year={year}
                label={t(`milestones.items.${year}.label`)}
                desc={t(`milestones.items.${year}.desc`)}
                index={i}
                total={milestoneYears.length}
              />
            ))}
          </div>
        </div>
      </section>

      <Separator className="mx-auto max-w-4xl px-6" />

      {/*  Categories  */}
      <section className="mx-auto max-w-4xl px-6 py-20">
        <Reveal>
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">
            {t("categories.eyebrow")}
          </p>
          <h2 className="mb-8 font-display text-3xl font-bold md:text-4xl">
            {t("categories.heading")}
          </h2>
        </Reveal>
        <div className="flex flex-wrap gap-3">
          {categoryKeys.map((key, i) => (
            <Reveal key={key} delay={i * 0.5}>
              <span className="rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-white cursor-default select-none">
                {t(`categories.items.${key}`)}
              </span>
            </Reveal>
          ))}
        </div>
      </section>

      <Separator className="mx-auto max-w-4xl px-6" />

      {/*  Services  */}
      <section className="mx-auto max-w-4xl px-6 py-20">
        <Reveal>
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">
            {t("services.eyebrow")}
          </p>
          <h2 className="mb-10 font-display text-3xl font-bold md:text-4xl">
            {t("services.heading")}
          </h2>
        </Reveal>
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {serviceKeys.map((key, i) => {
            const Icon = serviceIcons[key] ?? ShoppingCart;
            return (
              <Reveal key={key} delay={i * 0.5}>
                <div className="rounded-2xl border border-border bg-card p-6">
                  <Icon size={20} className="mb-3 text-primary" />
                  <h3 className="mb-1 font-semibold text-foreground">
                    {t(`services.items.${key}.title`)}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t(`services.items.${key}.desc`)}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      <Separator className="mx-auto max-w-4xl px-6" />

      {/*  Branches + Coffee  */}
      <section className="mx-auto max-w-4xl px-6 py-20">
        <div className="grid gap-12 md:grid-cols-2">
          <div>
            <Reveal>
              <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">
                {t("branches.eyebrow")}
              </p>
              <h2 className="mb-6 font-display text-2xl font-bold">
                {t("branches.heading")}
              </h2>
            </Reveal>
            <ul className="space-y-2">
              {BRANCHES.map((b, i) => (
                <Reveal key={b} delay={i * 0.3}>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin size={14} className="shrink-0 text-primary" />
                    {b}
                  </li>
                </Reveal>
              ))}
            </ul>
          </div>

          <div>
            <Reveal>
              <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">
                {t("coffee.eyebrow")}
              </p>
              <h2 className="mb-6 font-display text-2xl font-bold">
                {t("coffee.heading")}
              </h2>
            </Reveal>
            <Reveal delay={1}>
              <p className="mb-4 text-sm text-muted-foreground leading-relaxed">
                {t("coffee.desc")}
              </p>
            </Reveal>
            <ul className="space-y-2">
              {COFFEE_BRANCHES.map((c, i) => (
                <Reveal key={c} delay={i * 0.3 + 1}>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Coffee size={14} className="shrink-0 text-primary" />
                    {c}
                  </li>
                </Reveal>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/*  Awards  */}
      <section className="bg-primary/5 border-y border-primary/10 py-16 px-6">
        <div className="mx-auto max-w-4xl">
          <Reveal>
            <p className="mb-2 text-center text-sm font-semibold uppercase tracking-widest text-primary">
              {t("awards.eyebrow")}
            </p>
            <h2 className="mb-10 text-center font-display text-3xl font-bold">
              {t("awards.heading")}
            </h2>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            {awardYears.map((year, i) => (
              <Reveal key={year} delay={i * 0.5}>
                <div className="flex flex-col items-center rounded-2xl border border-primary/20 bg-card p-5 text-center">
                  <Award size={28} className="mb-3 text-primary" />
                  <span className="mb-1 font-display text-xl font-bold text-primary">
                    {year}
                  </span>
                  <p className="text-xs leading-snug text-muted-foreground">
                    {t(`awards.items.${year}`)}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
