"use client";

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

//  Data
const values = [
  {
    icon: Users,
    title: "Respect for the Individual",
    body: "We're hardworking, ordinary people who've teamed up to accomplish extraordinary things. We treat each other with dignity and encourage everyone to express their thoughts — this is how we show respect.",
  },
  {
    icon: Heart,
    title: "Service to Customers",
    body: "Our customers are the reason we're in business. We offer quality merchandise at the lowest prices with the best customer service possible, always seeking to exceed expectations.",
  },
  {
    icon: Star,
    title: "Striving for Excellence",
    body: "We're proud of our accomplishments but never satisfied. We constantly reach further to bring new ideas and goals to life — Is this the best I can do? That question drives everything.",
  },
];

const milestones = [
  {
    year: "2007",
    label: "Founded",
    desc: "Established as a Limited Liability Company on December 3rd by Mr. Teklay Teame and partners.",
  },
  {
    year: "2008",
    label: "1st Branch",
    desc: "Official launch on August 8th — Simba Centenary opens, creating over 450 jobs for Rwandese citizens.",
  },
  {
    year: "2013",
    label: "1st Award",
    desc: "1st Best Exhibitor — Retail and Distribution.",
  },
  {
    year: "2014",
    label: "Expanding",
    desc: "Simba Gishushu branch opens. Awarded Best Exhibitor Retail & Distribution — EBM Best Award.",
  },
  {
    year: "2015",
    label: "Growing",
    desc: "Simba Kimironko branch opens. Awarded RRA Compliant Taxpayer status.",
  },
  {
    year: "2016",
    label: "Scaling Up",
    desc: "Two new branches open — Simba Kicukiro and Simba Kigali Height.",
  },
  {
    year: "2019",
    label: "City Centre",
    desc: "Simba UTC opens in the heart of Kigali.",
  },
  {
    year: "2020",
    label: "Merchant of the Year",
    desc: "Awarded 1st Merchant of the Year in Rwanda.",
  },
  {
    year: "2023",
    label: "Major Expansion",
    desc: "Five new branches launch simultaneously — Simba Gacuriro, Simba Gikondo, Simba Sonatube, Simba Kisimenti, and Simba Rebero.",
  },
  {
    year: "2024",
    label: "Going Digital",
    desc: "Simba Online Sales launches — bringing the supermarket experience directly to customers' doors.",
  },
];

