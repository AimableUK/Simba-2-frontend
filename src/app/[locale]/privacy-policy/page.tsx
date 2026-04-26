"use client";

import { useTranslations } from "next-intl";
import { motion, useInView, type Variants } from "framer-motion";
import { useRef, useState } from "react";
import {
  Shield,
  ChevronRight,
  Lock,
  Eye,
  Share2,
  UserCheck,
  Bell,
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

//  Section keys
const SECTIONS = [
  { key: "collection", icon: Eye },
  { key: "use", icon: UserCheck },
  { key: "sharing", icon: Share2 },
  { key: "security", icon: Lock },
  { key: "cookies", icon: Bell },
  { key: "contact", icon: Mail },
] as const;

//  Sidebar nav + content layout
export default function PrivacyPolicyPage() {
  const t = useTranslations("privacy");
  const [active, setActive] = useState<string>("collection");

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/*  Hero  */}
      <section className="relative overflow-hidden bg-primary py-20 px-6 text-white">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 30% 50%, rgba(255,255,255,0.07) 0%, transparent 60%)",
          }}
        />
        <div className="relative mx-auto max-w-4xl flex items-center gap-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.7, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.6, type: "spring" }}
            className="hidden md:flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-white/10"
          >
            <Shield size={44} />
          </motion.div>
          <div>
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
              className="mb-3 font-display text-4xl font-bold md:text-5xl"
            >
              {t("hero.title")}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22 }}
              className="text-sm text-white/65"
            >
              {t("hero.lastUpdated")}
            </motion.p>
          </div>
        </div>
      </section>

      {/*  Intro  */}
      <section className="mx-auto max-w-4xl px-6 pt-12 pb-4">
        <Reveal>
          <p className="text-muted-foreground leading-relaxed border-l-4 border-primary pl-4">
            {t("intro")}
          </p>
        </Reveal>
      </section>

      {/*  Nav + Content  */}
      <section className="mx-auto max-w-4xl px-6 py-10">
        <div className="flex flex-col gap-8 md:flex-row">
          {/* Sticky sidebar nav */}
          <aside className="md:w-52 shrink-0">
            <div className="md:sticky md:top-20 space-y-1">
              {SECTIONS.map((s, i) => {
                const Icon = s.icon;
                return (
                  <motion.button
                    key={s.key}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 + 0.1 }}
                    onClick={() => setActive(s.key)}
                    className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-left transition-colors ${
                      active === s.key
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Icon size={15} className="shrink-0" />
                    {t(`sections.${s.key}.nav`)}
                    {active === s.key && (
                      <ChevronRight size={14} className="ml-auto" />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </aside>

          {/* Content panels */}
          <div className="flex-1 space-y-12">
            {SECTIONS.map((s, i) => {
              const Icon = s.icon;
              const ref = useRef(null);
              const inView = useInView(ref, { once: true, margin: "-60px" });
              return (
                <motion.div
                  key={s.key}
                  ref={ref}
                  id={s.key}
                  initial={{ opacity: 0, y: 24 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{
                    duration: 0.5,
                    delay: i * 0.05,
                    ease: [0.22, 1, 0.36, 1] as [
                      number,
                      number,
                      number,
                      number,
                    ],
                  }}
                  onViewportEnter={() => setActive(s.key)}
                  className="scroll-mt-20"
                >
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon size={17} />
                    </div>
                    <h2 className="font-display text-xl font-bold">
                      {t(`sections.${s.key}.heading`)}
                    </h2>
                  </div>
                  <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                    {t(`sections.${s.key}.body`)}
                  </p>
                  {/* Bullet points if present */}
                  {(["collection", "use", "sharing"] as string[]).includes(
                    s.key,
                  ) && (
                    <ul className="space-y-2">
                      {Array.from({ length: 4 }, (_, bi) => bi).map((bi) => (
                        <li
                          key={bi}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                          {t(`sections.${s.key}.points.${bi}`)}
                        </li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/*  Rights banner  */}
      <section className="bg-primary/5 border-t border-primary/10 px-6 py-16">
        <Reveal className="mx-auto max-w-4xl">
          <h2 className="mb-3 font-display text-2xl font-bold">
            {t("rights.heading")}
          </h2>
          <p className="mb-6 text-muted-foreground leading-relaxed">
            {t("rights.body")}
          </p>
          <div className="flex flex-wrap gap-3">
            {(["access", "correct", "delete", "portability"] as const).map(
              (r, i) => (
                <motion.span
                  key={r}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                  className="rounded-full border border-primary/30 bg-background px-4 py-1.5 text-sm font-medium text-primary"
                >
                  {t(`rights.items.${r}`)}
                </motion.span>
              ),
            )}
          </div>
        </Reveal>
      </section>
    </main>
  );
}
