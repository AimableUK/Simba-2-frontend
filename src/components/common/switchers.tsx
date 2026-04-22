'use client';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Globe, Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const LANGS = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'rw', label: 'Kinyarwanda', flag: '🇷🇼' },
  { code: 'sw', label: 'Kiswahili', flag: '🇹🇿' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
];

export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const current = LANGS.find((l) => l.code === locale) || LANGS[0];

  function switchLocale(code: string) {
    const segments = pathname.split('/');
    segments[1] = code;
    router.push(segments.join('/'));
    setOpen(false);
  }

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm font-medium"
      >
        <Globe className="h-4 w-4" />
        <span className="hidden sm:inline">{current.flag} {current.label}</span>
        <span className="sm:hidden">{current.flag}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-card border border-border rounded-xl shadow-lg overflow-hidden min-w-[160px]">
            {LANGS.map((lang) => (
              <button
                key={lang.code}
                onClick={() => switchLocale(lang.code)}
                className={cn(
                  'flex items-center gap-2.5 w-full px-4 py-2.5 text-sm hover:bg-muted transition-colors text-left',
                  lang.code === locale && 'text-primary font-medium bg-primary/5'
                )}
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function ThemeSwitcher({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const t = useTranslations('common');

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className={cn(
        'p-2 rounded-lg hover:bg-muted transition-colors',
        className
      )}
      title={theme === 'dark' ? t('lightMode') : t('darkMode')}
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">{theme === 'dark' ? t('lightMode') : t('darkMode')}</span>
    </button>
  );
}