const branches = [
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

const coffeeShops = [
  "Simba Centenary",
  "Simba Gishushu",
  "Simba UTC",
  "Simba Gacuriro",
  "Simba Kisimenti",
];

const categories = [
  "Fruits & Vegetables",
  "Meats",
  "Frozen",
  "Wines & Spirits",
  "Furniture",
  "Electronics",
  "Utensils & Ornaments",
  "Homecare",
  "Baby Products",
  "Gym & Sports",
  "Health & Beauty",
  "Bakery",
];

const services = [
  {
    icon: ShoppingCart,
    title: "Supermarket",
    desc: "11 branches across Rwanda offering a wide range of products for daily needs.",
  },
  {
    icon: Coffee,
    title: "Restaurant & Coffee Shop",
    desc: "Trucillo Café and coffee shop services across 5 Simba branches.",
  },
  {
    icon: Gamepad2,
    title: "Simba Arcade",
    desc: "Arcade gaming entertainment available at Simba Gacuriro branch.",
  },
  {
    icon: Globe,
    title: "Online Sales",
    desc: "Extending our reach to your door — Simba Supermarket is everywhere.",
  },
  {
    icon: Factory,
    title: "Bakery Factory",
    desc: "In-house bakery factory producing fresh goods for all our branches.",
  },
];

//  Component
export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/*  Hero  */}
      <section className="relative overflow-hidden bg-primary py-24 px-6 text-white">
        {/* decorative rings */}
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
            Company Profile
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08 }}
            className="mb-6 font-display text-5xl font-bold leading-tight tracking-tight md:text-6xl"
          >
            About Simba
            <br />
            Supermarket
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.16 }}
            className="max-w-2xl text-lg leading-relaxed text-white/80"
          >
            Rwanda's most admired supermarket — a testament to the country's
            economic resurgence, proudly meeting the daily needs of Kigali and
            beyond since 2008.
          </motion.p>
        </div>
      </section>

      {/*  Origin  */}
      <section className="mx-auto max-w-4xl px-6 py-20">
        <Reveal>
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">
            Origin History
          </p>
          <h2 className="mb-6 font-display text-3xl font-bold md:text-4xl">
            Where It All Began
          </h2>
        </Reveal>
        <Reveal
          delay={1}
          className="space-y-4 text-muted-foreground leading-relaxed"
        >
          <p>
            SIMBA SUPERMARKET LTD was established on{" "}
            <strong className="text-foreground">December 3, 2007</strong>, as a
            Limited Liability Company with a clear ambition: to become the
            region's largest retail outlet. Founded by{" "}
            <strong className="text-foreground">Mr. Teklay Teame</strong> and
            his partners, the company imports products from Europe, Egypt,
            Dubai, China, Turkey, and beyond to ensure a truly diverse product
            range.
          </p>
          <p>
            The official launch on{" "}
            <strong className="text-foreground">August 8, 2008</strong> created
            over <strong className="text-foreground">450 jobs</strong> for
            Rwandese citizens. With 11 branches across Rwanda, Simba provides a
            one-stop shopping experience — butchery, bakery, coffee shop, and
            more — serving international organisations, local NGOs, private
            companies, and government ministries.
          </p>
        </Reveal>
      </section>

      <Separator className="mx-auto max-w-4xl px-6" />

      {/*  Values  */}
      <section className="mx-auto max-w-4xl px-6 py-20">
        <Reveal>
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">
            Beliefs & Values
          </p>
          <h2 className="mb-10 font-display text-3xl font-bold md:text-4xl">
            What We Stand For
          </h2>
        </Reveal>
        <div className="grid gap-6 md:grid-cols-3">
          {values.map((v, i) => (
            <Reveal key={v.title} delay={i}>
              <div className="group rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-lg">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  <v.icon size={22} />
                </div>
                <h3 className="mb-2 font-semibold text-foreground">
                  {v.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {v.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <Separator className="mx-auto max-w-4xl px-6" />

      {/*  Milestones (vertical timeline)  */}
      <section className="mx-auto max-w-4xl px-6 py-20">
        <Reveal>
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">
            Milestones
          </p>
          <h2 className="mb-14 font-display text-3xl font-bold md:text-4xl">
            Our Journey
          </h2>
        </Reveal>

        <div className="relative">
          {/* vertical line */}
          <div className="absolute left-[88px] top-0 hidden h-full w-px bg-border md:block" />

          <div className="space-y-0">
            {milestones.map((m, i) => {
              const ref = useRef(null);
              const inView = useInView(ref, { once: true, margin: "-60px" });
              return (
                <motion.div
                  key={m.year}
                  ref={ref}
                  initial={{ opacity: 0, x: -24 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{
                    duration: 0.5,
                    delay: i * 0.1,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="relative flex gap-6 md:gap-10"
                >
                  {/* year column */}
                  <div className="flex w-[88px] shrink-0 flex-col items-end">
                    <span className="font-display text-2xl font-bold text-primary leading-none pt-1">
                      {m.year}
                    </span>
                  </div>

                  {/* dot + connector */}
                  <div className="relative flex flex-col items-center">
                    <div className="z-10 mt-1.5 h-4 w-4 shrink-0 rounded-full border-2 border-primary bg-background ring-4 ring-primary/10" />
                    {i < milestones.length - 1 && (
                      <div
                        className="mt-1 w-px grow bg-border"
                        style={{ minHeight: "56px" }}
                      />
                    )}
                  </div>

                  {/* content */}
                  <div className="pb-10 pt-0.5">
                    <Badge
                      variant="secondary"
                      className="mb-1.5 text-xs font-semibold uppercase tracking-wide"
                    >
                      {m.label}
                    </Badge>
                    <p className="text-sm leading-relaxed text-muted-foreground max-w-sm">
                      {m.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <Separator className="mx-auto max-w-4xl px-6" />

      {/*  Products  */}
      <section className="mx-auto max-w-4xl px-6 py-20">
        <Reveal>
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">
            What We Offer
          </p>
          <h2 className="mb-8 font-display text-3xl font-bold md:text-4xl">
            Product Categories
          </h2>
        </Reveal>
        <div className="flex flex-wrap gap-3">
          {categories.map((cat, i) => (
            <Reveal key={cat} delay={i * 0.5}>
              <span className="rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-white cursor-default select-none">
                {cat}
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
            Services
          </p>
          <h2 className="mb-10 font-display text-3xl font-bold md:text-4xl">
            Everything Under One Roof
          </h2>
        </Reveal>
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {services.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.5}>
              <div className="rounded-2xl border border-border bg-card p-6">
                <s.icon size={20} className="mb-3 text-primary" />
                <h3 className="mb-1 font-semibold text-foreground">
                  {s.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {s.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <Separator className="mx-auto max-w-4xl px-6" />

      {/*  Branches  */}
      <section className="mx-auto max-w-4xl px-6 py-20">
        <div className="grid gap-12 md:grid-cols-2">
          {/* Branches */}
          <div>
            <Reveal>
              <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">
                Locations
              </p>
              <h2 className="mb-6 font-display text-2xl font-bold">
                Our 11 Branches
              </h2>
            </Reveal>
            <ul className="space-y-2">
              {branches.map((b, i) => (
                <Reveal key={b} delay={i * 0.3}>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin size={14} className="shrink-0 text-primary" />
                    {b}
                  </li>
                </Reveal>
              ))}
            </ul>
          </div>

          {/* Coffee shops */}
          <div>
            <Reveal>
              <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">
                Coffee
              </p>
              <h2 className="mb-6 font-display text-2xl font-bold">
                Coffee Shops
              </h2>
            </Reveal>
            <Reveal delay={1}>
              <p className="mb-4 text-sm text-muted-foreground leading-relaxed">
                Simba Coffee Shops and one Trucillo Café across five branches,
                offering a relaxing experience for every shopper.
              </p>
            </Reveal>
            <ul className="space-y-2">
              {coffeeShops.map((c, i) => (
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

      {/*  Awards Banner  */}
      <section className="bg-primary/5 border-y border-primary/10 py-16 px-6">
        <div className="mx-auto max-w-4xl">
          <Reveal>
            <p className="mb-2 text-center text-sm font-semibold uppercase tracking-widest text-primary">
              Achievements
            </p>
            <h2 className="mb-10 text-center font-display text-3xl font-bold">
              Award-Winning Excellence
            </h2>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            {[
              {
                year: "2013",
                text: "1st Best Exhibitor — Retail & Distribution",
              },
              {
                year: "2014",
                text: "Best Exhibitor Retail & Distribution — EBM",
              },
              { year: "2015", text: "RRA Compliant Taxpayer Award" },
              { year: "2020", text: "1st Merchant of the Year — Rwanda" },
            ].map((a, i) => (
              <Reveal key={a.year} delay={i * 0.5}>
                <div className="flex flex-col items-center rounded-2xl border border-primary/20 bg-card p-5 text-center">
                  <Award size={28} className="mb-3 text-primary" />
                  <span className="mb-1 font-display text-xl font-bold text-primary">
                    {a.year}
                  </span>
                  <p className="text-xs leading-snug text-muted-foreground">
                    {a.text}
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
