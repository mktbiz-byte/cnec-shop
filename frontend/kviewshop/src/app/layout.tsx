import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';

export const metadata: Metadata = {
  title: {
    default: 'KviewShop - Global Beauty Incubator',
    template: '%s | KviewShop',
  },
  description:
    'Data-Driven Global Beauty Incubator. Premium K-Beauty products curated by your favorite creators.',
  keywords: ['K-Beauty', 'Korean cosmetics', 'beauty', 'skincare', 'makeup', 'influencer', 'creator shop'],
  authors: [{ name: 'KviewShop' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: ['ja_JP', 'ko_KR'],
    siteName: 'KviewShop',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
