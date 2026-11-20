import type { Metadata, Viewport } from 'next';
import { RootProvider } from 'fumadocs-ui/provider/next';
import './global.css';
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-display',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  ),
  title: {
    default: 'SABCA Docs',
    template: '%s | SABCA Docs',
  },
  description:
    'Developer documentation for the SABCA mobile app, Supabase backend, public web portal, and store release pipelines.',
};

export const viewport: Viewport = {
  colorScheme: 'light dark',
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${plusJakarta.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-screen flex-col">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
