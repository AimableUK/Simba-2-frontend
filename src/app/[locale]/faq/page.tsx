"use client";

import { useTranslations } from "next-intl";
import {
  motion,
  useInView,
  AnimatePresence,
  type Variants,
} from "framer-motion";
import { useRef, useState } from "react";
import { Plus, Minus, HelpCircle } from "lucide-react";

//  Animation variants
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

//  Category keys — stable, never translated
const CATEGORY_KEYS = [
  "orders",
  "shipping",
  "returns",
  "products",
  "account",
] as const;
const QUESTION_COUNTS: Record<string, number> = {
  orders: 4,
  shipping: 4,
  returns: 3,
  products: 3,
  account: 3,
};

//  Accordion item
function AccordionItem({
  question,
  answer,
  index,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: 0.45,
        delay: index * 0.06,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      }}
      className={`border border-border rounded-xl overflow-hidden transition-colors ${
        isOpen
          ? "bg-primary/5 border-primary/30"
          : "bg-card hover:border-primary/20"
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
      >
        <span className="font-medium text-foreground leading-snug">
          {question}
        </span>
        <span
          className={`shrink-0 h-7 w-7 rounded-full flex items-center justify-center transition-colors ${
            isOpen ? "bg-primary text-white" : "bg-muted text-muted-foreground"
          }`}
        >
          {isOpen ? <Minus size={14} /> : <Plus size={14} />}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              duration: 0.35,
              ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
            }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-5 text-sm leading-relaxed text-muted-foreground">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

//  Page
export default function FAQPage() {
  const t = useTranslations("faq");
  const [activeCategory, setActiveCategory] = useState<string>(
    CATEGORY_KEYS[0],
  );
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const questionCount = QUESTION_COUNTS[activeCategory] ?? 0;
  const questionIndices = Array.from({ length: questionCount }, (_, i) => i);

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/*  Hero  */}
      <section className="relative overflow-hidden bg-primary py-20 px-6 text-white">
        {/* Decorative grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-white/5" />

        <div className="relative mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15"
          >
            <HelpCircle size={28} />
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-white/60"
          >
            {t("hero.eyebrow")}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mb-4 font-display text-4xl font-bold md:text-5xl"
          >
            {t("hero.title")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.22 }}
            className="text-base text-white/75 max-w-xl mx-auto"
          >
            {t("hero.subtitle")}
          </motion.p>
        </div>
      </section>

      {/*  Category tabs  */}
      <section className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur px-6 py-3">
        <div className="mx-auto max-w-3xl">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {CATEGORY_KEYS.map((cat, i) => (
              <motion.button
                key={cat}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 + 0.2 }}
                onClick={() => {
                  setActiveCategory(cat);
                  setOpenIndex(null);
                }}
                className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  activeCategory === cat
                    ? "bg-primary text-white"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {t(`categories.${cat}`)}
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/*  Questions  */}
      <section className="mx-auto max-w-3xl px-6 py-16">
        <Reveal className="mb-8">
          <h2 className="font-display text-2xl font-bold">
            {t(`categories.${activeCategory}`)}
          </h2>
        </Reveal>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="space-y-3"
          >
            {questionIndices.map((qi) => (
              <AccordionItem
                key={qi}
                index={qi}
                question={t(`questions.${activeCategory}.${qi}.q`)}
                answer={t(`questions.${activeCategory}.${qi}.a`)}
                isOpen={openIndex === qi}
                onToggle={() => setOpenIndex(openIndex === qi ? null : qi)}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </section>

      {/*  Still need help  */}
      <section className="bg-primary/5 border-t border-primary/10 py-16 px-6">
        <Reveal className="mx-auto max-w-3xl text-center">
          <h2 className="mb-2 font-display text-2xl font-bold">
            {t("contact.heading")}
          </h2>
          <p className="mb-6 text-muted-foreground">{t("contact.body")}</p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            {t("contact.cta")}
          </a>
        </Reveal>
      </section>
    </main>
  );
}
