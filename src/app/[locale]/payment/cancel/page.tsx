'use client';
import { useLocale, useTranslations } from 'next-intl';
import { XCircle } from 'lucide-react';
import Link from 'next/link';

export default function PaymentCancelPage() {
  const locale = useLocale();
  const t = useTranslations('payment');
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="h-10 w-10 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">{t('cancel.title')}</h1>
        <p className="text-muted-foreground mb-6">{t('cancel.description')}</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link href={`/${locale}/admin/my-orders`} className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors">
            {t('cancel.myOrders')}
          </Link>
          <Link href={`/${locale}/cart`} className="border border-border px-6 py-3 rounded-xl font-medium hover:bg-muted transition-colors">
            {t('cancel.backToCart')}
          </Link>
        </div>
      </div>
    </div>
  );
}
