'use client';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Phone, Mail, MapPin, Facebook, Instagram, Twitter } from 'lucide-react';

export function Footer() {
  const t = useTranslations('footer');
  const locale = useLocale();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-card border-t border-border mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">S</span>
              </div>
              <div>
                <div className="font-bold text-lg text-foreground">Simba Super Market</div>
                <div className="text-xs text-muted-foreground">Kigali, Rwanda</div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs">{t('tagline')}</p>
            <div className="space-y-2">
              <a href="tel:+250788000000"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                <Phone className="w-4 h-4 text-primary" /> +250 788 000 000
              </a>
              <a href="mailto:info@simbasupermarket.rw"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                <Mail className="w-4 h-4 text-primary" /> info@simbasupermarket.rw
              </a>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary flex-shrink-0" /> Kigali, Rwanda
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4">
              {[Facebook, Instagram, Twitter].map((Icon, i) => (
                <a key={i} href="#"
                  className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white transition-colors">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Shop */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">{t('shop')}</h3>
            <ul className="space-y-2">
              {[
                { label: t('allProducts'), href: `/${locale}/shop` },
                { label: t('categories'), href: `/${locale}/shop` },
                { label: t('deals'), href: `/${locale}/shop?sort=comparePrice` },
                { label: t('newArrivals'), href: `/${locale}/shop?sort=createdAt&order=desc` },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">{t('company')}</h3>
            <ul className="space-y-2">
              {[
                { label: t('about'), href: `/${locale}/about` },
                { label: t('blog'), href: `/${locale}/blog` },
                { label: t('contact'), href: `/${locale}/contact` },
                { label: t('careers'), href: '#' },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">{t('support')}</h3>
            <ul className="space-y-2">
              {[
                { label: t('faq'), href: '#' },
                { label: t('returns'), href: '#' },
                { label: t('privacy'), href: '#' },
                { label: t('terms'), href: '#' },
                { label: t('delivery'), href: '#' },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {t('rights', { year })}
          </p>
          <p className="text-xs text-muted-foreground">{t('madeIn')}</p>
        </div>
      </div>
    </footer>
  );
}
