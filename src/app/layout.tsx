import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono, Noto_Kufi_Arabic } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import './globals.css';
import ClientBootstrap from '@/components/ClientBootstrap'
import ThemeProvider from '@/components/ui/ThemeProvider'

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
  display: 'swap',
});

const notoKufiArabic = Noto_Kufi_Arabic({
  subsets: ['arabic'],
  variable: '--font-noto-kufi-arabic',
  display: 'swap',
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Asshrabha - أشربها | Marketplace',
    template: '%s | Asshrabha',
  },
  description: 'Asshrabha - Your trusted marketplace for buying and selling products across multiple providers.',
  keywords: ['marketplace', 'ecommerce', 'shopping', 'providers', 'أشربها', 'سوق'],
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Asshrabha',
  },
  openGraph: {
    title: 'Asshrabha - Marketplace',
    description: 'Your trusted marketplace for buying and selling products across multiple providers.',
    url: '/',
    siteName: 'Asshrabha',
    images: [
      {
        url: '/vercel.svg',
        width: 1200,
        height: 630,
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@asshrabha',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  height: 'device-height',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#6366f1' },
    { media: '(prefers-color-scheme: dark)', color: '#0f0f23' },
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      suppressHydrationWarning
      className={`${inter.variable} ${notoKufiArabic.variable} ${jetBrainsMono.variable}`}
    >
      <body>
        <a href="#__a11y_main" className="skip-link">Skip to content</a>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider>
            <ClientBootstrap />
            {children}
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
