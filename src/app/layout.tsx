import type { Metadata } from 'next';
import { Inter, Geist } from 'next/font/google';
import './globals.css';
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: { default: 'Simba Super Market', template: '%s | Simba Super Market' },
  description: "Kigali's favourite supermarket - fresh groceries delivered fast.",
  keywords: ['supermarket', 'kigali', 'rwanda', 'groceries', 'delivery'],
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <body className={`${geist.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
