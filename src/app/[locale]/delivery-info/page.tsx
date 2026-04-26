"use client";

import { useTranslations } from "next-intl";
import { motion, useInView, type Variants } from "framer-motion";
import { useRef } from "react";
import {
  Truck,
  MapPin,
  Clock,
  PackageCheck,
  AlertCircle,
  Phone,
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

//  Delivery zone card
function ZoneCard({ zone, index }: { zone: string; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: 0.45,
        delay: index * 0.08,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      }}
      className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
    >
      <MapPin size={15} className="shrink-0 text-primary" />
      <span className="text-sm font-medium text-foreground">{zone}</span>
    </motion.div>
  );
}

//  Delivery option card
function OptionCard({
  icon: Icon,
  title,
  time,
  price,
  note,
  highlight,
  index,
}: {
  icon: React.ElementType;
  title: string;
  time: string;
  price: string;
  note: string;
  highlight: boolean;
  index: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      }}
      className={`relative rounded-2xl border p-6 ${
        highlight
          ? "border-primary bg-primary text-white"
          : "border-border bg-card text-foreground"
      }`}
    >
      {highlight && (
        <span className="absolute -top-3 left-6 rounded-full bg-white px-3 py-0.5 text-xs font-bold text-primary shadow">
          Popular
        </span>
      )}
      <div
        className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${
          highlight ? "bg-white/20" : "bg-primary/10"
        }`}
      >
        <Icon size={20} className={highlight ? "text-white" : "text-primary"} />
      </div>
      <h3 className="mb-1 font-bold text-lg">{title}</h3>
      <p
        className={`text-2xl font-display font-bold mb-1 ${highlight ? "text-white" : "text-primary"}`}
      >
        {price}
      </p>
      <div
        className={`flex items-center gap-1.5 mb-3 text-sm ${highlight ? "text-white/80" : "text-muted-foreground"}`}
      >
        <Clock size={13} />
        {time}
      </div>
      <p
        className={`text-xs leading-relaxed ${highlight ? "text-white/70" : "text-muted-foreground"}`}
      >
        {note}
      </p>
    </motion.div>
  );
}

//  Static zone list (proper nouns)
const ZONES = [
  "Kigali City",
  "Nyamirambo",
  "Kimironko",
  "Kicukiro",
  "Gisozi",
  "Remera",
  "Kanombe",
  "Gikondo",
  "Gacuriro",
  "Nyarutarama",
  "Kibagabaga",
  "Gasabo",
];

const OPTION_KEYS = ["standard", "express", "sameDay"] as const;
const OPTION_ICONS = [Truck, PackageCheck, Clock];
const OPTION_HIGHS = [false, true, false];

export default function DeliveryInfoPage() {
  const t = useTranslations("delivery");

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/*  Hero  */}
      <section className="relative overflow-hidden bg-primary py-20 px-6 text-white">
        {/* animated dots pattern */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15"
          >
            <Truck size={28} />
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

          {/* Quick stats */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32 }}
            className="mt-10 grid grid-cols-3 gap-4 max-w-sm"
          >
            {(["branches", "minOrder", "coverage"] as const).map((key) => (
              <div
                key={key}
                className="rounded-xl bg-white/10 px-4 py-3 text-center"
              >
                <p className="font-display text-xl font-bold">
                  {t(`stats.${key}.value`)}
                </p>
                <p className="text-xs text-white/65 mt-0.5">
                  {t(`stats.${key}.label`)}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/*  Delivery options  */}
      <section className="mx-auto max-w-4xl px-6 py-20">
        <Reveal>
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">
            {t("options.eyebrow")}
          </p>
          <h2 className="mb-10 font-display text-3xl font-bold">
            {t("options.heading")}
          </h2>
        </Reveal>
        <div className="grid gap-5 sm:grid-cols-3">
          {OPTION_KEYS.map((key, i) => (
            <OptionCard
              key={key}
              icon={OPTION_ICONS[i]}
              title={t(`options.items.${key}.title`)}
              time={t(`options.items.${key}.time`)}
              price={t(`options.items.${key}.price`)}
              note={t(`options.items.${key}.note`)}
              highlight={OPTION_HIGHS[i]}
              index={i}
            />
          ))}
        </div>
      </section>

      {/*  Delivery zones  */}
      <section className="border-y border-border bg-muted/30 px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <Reveal>
            <div className="mb-2 flex items-center gap-3">
              <MapPin size={20} className="text-primary" />
              <p className="text-sm font-semibold uppercase tracking-widest text-primary">
                {t("zones.eyebrow")}
              </p>
            </div>
            <h2 className="mb-3 font-display text-3xl font-bold">
              {t("zones.heading")}
            </h2>
            <p className="mb-10 text-muted-foreground">{t("zones.subtitle")}</p>
          </Reveal>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {ZONES.map((zone, i) => (
              <ZoneCard key={zone} zone={zone} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/*  How it works  */}
      <section className="mx-auto max-w-4xl px-6 py-20">
        <Reveal>
          <h2 className="mb-10 font-display text-3xl font-bold">
            {t("howItWorks.heading")}
          </h2>
        </Reveal>
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
          {(["order", "confirm", "dispatch", "deliver"] as const).map(
            (key, i) => (
              <Reveal key={key} delay={i}>
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                    <span className="font-display text-xl font-bold text-primary">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="mb-1 font-semibold text-foreground">
                    {t(`howItWorks.steps.${key}.title`)}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t(`howItWorks.steps.${key}.desc`)}
                  </p>
                </div>
              </Reveal>
            ),
          )}
        </div>
      </section>

      {/*  Important info  */}
      <section className="px-6 pb-10">
        <div className="mx-auto max-w-4xl">
          <Reveal>
            <h2 className="mb-6 font-display text-2xl font-bold">
              {t("important.heading")}
            </h2>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2">
            {(["cutoff", "packaging", "tracking", "failed"] as const).map(
              (key, i) => (
                <Reveal key={key} delay={i * 0.5}>
                  <div className="flex gap-3 rounded-xl border border-border bg-card p-5">
                    <AlertCircle
                      size={18}
                      className="mt-0.5 shrink-0 text-primary"
                    />
                    <div>
                      <h3 className="mb-0.5 font-semibold text-sm text-foreground">
                        {t(`important.items.${key}.title`)}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {t(`important.items.${key}.desc`)}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ),
            )}
          </div>
        </div>
      </section>

      {/*  Contact strip  */}
      <section className="bg-primary/5 border-t border-primary/10 px-6 py-12">
        <Reveal className="mx-auto max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Phone size={20} className="text-primary" />
            <div>
              <p className="font-semibold text-foreground">
                {t("contact.heading")}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("contact.body")}
              </p>
            </div>
          </div>
          <a
            href="/contact"
            className="shrink-0 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            {t("contact.cta")}
          </a>
        </Reveal>
      </section>
    </main>
  );
}
