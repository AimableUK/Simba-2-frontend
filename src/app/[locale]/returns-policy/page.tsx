"use client";

import { useTranslations } from "next-intl";
import { motion, useInView, type Variants } from "framer-motion";
import { useRef } from "react";
import {
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  PackageOpen,
  AlertTriangle,
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

// Step component for the how-to-return process
function ProcessStep({
  number,
  title,
  desc,
  delay,
}: {
  number: number;
  title: string;
  desc: string;
  delay: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -20 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      }}
      className="flex gap-5"
    >
      <div className="flex flex-col items-center">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white font-bold text-sm">
          {number}
        </div>
        {number < 4 && (
          <div
            className="mt-2 w-px grow bg-border"
            style={{ minHeight: "40px" }}
          />
        )}
      </div>
      <div className="pb-10 pt-1">
        <h3 className="mb-1 font-semibold text-foreground">{title}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
      </div>
    </motion.div>
  );
}

const ELIGIBLE_KEYS = ["unopened", "damaged", "wrong", "quality"] as const;
const INELIGIBLE_KEYS = ["perishable", "used", "noReceipt"] as const;
const STEP_KEYS = ["contact", "pack", "drop", "refund"] as const;

export default function ReturnsPolicyPage() {
  const t = useTranslations("returns");

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/*  Hero  */}
      <section className="relative overflow-hidden bg-primary py-20 px-6 text-white">
        <div
          className="pointer-events-none absolute right-0 top-0 h-full w-1/2"
          style={{
            background:
              "radial-gradient(ellipse at 80% 50%, rgba(255,255,255,0.08) 0%, transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15"
          >
            <RotateCcw size={28} />
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

          {/* Quick stat strip */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32 }}
            className="mt-10 flex flex-wrap gap-6"
          >
            {(["window", "refundTime", "condition"] as const).map((key) => (
              <div key={key} className="flex items-center gap-2">
                <Clock size={16} className="text-white/60" />
                <span className="text-sm font-medium">{t(`stats.${key}`)}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/*  Eligible vs Not  */}
      <section className="mx-auto max-w-4xl px-6 py-20">
        <Reveal>
          <h2 className="mb-10 font-display text-3xl font-bold">
            {t("eligibility.heading")}
          </h2>
        </Reveal>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Eligible */}
          <Reveal delay={1}>
            <div className="rounded-2xl border border-green-200 bg-green-50 p-6 dark:border-green-900/40 dark:bg-green-950/20">
              <div className="mb-4 flex items-center gap-2">
                <CheckCircle2
                  size={20}
                  className="text-green-600 dark:text-green-400"
                />
                <h3 className="font-semibold text-green-800 dark:text-green-300">
                  {t("eligibility.eligible.heading")}
                </h3>
              </div>
              <ul className="space-y-2">
                {ELIGIBLE_KEYS.map((key) => (
                  <li
                    key={key}
                    className="flex items-start gap-2 text-sm text-green-700 dark:text-green-400"
                  >
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
                    {t(`eligibility.eligible.items.${key}`)}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          {/* Not eligible */}
          <Reveal delay={2}>
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900/40 dark:bg-red-950/20">
              <div className="mb-4 flex items-center gap-2">
                <XCircle size={20} className="text-red-500 dark:text-red-400" />
                <h3 className="font-semibold text-red-700 dark:text-red-300">
                  {t("eligibility.ineligible.heading")}
                </h3>
              </div>
              <ul className="space-y-2">
                {INELIGIBLE_KEYS.map((key) => (
                  <li
                    key={key}
                    className="flex items-start gap-2 text-sm text-red-700 dark:text-red-400"
                  >
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                    {t(`eligibility.ineligible.items.${key}`)}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/*  How to return  */}
      <section className="border-y border-border bg-muted/30 px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <Reveal>
            <div className="mb-4 flex items-center gap-3">
              <PackageOpen size={22} className="text-primary" />
              <h2 className="font-display text-3xl font-bold">
                {t("process.heading")}
              </h2>
            </div>
            <p className="mb-12 text-muted-foreground">
              {t("process.subtitle")}
            </p>
          </Reveal>
          <div>
            {STEP_KEYS.map((key, i) => (
              <ProcessStep
                key={key}
                number={i + 1}
                title={t(`process.steps.${key}.title`)}
                desc={t(`process.steps.${key}.desc`)}
                delay={i * 0.1}
              />
            ))}
          </div>
        </div>
      </section>

      {/*  Refund methods  */}
      <section className="mx-auto max-w-4xl px-6 py-20">
        <Reveal>
          <h2 className="mb-8 font-display text-3xl font-bold">
            {t("refunds.heading")}
          </h2>
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-3">
          {(["original", "storeCredit", "exchange"] as const).map((key, i) => (
            <Reveal key={key} delay={i}>
              <div className="rounded-2xl border border-border bg-card p-6 text-center">
                <div className="mb-3 mx-auto h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <RotateCcw size={20} className="text-primary" />
                </div>
                <h3 className="mb-1 font-semibold text-foreground">
                  {t(`refunds.methods.${key}.title`)}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t(`refunds.methods.${key}.desc`)}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/*  Important note  */}
      <section className="px-6 pb-20">
        <Reveal className="mx-auto max-w-4xl">
          <div className="flex gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900/40 dark:bg-amber-950/20">
            <AlertTriangle
              size={20}
              className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
            />
            <div>
              <h3 className="mb-1 font-semibold text-amber-800 dark:text-amber-300">
                {t("note.heading")}
              </h3>
              <p className="text-sm leading-relaxed text-amber-700 dark:text-amber-400">
                {t("note.body")}
              </p>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
