'use client';
import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { CreditCard, Banknote, CheckCircle, Package } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { orderApi } from '@/lib/api';
import { useCart } from '@/hooks/useCart';
import { useSession } from '@/lib/auth-client';
import { formatPrice, getImageUrl } from '@/lib/utils';
import Link from 'next/link';

const schema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(10),
  street: z.string().min(3),
  district: z.string().min(2),
  sector: z.string().optional(),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function CheckoutPage() {
  const t = useTranslations('checkout');
  const locale = useLocale();
  const router = useRouter();
  const { data: session } = useSession();
  const { items, total, deliveryFee, grandTotal } = useCart();
  const [paymentMethod, setPaymentMethod] = useState<'dpo' | 'cash_on_delivery'>('dpo');
  const [success, setSuccess] = useState<{ orderNumber: string; orderId: string } | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: session?.user?.name || '' },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      orderApi.create({
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        deliveryAddress: data,
        notes: data.notes,
        paymentMethod,
      }).then((r) => r.data),
    onSuccess: (data) => {
      if (paymentMethod === 'dpo' && data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        setSuccess({ orderNumber: data.order.orderNumber, orderId: data.order.id });
      }
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Order failed'),
  });

  if (!session?.user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground mb-4">Please sign in to checkout</p>
        <Link href={`/${locale}/auth/sign-in`} className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium">Sign In</Link>
      </div>
    );
  }

  if (items.length === 0 && !success) {
    router.push(`/${locale}/cart`);
    return null;
  }

  if (success) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-md">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-10 w-10 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">{t('success')}</h1>
        <p className="text-muted-foreground mb-6">{t('successDesc', { number: success.orderNumber })}</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link href={`/${locale}/account/orders/${success.orderId}`} className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors">
            {t('trackOrder')}
          </Link>
          <Link href={`/${locale}/shop`} className="border border-border px-6 py-3 rounded-xl font-medium hover:bg-muted transition-colors">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-2xl font-bold mb-8">{t('title')}</h1>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* Delivery Info */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="font-semibold text-lg mb-5 flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                {t('delivery')}
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { name: 'fullName', label: t('fullName'), placeholder: 'Jean Uwimana', type: 'text', full: true },
                  { name: 'phone', label: t('phone'), placeholder: '+250 788 000 000', type: 'tel', full: false },
                  { name: 'street', label: t('street'), placeholder: 'KK 123 St, Kicukiro', type: 'text', full: false },
                  { name: 'district', label: t('district'), placeholder: 'Kicukiro', type: 'text', full: false },
                  { name: 'sector', label: t('sector'), placeholder: 'Niboye', type: 'text', full: false },
                ].map(({ name, label, placeholder, type, full }) => (
                  <div key={name} className={full ? 'sm:col-span-2' : ''}>
                    <label className="block text-sm font-medium mb-1.5">{label}</label>
                    <input
                      {...register(name as any)}
                      type={type}
                      placeholder={placeholder}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                    />
                    {errors[name as keyof FormData] && (
                      <p className="text-destructive text-xs mt-1">{errors[name as keyof FormData]?.message}</p>
                    )}
                  </div>
                ))}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1.5">{t('notes')}</label>
                  <textarea
                    {...register('notes')}
                    rows={2}
                    placeholder="Any special delivery instructions..."
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="font-semibold text-lg mb-5 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                {t('payment')}
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { value: 'dpo', label: t('dpo'), icon: CreditCard, desc: 'Visa, Mastercard, MTN, Airtel' },
                  { value: 'cash_on_delivery', label: t('cod'), icon: Banknote, desc: 'Pay when you receive' },
                ].map(({ value, label, icon: Icon, desc }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPaymentMethod(value as any)}
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                      paymentMethod === value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${paymentMethod === value ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div>
                      <p className="font-medium text-sm">{label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Summary */}
          <div>
            <div className="bg-card border border-border rounded-2xl p-6 sticky top-24">
              <h2 className="font-bold text-lg mb-4">{t('review')}</h2>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
                      <Image src={getImageUrl(item.product.images[0])} alt={item.product.name} fill className="object-contain p-1" sizes="48px" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium line-clamp-1">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                    </div>
                    <span className="text-xs font-semibold shrink-0">{formatPrice(item.product.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-border mt-4 pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span><span>{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Delivery</span><span>{formatPrice(deliveryFee)}</span>
                </div>
                <div className="flex justify-between font-bold text-base pt-1">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(grandTotal)}</span>
                </div>
              </div>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="w-full mt-5 bg-primary hover:bg-primary/90 disabled:opacity-60 text-primary-foreground font-semibold py-3.5 rounded-xl transition-colors"
              >
                {mutation.isPending
                  ? t('processing')
                  : paymentMethod === 'dpo'
                  ? t('payNow')
                  : t('placeOrder')}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
