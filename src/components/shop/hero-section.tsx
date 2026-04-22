'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { bannerApi } from '@/lib/api';
import { cn, getImageUrl } from '@/lib/utils';

export function HeroSection() {
  const t = useTranslations('home');
  const locale = useLocale();
  const [current, setCurrent] = useState(0);

  const { data: banners = [] } = useQuery({
    queryKey: ['banners'],
    queryFn: () => bannerApi.list().then((r) => r.data),
  });

  const next = useCallback(() => setCurrent((c) => (c + 1) % Math.max(banners.length, 1)), [banners.length]);
  const prev = () => setCurrent((c) => (c - 1 + Math.max(banners.length, 1)) % Math.max(banners.length, 1));

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [banners.length, next]);

  const fallback = [{
    title: t('hero.title'),
    subtitle: t('hero.subtitle'),
    image: 'https://placehold.co/1400x500/fc7d00/white?text=Simba+Super+Market',
    link: `/${locale}/shop`,
  }];

  const slides = banners.length > 0 ? banners : fallback;

  return (
    <section className="relative overflow-hidden bg-muted">
      <div className="relative h-[280px] sm:h-[380px] md:h-[460px] lg:h-[520px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0"
          >
            <Image
              src={getImageUrl(slides[current]?.image || '')}
              alt={slides[current]?.title || 'Banner'}
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute inset-0 flex items-center">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="max-w-xl"
                >
                  <span className="inline-block bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full mb-3">
                    {t('hero.badge')}
                  </span>
                  <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 leading-tight">
                    {slides[current]?.title}
                  </h1>
                  {slides[current]?.subtitle && (
                    <p className="text-sm sm:text-base text-white/80 mb-6 max-w-md">
                      {slides[current].subtitle}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={slides[current]?.link || `/${locale}/shop`}
                      className="px-6 py-3 bg-primary text-white font-semibold rounded-full hover:bg-primary/90 transition-colors text-sm"
                    >
                      {t('hero.shopNow')}
                    </Link>
                    <Link
                      href={`/${locale}/shop`}
                      className="px-6 py-3 bg-white/20 backdrop-blur text-white font-semibold rounded-full hover:bg-white/30 transition-colors text-sm border border-white/30"
                    >
                      {t('hero.viewCategories')}
                    </Link>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Controls */}
        {slides.length > 1 && (
          <>
            <button onClick={prev}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/30 backdrop-blur hover:bg-black/50 text-white rounded-full flex items-center justify-center transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={next}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/30 backdrop-blur hover:bg-black/50 text-white rounded-full flex items-center justify-center transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {slides.map((_, i) => (
                <button key={i} onClick={() => setCurrent(i)}
                  className={cn('w-2 h-2 rounded-full transition-all', i === current ? 'bg-white w-5' : 'bg-white/50')} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
