import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#fc7d00",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: { default: "Simba Super Market", template: "%s | Simba Super Market" },
  description:
    "Kigali's favourite supermarket - fresh groceries, pick up at 9 branches across Kigali.",
  keywords: ["supermarket", "kigali", "rwanda", "groceries", "pickup", "simba"],
  authors: [{ name: "Simba Super Market" }],
  creator: "Simba Super Market",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Simba",
  },
  icons: {
    icon: [
      { url: "/icons/icon-72x72.png", sizes: "72x72", type: "image/png" },
      { url: "/icons/icon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "en_RW",
    siteName: "Simba Super Market",
    title: "Simba Super Market - Kigali",
    description: "Kigali's favourite supermarket. Fresh groceries, 9 branches.",
    images: [{ url: "/icons/icon-512x512.png", width: 512, height: 512 }],
  },
  other: {
    "msapplication-TileColor": "#fc7d00",
    "msapplication-config": "/browserconfig.xml",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        suppressHydrationWarning
        className="font-sans antialiased"
      >
        {children}
        <Script
          id="sw-register"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function () {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function (reg) { console.log('SW registered:', reg.scope); })
                    .catch(function (err) { console.warn('SW registration failed:', err); });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
