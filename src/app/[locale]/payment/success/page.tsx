'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';

export default function PaymentSuccessPage() {
  const locale = useLocale();
  const searchParams = useSearchParams();
  const qc = useQueryClient();

  useEffect(() => {
    // Invalidate orders so they refresh
    qc.invalidateQueries({ queryKey: ['my-orders'] });
  }, [qc]);

  const ref = searchParams.get('CompanyRef');

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-10 w-10 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
        <p className="text-muted-foreground mb-2">
          Your payment has been processed successfully.
        </p>
        {ref && <p className="text-sm text-muted-foreground mb-6">Order: <span className="font-mono font-bold">{ref}</span></p>}
        <div className="flex gap-3 justify-center flex-wrap">
          <Link href={`/${locale}/admin/my-orders`} className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors">
            View My Orders
          </Link>
          <Link href={`/${locale}/shop`} className="border border-border px-6 py-3 rounded-xl font-medium hover:bg-muted transition-colors">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
