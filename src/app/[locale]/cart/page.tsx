'use client';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useSession } from '@/lib/auth-client';
import { formatPrice, getImageUrl } from '@/lib/utils';
import { Skeleton } from '@/components/common/skeletons';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const t = useTranslations('cart');
  const locale = useLocale();
  const { data: session } = useSession();
  const { items, total, deliveryFee, grandTotal, isLoading, updateQuantity, removeItem, itemCount } = useCart();
  const router = useRouter();

  if (!session?.user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">{t('empty')}</h2>
        <p className="text-muted-foreground mb-6">Sign in to view your cart</p>
        <Link href={`/${locale}/auth/sign-in`} className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors">
          Sign In
        </Link>
      </div>
    );
  }

  if (isLoading) return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Skeleton className="h-8 w-40 mb-8" />
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <Skeleton className="h-60 rounded-2xl" />
      </div>
    </div>
  );

  if (items.length === 0) return (
    <div className="container mx-auto px-4 py-20 text-center">
      <ShoppingBag className="h-20 w-20 text-muted-foreground mx-auto mb-4" />
      <h2 className="text-2xl font-bold mb-2">{t('empty')}</h2>
      <p className="text-muted-foreground mb-8">{t('emptyDesc')}</p>
      <Link href={`/${locale}/shop`} className="bg-primary text-primary-foreground px-8 py-3.5 rounded-xl font-semibold hover:bg-primary/90 transition-colors">
        {t('shopNow')}
      </Link>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-2xl font-bold mb-2">{t('title')}</h1>
      <p className="text-muted-foreground mb-8">{t('items', { count: itemCount })}</p>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex gap-4 bg-card border border-border rounded-2xl p-4">
              <Link href={`/${locale}/product/${item.product.slug}`} className="shrink-0">
                <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-muted">
                  <Image src={getImageUrl(item.product.images[0])} alt={item.product.name} fill className="object-contain p-1" sizes="80px" />
                </div>
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/${locale}/product/${item.product.slug}`} className="font-medium text-sm hover:text-primary transition-colors line-clamp-2">
                  {item.product.name}
                </Link>
                <p className="text-primary font-bold mt-1">{formatPrice(item.product.price)}</p>
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center gap-0 border border-border rounded-lg overflow-hidden">
                    <button onClick={() => updateQuantity({ productId: item.productId, quantity: Math.max(1, item.quantity - 1) })} className="p-2 hover:bg-muted transition-colors">
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                    <button onClick={() => updateQuantity({ productId: item.productId, quantity: Math.min(item.product.stock, item.quantity + 1) })} className="p-2 hover:bg-muted transition-colors">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <button
                    onClick={() =>
                      removeItem({
                        productId: item.productId,
                        branchId: undefined,
                      })
                    }
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold">{formatPrice(item.product.price * item.quantity)}</p>
              </div>
            </div>
          ))}

          <Link href={`/${locale}/shop`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mt-2">
            ← {t('continueShopping')}
          </Link>
        </div>

        {/* Order Summary */}
        <div>
          <div className="bg-card border border-border rounded-2xl p-6 sticky top-24">
            <h2 className="font-bold text-lg mb-4">Order Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('subtotal')}</span>
                <span className="font-medium">{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('delivery')}</span>
                <span className="font-medium">{formatPrice(deliveryFee)}</span>
              </div>
              <div className="border-t border-border pt-3 flex justify-between text-base">
                <span className="font-bold">{t('total')}</span>
                <span className="font-bold text-primary text-lg">{formatPrice(grandTotal)}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">{t('deliveryNote')}</p>
            <button
              onClick={() => router.push(`/${locale}/checkout`)}
              className="w-full mt-5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {t('checkout')}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
