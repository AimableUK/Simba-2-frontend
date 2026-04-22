'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, ShoppingBag } from 'lucide-react';
import { signUp } from '@/lib/auth-client';
import { toast } from 'sonner';

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

export default function SignUpPage() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const result = await signUp.email({
        email: data.email,
        password: data.password,
        name: data.name,
        callbackURL: `/${locale}`,
      });
      if (result.error) {
        toast.error(result.error.message || 'Sign up failed');
      } else {
        toast.success('Account created! Welcome to Simba Super Market 🎉');
        router.push(`/${locale}`);
        router.refresh();
      }
    } catch {
      toast.error('Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href={`/${locale}`} className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <ShoppingBag className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">Simba Super Market</span>
          </Link>
          <h1 className="text-2xl font-bold mt-6 mb-1">{t('signUp')}</h1>
          <p className="text-muted-foreground text-sm">
            {t('hasAccount')}{' '}
            <Link href={`/${locale}/auth/sign-in`} className="text-primary font-medium hover:underline">
              {t('signInHere')}
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">{t('name')}</label>
            <input {...register('name')} placeholder="Jean Uwimana" className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm" />
            {errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">{t('email')}</label>
            <input {...register('email')} type="email" placeholder="you@example.com" className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm" />
            {errors.email && <p className="text-destructive text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">{t('phone')} <span className="text-muted-foreground font-normal">({t('optional') || 'optional'})</span></label>
            <input {...register('phone')} type="tel" placeholder="+250 788 000 000" className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">{t('password')}</label>
            <div className="relative">
              <input {...register('password')} type={showPw ? 'text' : 'password'} placeholder="Min. 8 characters" className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm pr-11" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-destructive text-xs mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">{t('confirmPassword')}</label>
            <input {...register('confirmPassword')} type="password" placeholder="••••••••" className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm" />
            {errors.confirmPassword && <p className="text-destructive text-xs mt-1">{errors.confirmPassword.message}</p>}
          </div>

          <p className="text-xs text-muted-foreground">{t('agreeTerms')}</p>

          <button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90 disabled:opacity-60 text-primary-foreground font-semibold py-3.5 rounded-xl transition-colors">
            {loading ? t('loading') : t('signUp')}
          </button>
        </form>
      </div>
    </div>
  );
}
