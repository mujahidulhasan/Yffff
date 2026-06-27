import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { SiteHeader } from '@/components/site-header';
import { Toaster } from 'sonner';
import { PwaRegister } from '@/components/pwa-register';

const siteName = 'Video Downloader';
const description =
  'Download video, audio, thumbnails and subtitles from any site supported by yt-dlp. Fast, free and mobile-first.';

export const metadata: Metadata = {
  title: {
    default: `${siteName} – Download from any site`,
    template: `%s · ${siteName}`,
  },
  description,
  applicationName: siteName,
  manifest: '/manifest.webmanifest',
  keywords: ['video downloader', 'yt-dlp', 'mp3', 'mp4', 'audio extractor'],
  openGraph: {
    title: siteName,
    description,
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: siteName, description },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#6d28d9',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <SiteHeader />
          <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
          <Toaster richColors position="top-center" />
          <PwaRegister />
        </ThemeProvider>
      </body>
    </html>
  );
}
