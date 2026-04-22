'use client';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle } from 'lucide-react';
import { contactApi } from '@/lib/api';
import { useState } from 'react';

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  subject: z.string().min(3),
  message: z.string().min(10),
});
type FormData = z.infer<typeof schema>;

export default function ContactPage() {
  const t = useTranslations('contact');
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (data: FormData) => contactApi.submit(data),
    onSuccess: () => { setSent(true); reset(); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to send message'),
  });

  const info = [
    { icon: MapPin, label: t('address'), value: t('addressValue') },
    { icon: Mail, label: t('emailLabel'), value: 'info@simbasupermarket.rw' },
    { icon: Phone, label: t('phoneLabel'), value: '+250 788 000 000' },
    { icon: Clock, label: t('hours'), value: `${t('hoursValue')}\n${t('hoursValueSun')}` },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary/5 border-b border-border py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">{t('title')}</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">{t('subtitle')}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {/* Info */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Get in Touch</h2>
            <div className="space-y-5">
              {info.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex gap-4">
                  <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{label}</p>
                    {value.split('\n').map((v, i) => (
                      <p key={i} className="text-muted-foreground text-sm">{v}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 mt-8">
              <p className="font-semibold text-primary mb-1">Kigali Delivery Only</p>
              <p className="text-sm text-muted-foreground">We currently deliver within Kigali city. Orders placed before 2PM are delivered same day.</p>
            </div>
          </div>

          {/* Form */}
          <div className="bg-card border border-border rounded-2xl p-8">
            {sent ? (
              <div className="text-center py-8">
                <CheckCircle className="h-14 w-14 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Message Sent!</h3>
                <p className="text-muted-foreground">{t('success')}</p>
                <button onClick={() => setSent(false)} className="mt-6 text-primary hover:underline text-sm">
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
                <h2 className="text-lg font-bold mb-5">Send a Message</h2>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">{t('name')}</label>
                    <input {...register('name')} placeholder="Jean Uwimana" className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm" />
                    {errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">{t('email')}</label>
                    <input {...register('email')} type="email" placeholder="you@email.com" className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm" />
                    {errors.email && <p className="text-destructive text-xs mt-1">{errors.email.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">{t('phone')}</label>
                  <input {...register('phone')} type="tel" placeholder="+250 788 000 000" className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">{t('subject')}</label>
                  <input {...register('subject')} placeholder="Order issue, feedback..." className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm" />
                  {errors.subject && <p className="text-destructive text-xs mt-1">{errors.subject.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">{t('message')}</label>
                  <textarea {...register('message')} rows={4} placeholder="Tell us how we can help..." className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm resize-none" />
                  {errors.message && <p className="text-destructive text-xs mt-1">{errors.message.message}</p>}
                </div>

                <button type="submit" disabled={mutation.isPending} className="w-full bg-primary hover:bg-primary/90 disabled:opacity-60 text-primary-foreground font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2">
                  <Send className="h-4 w-4" />
                  {mutation.isPending ? t('sending') : t('send')}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
